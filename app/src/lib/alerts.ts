import type { Dataset } from './kpis';
import type { Project } from '@spec/entities';
import { salespersonPerformance } from './kpis';

export interface ChurnRiskAlert {
  id: string;
  name: string;
  company: string | null;
  industry: string;
  risk: number;
  branchKey: string;
}

export interface UpsellOpportunityAlert {
  id: string;
  name: string;
  company: string | null;
  score: number;
  branchKey: string;
}

export interface OverloadedConsultantAlert {
  id: string;
  fullName: string;
  utilizationRate: number;
  activeProjects: number;
}

export interface ServiceReworkRateAlert {
  service: string;
  reworkRate: number;
  total: number;
  overran: number;
}

export interface AlertsSummary {
  churnRisk: ChurnRiskAlert[];
  upsell: UpsellOpportunityAlert[];
  overloadedConsultants: OverloadedConsultantAlert[];
  delayedProjects: Project[];
  serviceReworkRates: ServiceReworkRateAlert[];
  topSales: any;
  underperformingSales: any;
}

export function computeAlerts(ds: Dataset): AlertsSummary {
  // 1. Churn Risk (score >= 0.6)
  const churnRisk = ds.clients
    .filter((c) => c.churnRiskScore >= 0.6)
    .map((c) => ({
      id: c.id,
      name: c.fullName ?? c.companyName ?? c.id,
      company: c.companyName,
      industry: c.industry ?? 'Secteur inconnu',
      risk: c.churnRiskScore,
      branchKey: c.branchKey,
    }))
    .sort((a, b) => b.risk - a.risk);

  // 2. Upsell Opportunities (customerScore >= 60 && churnRiskScore < 0.4)
  const upsell = ds.clients
    .filter((c) => c.customerScore >= 60 && c.churnRiskScore < 0.4)
    .map((c) => ({
      id: c.id,
      name: c.fullName ?? c.companyName ?? c.id,
      company: c.companyName,
      score: c.customerScore,
      branchKey: c.branchKey,
    }))
    .sort((a, b) => b.score - a.score);

  // 3. Overloaded Consultants (utilizationRate > 0.8 or activeProjects > 3)
  const overloadedConsultants = ds.consultants
    .map((c) => {
      const activeProjCount = ds.projects.filter(
        (p) => p.status === 'Active' && p.responsibleTeam.includes(c.id)
      ).length;
      return {
        id: c.id,
        fullName: c.fullName,
        utilizationRate: c.utilizationRate,
        activeProjects: activeProjCount,
      };
    })
    .filter((c) => c.utilizationRate > 0.8 || c.activeProjects > 3)
    .sort((a, b) => b.utilizationRate - a.utilizationRate);

  // 4. Delayed Projects Count & Service Rework Rates
  const delayedProjects = ds.projects.filter((p) => p.status === 'Delayed');
  
  const serviceStats = ds.projects.reduce((acc, p) => {
    if (p.actualHours == null) return acc;
    if (!acc[p.serviceLine]) acc[p.serviceLine] = { total: 0, overran: 0 };
    acc[p.serviceLine].total++;
    if (p.actualHours > p.estimatedHours) {
      acc[p.serviceLine].overran++;
    }
    return acc;
  }, {} as Record<string, { total: number; overran: number }>);

  const serviceReworkRates = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service,
      reworkRate: Math.round((stats.overran / stats.total) * 100),
      total: stats.total,
      overran: stats.overran,
    }))
    .filter((s) => s.reworkRate > 0)
    .sort((a, b) => b.reworkRate - a.reworkRate);

  // 5. Sales Performance
  const salesPerf = salespersonPerformance(ds);
  const topSales = salesPerf[0] || null;
  const underperformingSales = salesPerf.length > 1 ? salesPerf[salesPerf.length - 1] : null;

  return {
    churnRisk,
    upsell,
    overloadedConsultants,
    delayedProjects,
    serviceReworkRates,
    topSales,
    underperformingSales,
  };
}
