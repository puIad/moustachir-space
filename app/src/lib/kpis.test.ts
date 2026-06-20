import { describe, it, expect } from 'vitest';
import seed from '@/seed/seed.json';
import {
  toDataset,
  revenue,
  grossVolume,
  profit,
  profitMarginPct,
  mrr,
  arr,
  totalLeads,
  uniqueClients,
  salesmenCount,
  leadsByChannel,
  leadsByBranch,
  nps,
  csat,
  avgDealSize,
  satisfactionScore,
  filterDataset,
} from '@/lib/kpis';

// The credibility contract: with filter = All, kpis.ts must reproduce the
// warehouse anchors copied into seed.meta.kpiAnchors. REAL exactly, SIMULATED ±1%.
const ds = toDataset(seed as never);
const A = (seed as { meta: { kpiAnchors: Record<string, number> } }).meta.kpiAnchors;

const within = (got: number, want: number, pct: number) =>
  Math.abs(got - want) <= Math.abs(want) * pct;

describe('REAL anchors (must reconcile exactly)', () => {
  it('unique clients = 1451', () => {
    expect(uniqueClients(ds)).toBe(1451);
  });
  it('total leads = 1451', () => {
    expect(totalLeads(ds)).toBe(1451);
  });
  it('salesmen roster = 14', () => {
    expect(salesmenCount(ds)).toBe(14);
  });
  it('leads by channel match the four real counts', () => {
    expect(leadsByChannel(ds)).toEqual({
      'Campagne Marketing': 448,
      'Prospection Classique': 189,
      Website: 366,
      Événementiel: 448,
    });
  });
  it('leads by branch (warehouse codes) match the six real counts', () => {
    expect(leadsByBranch(ds)).toEqual({
      COM: 511,
      COMPTA: 25,
      CONSULTING: 35,
      FORMATION: 49,
      IDARATI: 17,
      UNASSIGNED: 814,
    });
  });
});

describe('SIMULATED money anchors (±1%)', () => {
  it('recognized revenue = 10,729,000 DA', () => {
    expect(revenue(ds)).toBe(10_729_000);
    expect(within(revenue(ds), A.recognizedRevenueDA, 0.01)).toBe(true);
  });
  it('gross platform volume = 12,145,000 DA', () => {
    expect(grossVolume(ds)).toBe(12_145_000);
  });
  it('projected margin = 6,043,400 DA', () => {
    expect(profit(ds)).toBe(6_043_400);
  });
  it('MRR = 16,000 DA (subscription monthly average)', () => {
    expect(mrr(ds)).toBe(16_000);
  });
  it('ARR = MRR * 12', () => {
    expect(arr(ds)).toBe(mrr(ds) * 12);
  });
  it('profit margin % ≈ 56.3', () => {
    expect(within(profitMarginPct(ds), 56.3, 0.01)).toBe(true);
  });
});

describe('SIMULATED satisfaction anchors', () => {
  it('NPS = 33.3%', () => {
    expect(nps(ds)).toBeCloseTo(33.3, 1);
  });
  it('CSAT is a 0–100 percentage', () => {
    const v = csat(ds);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
  it('satisfaction score is rating*20 on 0–100', () => {
    const v = satisfactionScore(ds);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});

describe('derived commercial KPIs', () => {
  it('average deal size = revenue / count(sales)', () => {
    expect(avgDealSize(ds)).toBe(Math.round(10_729_000 / 137));
  });
});

describe('filterDataset', () => {
  it('scopes sales to a single branch and shrinks revenue', () => {
    const all = revenue(ds);
    const scoped = revenue(filterDataset(ds, { branchKey: 'communication' }));
    expect(scoped).toBeGreaterThan(0);
    expect(scoped).toBeLessThan(all);
  });
  it('All scope is a no-op', () => {
    expect(revenue(filterDataset(ds, { branchKey: 'all' }))).toBe(revenue(ds));
  });
  it('date range filters sales by month', () => {
    const scoped = filterDataset(ds, { from: '2026-04', to: '2026-04' });
    expect(scoped.sales.every((s) => String(s.date).slice(0, 7) === '2026-04')).toBe(true);
  });
});
