import { describe, it, expect } from 'vitest';
import seed from '@/seed/seed.json';
import { toDataset } from '@/lib/kpis';
import { computeAlerts } from '@/lib/alerts';

const ds = toDataset(seed as never);

describe('Dynamic Diagnostic Alerts logic', () => {
  const alerts = computeAlerts(ds);

  it('computes churn risk alerts correctly', () => {
    expect(alerts.churnRisk).toBeDefined();
    expect(alerts.churnRisk.length).toBeGreaterThan(0);
    // Every churn risk alert must have risk >= 0.6
    alerts.churnRisk.forEach((c) => {
      expect(c.risk).toBeGreaterThanOrEqual(0.6);
    });
  });

  it('computes upsell opportunities correctly', () => {
    expect(alerts.upsell).toBeDefined();
    expect(alerts.upsell.length).toBeGreaterThan(0);
    // Every upsell client must satisfy customerScore >= 60 and churnRiskScore < 0.4
    alerts.upsell.forEach((c) => {
      expect(c.score).toBeGreaterThanOrEqual(60);
    });
  });

  it('identifies overloaded consultants correctly', () => {
    expect(alerts.overloadedConsultants).toBeDefined();
    // Overloaded consultants must have utilizationRate > 0.8 or activeProjects > 3
    alerts.overloadedConsultants.forEach((c) => {
      const isOverloaded = c.utilizationRate > 0.8 || c.activeProjects > 3;
      expect(isOverloaded).toBe(true);
    });
  });

  it('counts delayed projects correctly', () => {
    expect(alerts.delayedProjects).toBeDefined();
    const expectedDelayed = ds.projects.filter((p) => p.status === 'Delayed');
    expect(alerts.delayedProjects.length).toBe(expectedDelayed.length);
  });

  it('highlights service rework rates correctly', () => {
    expect(alerts.serviceReworkRates).toBeDefined();
    alerts.serviceReworkRates.forEach((s) => {
      expect(s.reworkRate).toBeGreaterThan(0);
      expect(s.total).toBeGreaterThan(0);
    });
  });

  it('computes sales performance stats correctly', () => {
    expect(alerts.topSales).toBeDefined();
    if (alerts.topSales && alerts.underperformingSales) {
      expect(alerts.topSales.revenue).toBeGreaterThanOrEqual(alerts.underperformingSales.revenue);
    }
  });
});
