/**
 * actions.test.ts — TDD for the convert-and-sell flow (Step 7).
 * Run: npm test (vitest)
 *
 * RED: write test, watch fail. GREEN: implement lib/actions.ts.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/store/db';
import { seedIfNeeded } from '@/store/seed';
import {
  leadsRepo,
  opportunitiesRepo,
  salesRepo,
  paymentsRepo,
  auditEventsRepo,
} from '@/store/repositories';
import {
  convertLeadToOpportunity,
  recordSaleFromOpportunity,
  recordPayment,
  createLead,
  dropOpportunity,
  updateFeedbackResolution,
} from '@/lib/actions';
import { loadDataset } from '@/store/repositories';
import { revenue } from '@/lib/kpis';

async function freshDb() {
  await db.delete();
  await db.open();
  await seedIfNeeded();
}

describe('convert-and-sell flow', () => {
  beforeEach(freshDb);

  it('convertLeadToOpportunity marks lead converted and creates opportunity + audit', async () => {
    const { rows: leads } = await leadsRepo.list({ limit: 1 });
    const lead = leads[0];
    expect(lead).toBeDefined();

    const oppCountBefore = await opportunitiesRepo.count();
    const opp = await convertLeadToOpportunity(lead.id, lead.assignedSalespersonId ?? 'Walid');

    // Lead is now converted
    const updatedLead = await leadsRepo.getById(lead.id);
    expect(updatedLead?.converted).toBe(true);
    expect(updatedLead?.status).toBe('Converted');

    // Opportunity was created
    expect(await opportunitiesRepo.count()).toBe(oppCountBefore + 1);
    expect(opp.clientId).toBe(lead.clientId);
    expect(opp.stage).toBe('Qualified');

    // Audit trail
    const { rows: audit } = await auditEventsRepo.list({
      where: { entityId: lead.id, action: 'convert' },
    });
    expect(audit.length).toBeGreaterThan(0);
  });

  it('recordSaleFromOpportunity creates sale, marks opportunity Won, writes audit', async () => {
    const { rows: leads } = await leadsRepo.list({ limit: 1 });
    const opp = await convertLeadToOpportunity(leads[0].id, 'Walid');

    const saleCountBefore = await salesRepo.count();
    const sale = await recordSaleFromOpportunity(opp.id, {
      amount: 50000,
      grossFlowAmount: 60000,
      margin: 25000,
      serviceLine: opp.serviceLine,
      date: '2026-06-20',
    });

    // Opportunity stage = Won
    const updatedOpp = await opportunitiesRepo.getById(opp.id);
    expect(updatedOpp?.stage).toBe('Won');

    // Sale was created
    expect(await salesRepo.count()).toBe(saleCountBefore + 1);
    expect(sale.clientId).toBe(opp.clientId);
    expect(sale.amount).toBe(50000);
    expect(sale.isSample).toBe(true);

    // Audit trail
    const { rows: audit } = await auditEventsRepo.list({
      where: { entityId: opp.id, action: 'status_change' },
    });
    expect(audit.length).toBeGreaterThan(0);
  });

  it('recordPayment creates payment, updates sale paymentStatus, writes audit', async () => {
    const { rows: leads } = await leadsRepo.list({ limit: 1 });
    const opp = await convertLeadToOpportunity(leads[0].id, 'Walid');
    const sale = await recordSaleFromOpportunity(opp.id, {
      amount: 50000, grossFlowAmount: 60000, margin: 25000,
      serviceLine: opp.serviceLine, date: '2026-06-20',
    });

    const payCountBefore = await paymentsRepo.count();
    const payment = await recordPayment(sale.id, {
      amount: 50000,
      method: 'Bank Transfer',
      date: '2026-06-21',
    });

    // Payment created
    expect(await paymentsRepo.count()).toBe(payCountBefore + 1);
    expect(payment.saleId).toBe(sale.id);
    expect(payment.status).toBe('Paid');

    // Sale updated
    const updatedSale = await salesRepo.getById(sale.id);
    expect(updatedSale?.paymentStatus).toBe('Paid');
  });

  it('full flow: lead → opportunity → sale → payment → KPI revenue increases', async () => {
    const dsBefore = await loadDataset();
    const revenueBefore = revenue(dsBefore);

    const { rows: leads } = await leadsRepo.list({ where: { converted: false }, limit: 1 });
    const lead = leads[0];
    const opp = await convertLeadToOpportunity(lead.id, 'Walid');
    const sale = await recordSaleFromOpportunity(opp.id, {
      amount: 75000, grossFlowAmount: 90000, margin: 40000,
      serviceLine: opp.serviceLine, date: '2026-06-20',
    });
    await recordPayment(sale.id, { amount: 75000, method: 'Cash', date: '2026-06-21' });

    const dsAfter = await loadDataset();
    const revenueAfter = revenue(dsAfter);

    expect(revenueAfter).toBe(revenueBefore + 75000);
  });

  it('createLead persists a new lead + audit event', async () => {
    const { rows: clients } = await await db.clients.toArray().then(rows => ({ rows }));
    const client = clients[0];
    const countBefore = await leadsRepo.count();

    const lead = await createLead({
      clientId: client.id,
      source: 'Website',
      branchKey: 'consulting',
      serviceLine: 'consulting_hourly',
    });

    expect(await leadsRepo.count()).toBe(countBefore + 1);
    expect(lead.clientId).toBe(client.id);
    expect(lead.status).toBe('New');
    expect(lead.isSample).toBe(true);

    const { rows: audit } = await auditEventsRepo.list({ where: { entityId: lead.id } });
    expect(audit.length).toBeGreaterThan(0);
  });

  it('dropOpportunity sets stage=Lost and writes audit', async () => {
    const { rows: leads } = await leadsRepo.list({ limit: 1 });
    const opp = await convertLeadToOpportunity(leads[0].id, 'Walid');

    await dropOpportunity(opp.id, 'Budget trop faible');

    const updated = await opportunitiesRepo.getById(opp.id);
    expect(updated?.stage).toBe('Lost');
    expect(updated?.lostReason).toBe('Budget trop faible');
  });

  it('updateFeedbackResolution changes status and writes audit', async () => {
    const { rows: feedbacks } = await db.feedback.toArray().then(rows => ({ rows }));
    const fb = feedbacks[0];

    await updateFeedbackResolution(fb.id, 'Resolved');

    const updated = await db.feedback.get(fb.id);
    expect(updated?.resolutionStatus).toBe('Resolved');

    const { rows: audit } = await auditEventsRepo.list({
      where: { entityId: fb.id, action: 'status_change' },
    });
    expect(audit.length).toBeGreaterThan(0);
  });
});
