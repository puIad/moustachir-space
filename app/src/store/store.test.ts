import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import seed from '@/seed/seed.json';
import { db } from '@/store/db';
import { seedIfNeeded, resetToSeed, getSeedStatus } from '@/store/seed';
import { clientsRepo, leadsRepo, salesRepo } from '@/store/repositories';

const META = (seed as { meta: { counts: Record<string, number> } }).meta;

async function freshDb() {
  await db.delete();
  await db.open();
}

describe('seeding', () => {
  beforeEach(freshDb);

  it('seeds an empty DB once with all entity rows', async () => {
    const result = await seedIfNeeded();
    expect(result.seeded).toBe(true);
    expect(await db.clients.count()).toBe(META.counts.clients);
    expect(await db.leads.count()).toBe(META.counts.leads);
    expect(await db.sales.count()).toBe(META.counts.sales);
    expect(await db.salespeople.count()).toBe(META.counts.salespeople);
  });

  it('is idempotent — second call does not re-import', async () => {
    await seedIfNeeded();
    const second = await seedIfNeeded();
    expect(second.seeded).toBe(false);
    expect(await db.clients.count()).toBe(META.counts.clients);
  });

  it('resetToSeed clears mutations and restores seed counts', async () => {
    await seedIfNeeded();
    await db.clients.add({ id: 'TEMP1' } as never);
    expect(await db.clients.count()).toBe(META.counts.clients + 1);
    await resetToSeed();
    expect(await db.clients.count()).toBe(META.counts.clients);
    expect(await db.clients.get('TEMP1')).toBeUndefined();
  });

  it('getSeedStatus reports seeded totals', async () => {
    await seedIfNeeded();
    const status = await getSeedStatus();
    expect(status.seeded).toBe(true);
    expect(status.totalRows).toBeGreaterThan(6000);
    expect(status.byTable.clients).toBe(META.counts.clients);
  });
});

describe('repository CRUD round-trip', () => {
  beforeEach(async () => {
    await freshDb();
    await seedIfNeeded();
  });

  it('create → reload → present persists', async () => {
    const created = await clientsRepo.create({
      id: 'C9999', type: 'Customer', companyName: 'Round Trip SARL',
    } as never);
    expect(created.id).toBe('C9999');
    // reopen the DB to prove durability
    db.close();
    await db.open();
    const fetched = await clientsRepo.getById('C9999');
    expect(fetched?.companyName).toBe('Round Trip SARL');
  });

  it('update mutates a persisted row', async () => {
    await clientsRepo.update('C0000', { city: 'Oran' } as never);
    expect((await clientsRepo.getById('C0000'))?.city).toBe('Oran');
  });

  it('remove deletes a row', async () => {
    await clientsRepo.remove('C0000');
    expect(await clientsRepo.getById('C0000')).toBeUndefined();
  });

  it('list filters, sorts and paginates', async () => {
    const page = await leadsRepo.list({
      where: { source: 'Website' },
      sortBy: 'id',
      limit: 10,
    });
    expect(page.rows.length).toBe(10);
    expect(page.total).toBe(366);
    expect(page.rows.every((l) => l.source === 'Website')).toBe(true);
  });

  it('list predicate + descending sort', async () => {
    const page = await salesRepo.list({
      predicate: (s) => s.amount >= 100_000,
      sortBy: 'amount',
      sortDir: 'desc',
      limit: 3,
    });
    expect(page.rows[0].amount).toBeGreaterThanOrEqual(page.rows[1].amount);
    expect(page.rows.every((s) => s.amount >= 100_000)).toBe(true);
  });
});
