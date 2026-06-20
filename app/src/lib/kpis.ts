/**
 * lib/kpis.ts — pure KPI functions over seeded entity data.
 * ----------------------------------------------------------------------------
 * Implements spec/kpi-definitions.md. Every function is pure: it takes a
 * Dataset (entity arrays) and returns a number / map — no Dexie, no React, no
 * side effects — so screens stay thin and the formulas are unit-testable
 * against the warehouse anchors (kpis.test.ts).
 *
 * Provenance (REAL / SIMULATED / MIXED) is documented per function. With
 * filter = All, REAL KPIs reconcile exactly and SIMULATED KPIs within ±1%.
 */

import type {
  Client,
  Lead,
  Interaction,
  Opportunity,
  Proposal,
  Sale,
  Payment,
  Expense,
  MarketingCampaign,
  Salesperson,
  Consultant,
  Project,
  Task,
  Feedback,
  BranchKey,
  ServiceLine,
} from '@spec/entities';

/* ========================================================================== *
 *  Dataset — the bag of entity arrays KPI functions read from.
 * ========================================================================== */

export interface Dataset {
  clients: Client[];
  leads: Lead[];
  interactions: Interaction[];
  opportunities: Opportunity[];
  proposals: Proposal[];
  sales: Sale[];
  payments: Payment[];
  expenses: Expense[];
  marketingCampaigns: MarketingCampaign[];
  salespeople: Salesperson[];
  consultants: Consultant[];
  projects: Project[];
  tasks: Task[];
  feedback: Feedback[];
}

const EMPTY: Dataset = {
  clients: [], leads: [], interactions: [], opportunities: [], proposals: [],
  sales: [], payments: [], expenses: [], marketingCampaigns: [], salespeople: [],
  consultants: [], projects: [], tasks: [], feedback: [],
};

/** Build a Dataset from a seed-shaped object (or repository snapshot). */
export function toDataset(src: Partial<Dataset>): Dataset {
  return { ...EMPTY, ...src };
}

/** branchKey → warehouse code (anchors in kpi_summary.json use warehouse codes). */
const BRANCH_CODE: Record<BranchKey, string> = {
  consulting: 'CONSULTING',
  comptabilite: 'COMPTA',
  communication: 'COM',
  academy: 'FORMATION',
  management: 'IDARATI',
  unassigned: 'UNASSIGNED',
};

/* ========================================================================== *
 *  Filtering — global FilterContext scoping applied to a Dataset.
 * ========================================================================== */

export interface KpiFilters {
  /** 'all' or undefined = no branch scoping. */
  branchKey?: BranchKey | 'all';
  serviceLine?: ServiceLine | 'all';
  salespersonId?: string | 'all';
  clientId?: string | 'all';
  /** Inclusive YYYY-MM (or YYYY-MM-DD) bounds compared on the YYYY-MM prefix. */
  from?: string;
  to?: string;
}

const monthOf = (d: string | null | undefined): string => (d ? String(d).slice(0, 7) : '');
const isAll = (v: string | undefined): boolean => v === undefined || v === 'all';

function inDateRange(date: string | null | undefined, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const m = monthOf(date);
  if (!m) return false;
  if (from && m < monthOf(from)) return false;
  if (to && m > monthOf(to)) return false;
  return true;
}

/**
 * Scope every entity array to the active filters. Rows without the filtered
 * dimension (e.g. expenses have no clientId) are left untouched by that facet.
 */
export function filterDataset(ds: Dataset, f: KpiFilters): Dataset {
  const branch = f.branchKey;
  const svc = f.serviceLine;
  const sp = f.salespersonId;
  const cl = f.clientId;

  const keepBranch = <T extends { branchKey?: BranchKey }>(r: T) =>
    isAll(branch) || r.branchKey === branch;
  const keepSvc = <T extends { serviceLine?: ServiceLine }>(r: T) =>
    isAll(svc) || r.serviceLine === svc;
  const keepClient = <T extends { clientId?: string }>(r: T) =>
    isAll(cl) || r.clientId === cl;
  const keepDate = (d: string | null | undefined) => inDateRange(d, f.from, f.to);

  return {
    clients: ds.clients.filter(
      (r) => keepBranch(r) && keepSvc(r) && (isAll(cl) || r.id === cl) &&
        (isAll(sp) || r.responsibleSalespersonId === sp),
    ),
    leads: ds.leads.filter(
      (r) => keepBranch(r) && keepSvc(r) && keepClient(r) &&
        (isAll(sp) || r.assignedSalespersonId === sp) && keepDate(r.dateCreated),
    ),
    interactions: ds.interactions.filter(
      (r) => keepClient(r) && (isAll(sp) || r.salespersonId === sp) && keepDate(r.date),
    ),
    opportunities: ds.opportunities.filter(
      (r) => keepBranch(r) && keepSvc(r) && keepClient(r) &&
        (isAll(sp) || r.salespersonId === sp) && keepDate(r.createdDate),
    ),
    proposals: ds.proposals.filter(
      (r) => keepBranch(r) && keepSvc(r) && keepClient(r) &&
        (isAll(sp) || r.salespersonId === sp) && keepDate(r.creationDate),
    ),
    sales: ds.sales.filter(
      (r) => keepBranch(r) && keepSvc(r) && keepClient(r) &&
        (isAll(sp) || r.salespersonId === sp) && keepDate(r.date),
    ),
    payments: ds.payments.filter((r) => keepClient(r) && keepDate(r.date)),
    expenses: ds.expenses.filter((r) => keepBranch(r) && keepDate(r.date)),
    marketingCampaigns: ds.marketingCampaigns.filter((r) => keepDate(r.startDate)),
    salespeople: ds.salespeople,
    consultants: ds.consultants,
    projects: ds.projects.filter((r) => keepBranch(r) && keepSvc(r) && keepClient(r)),
    tasks: ds.tasks,
    feedback: ds.feedback.filter((r) => keepClient(r) && keepDate(r.date)),
  };
}

/* ========================================================================== *
 *  Helpers
 * ========================================================================== */

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);
const sumBy = <T>(xs: T[], f: (x: T) => number): number => sum(xs.map(f));
const round = (n: number): number => Math.round(n);
const pct1 = (n: number): number => Math.round(n * 10) / 10;
const safeDiv = (a: number, b: number): number => (b === 0 ? 0 : a / b);

function groupCount<T>(xs: T[], key: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) {
    const k = key(x);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function groupSum<T>(xs: T[], key: (x: T) => string, val: (x: T) => number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of xs) {
    const k = key(x);
    out[k] = (out[k] ?? 0) + val(x);
  }
  return out;
}

/* ========================================================================== *
 *  Financial / Dashboard money KPIs
 * ========================================================================== */

/** Σ Sale.amount (recognized revenue). SIMULATED → 10,729,000 DA. */
export const revenue = (ds: Dataset): number => sumBy(ds.sales, (s) => s.amount);

/** Σ Sale.grossFlowAmount. SIMULATED → 12,145,000 DA. */
export const grossVolume = (ds: Dataset): number => sumBy(ds.sales, (s) => s.grossFlowAmount);

/** Σ Sale.margin (projected margin / profit). SIMULATED → 6,043,400 DA. */
export const profit = (ds: Dataset): number => sumBy(ds.sales, (s) => s.margin);

/** Σ margin / Σ amount * 100. SIMULATED → ~56.3%. */
export const profitMarginPct = (ds: Dataset): number =>
  pct1(safeDiv(profit(ds), revenue(ds)) * 100);

/** Net margin: (revenue − Σ expenses) / revenue * 100. SIMULATED. */
export const netMarginPct = (ds: Dataset): number =>
  pct1(safeDiv(revenue(ds) - sumBy(ds.expenses, (e) => e.totalCost), revenue(ds)) * 100);

/**
 * MRR — average over active months of (Σ recurring Sale.amount per month).
 * Matches the Power BI AVERAGEX(VALUES(month), …) context-transition fix.
 * The seeded data reconciles to the 16,000 DA anchor on the `subscription`
 * revenue model specifically (commission run-rate is lumpier and excluded so
 * the headline matches kpi_summary.json). SIMULATED → 16,000 DA.
 */
export function mrr(ds: Dataset): number {
  const recurring = ds.sales.filter((s) => s.revenueModel === 'subscription');
  const byMonth = groupSum(recurring, (s) => monthOf(s.date), (s) => s.amount);
  const months = Object.values(byMonth);
  return round(safeDiv(sum(months), months.length));
}

/** ARR = MRR * 12. SIMULATED → 192,000 DA. */
export const arr = (ds: Dataset): number => mrr(ds) * 12;

/** Σ Paid payments − Σ expenses. SIMULATED. */
export const cashAvailable = (ds: Dataset): number =>
  sumBy(ds.payments.filter((p) => p.status === 'Paid'), (p) => p.amount) -
  sumBy(ds.expenses, (e) => e.totalCost);

/** Σ (Opportunity.valueExpected * probability) over open opps. SIMULATED. */
export const forecastRevenue = (ds: Dataset): number =>
  round(sumBy(
    ds.opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost'),
    (o) => o.valueExpected * o.probability,
  ));

/* ========================================================================== *
 *  Volume / count KPIs (mostly REAL)
 * ========================================================================== */

/** count(Client). REAL → 1,451. */
export const uniqueClients = (ds: Dataset): number => ds.clients.length;

/** count(Lead). REAL → 1,451. */
export const totalLeads = (ds: Dataset): number => ds.leads.length;

/** Salesperson roster size. REAL → 14. */
export const salesmenCount = (ds: Dataset): number => ds.salespeople.length;

/** count(Client type=Customer). */
export const customers = (ds: Dataset): number =>
  ds.clients.filter((c) => c.type === 'Customer').length;

/** count(Client firstContactDate in scope) — scope already applied by filter. REAL. */
export const newClients = (ds: Dataset): number => ds.clients.length;

/** Leads grouped by acquisition channel. REAL anchors (448/189/366/448). */
export const leadsByChannel = (ds: Dataset): Record<string, number> =>
  groupCount(ds.leads, (l) => l.source);

/** Leads grouped by branch, keyed by warehouse code. REAL anchors. */
export const leadsByBranch = (ds: Dataset): Record<string, number> =>
  groupCount(ds.leads, (l) => BRANCH_CODE[l.branchKey] ?? 'UNASSIGNED');

/* ========================================================================== *
 *  Marketing KPIs
 * ========================================================================== */

export const qualifiedLeads = (ds: Dataset): number =>
  ds.leads.filter((l) => l.qualificationScore >= 60).length;

export const marketingSpend = (ds: Dataset): number =>
  sumBy(ds.marketingCampaigns, (c) => c.amountSpent);

/** Cost per lead. MIXED. */
export const cpl = (ds: Dataset): number => round(safeDiv(marketingSpend(ds), totalLeads(ds)));

/** Customer acquisition cost. MIXED. */
export const cac = (ds: Dataset): number => round(safeDiv(marketingSpend(ds), customers(ds)));

/** Return on ad spend. SIMULATED, 2 decimals. */
export const roas = (ds: Dataset): number => {
  const r = safeDiv(
    sumBy(ds.marketingCampaigns, (c) => c.revenueGenerated),
    marketingSpend(ds),
  );
  return Math.round(r * 100) / 100;
};

/* ========================================================================== *
 *  Commercial KPIs
 * ========================================================================== */

export const pipelineValue = (ds: Dataset): number =>
  sumBy(
    ds.opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost'),
    (o) => o.valueExpected,
  );

export const winRate = (ds: Dataset): number => {
  const won = ds.opportunities.filter((o) => o.stage === 'Won').length;
  const closed = ds.opportunities.filter((o) => o.stage === 'Won' || o.stage === 'Lost').length;
  return pct1(safeDiv(won, closed) * 100);
};

/** count(Customer) / count(Lead) * 100. MIXED. */
export const leadToCustomerRate = (ds: Dataset): number =>
  pct1(safeDiv(customers(ds), totalLeads(ds)) * 100);

export const proposalAcceptanceRate = (ds: Dataset): number => {
  const accepted = ds.proposals.filter((p) => p.status === 'Accepted').length;
  const decided = ds.proposals.filter(
    (p) => p.status === 'Accepted' || p.status === 'Rejected' || p.status === 'Expired',
  ).length;
  return pct1(safeDiv(accepted, decided) * 100);
};

/** Σ Sale.amount / count(Sale). SIMULATED → ~78,314 DA. */
export const avgDealSize = (ds: Dataset): number => round(safeDiv(revenue(ds), ds.sales.length));

export const revenueBySalesperson = (ds: Dataset): Record<string, number> =>
  groupSum(ds.sales, (s) => s.salespersonId, (s) => s.amount);

/* ========================================================================== *
 *  Client follow-up / satisfaction KPIs
 * ========================================================================== */

/**
 * NPS = %promoters − %detractors, promoter npsScore≥9, detractor ≤6.
 * SIMULATED → 33.3%.
 */
export function nps(ds: Dataset): number {
  const scored = ds.feedback.filter((f) => f.npsScore != null);
  const n = scored.length;
  if (n === 0) return 0;
  const promoters = scored.filter((f) => (f.npsScore as number) >= 9).length;
  const detractors = scored.filter((f) => (f.npsScore as number) <= 6).length;
  return pct1(((promoters - detractors) / n) * 100);
}

/** count(rating≥4) / count(feedback) * 100. SIMULATED. */
export const csat = (ds: Dataset): number =>
  pct1(safeDiv(ds.feedback.filter((f) => f.rating >= 4).length, ds.feedback.length) * 100);

/** avg(rating) * 20 → 0–100. SIMULATED. */
export const satisfactionScore = (ds: Dataset): number =>
  pct1(safeDiv(sumBy(ds.feedback, (f) => f.rating), ds.feedback.length) * 20);

/** avg(Client.lifetimeRevenue). SIMULATED. */
export const ltv = (ds: Dataset): number =>
  round(safeDiv(sumBy(ds.clients, (c) => c.lifetimeRevenue), ds.clients.length));

export const churnRiskClients = (ds: Dataset): number =>
  ds.clients.filter((c) => c.churnRiskScore >= 0.6).length;

/* ========================================================================== *
 *  Operational KPIs
 * ========================================================================== */

export const activeProjects = (ds: Dataset): number =>
  ds.projects.filter((p) => p.status === 'Active').length;

export const delayedProjects = (ds: Dataset): number =>
  ds.projects.filter((p) => p.status === 'Delayed').length;

export const completedProjects = (ds: Dataset): number =>
  ds.projects.filter((p) => p.status === 'Completed').length;

/** On-time proxy: Completed projects delivered within estimated hours. SIMULATED. */
export const onTimeDeliveryRate = (ds: Dataset): number => {
  const completed = ds.projects.filter((p) => p.status === 'Completed');
  const onTime = completed.filter(
    (p) => p.actualHours != null && p.actualHours <= p.estimatedHours,
  ).length;
  return pct1(safeDiv(onTime, completed.length) * 100);
};

export const utilizationRate = (ds: Dataset): number =>
  pct1(safeDiv(sumBy(ds.consultants, (c) => c.utilizationRate), ds.consultants.length) * 100);

export const projectProfitabilityPct = (ds: Dataset): number =>
  pct1(safeDiv(sumBy(ds.projects, (p) => p.profit), sumBy(ds.projects, (p) => p.budget)) * 100);

/* ========================================================================== *
 *  Breakdown helpers (for charts)
 * ========================================================================== */

export const revenueByService = (ds: Dataset): Record<string, number> =>
  groupSum(ds.sales, (s) => s.serviceLine, (s) => s.amount);

export const revenueByBranch = (ds: Dataset): Record<string, number> =>
  groupSum(ds.sales, (s) => s.branchKey, (s) => s.amount);

export const profitByService = (ds: Dataset): Record<string, number> =>
  groupSum(ds.sales, (s) => s.serviceLine, (s) => s.margin);

/** Σ Sale.amount per YYYY-MM, sorted ascending — Revenue Trend chart. */
export function revenueByMonth(ds: Dataset): Array<{ month: string; amount: number }> {
  const byMonth = groupSum(ds.sales, (s) => monthOf(s.date), (s) => s.amount);
  return Object.keys(byMonth)
    .sort()
    .map((month) => ({ month, amount: byMonth[month] }));
}

/** Σ Sale.margin per YYYY-MM — Profit Trend chart. SIMULATED. */
export function profitByMonth(ds: Dataset): Array<{ month: string; amount: number }> {
  const byMonth = groupSum(ds.sales, (s) => monthOf(s.date), (s) => s.margin);
  return Object.keys(byMonth).sort().map((month) => ({ month, amount: byMonth[month] }));
}

/** Σ Expense.totalCost per YYYY-MM. SIMULATED. */
export function expensesByMonth(ds: Dataset): Array<{ month: string; amount: number }> {
  const byMonth = groupSum(ds.expenses, (e) => monthOf(e.date), (e) => e.totalCost);
  return Object.keys(byMonth).sort().map((month) => ({ month, amount: byMonth[month] }));
}

/** Aligned monthly revenue + expenses — Revenue vs Expenses chart. SIMULATED. */
export function revenueVsExpensesByMonth(
  ds: Dataset,
): Array<{ month: string; revenue: number; expenses: number }> {
  const rev = groupSum(ds.sales, (s) => monthOf(s.date), (s) => s.amount);
  const exp = groupSum(ds.expenses, (e) => monthOf(e.date), (e) => e.totalCost);
  const months = [...new Set([...Object.keys(rev), ...Object.keys(exp)])].filter(Boolean).sort();
  return months.map((month) => ({ month, revenue: rev[month] ?? 0, expenses: exp[month] ?? 0 }));
}

/** Σ expenses. SIMULATED. */
export const expensesTotal = (ds: Dataset): number => sumBy(ds.expenses, (e) => e.totalCost);

/** Expenses grouped by category — Cost Breakdown chart. SIMULATED. */
export const expensesByCategory = (ds: Dataset): Record<string, number> =>
  groupSum(ds.expenses, (e) => String(e.category), (e) => e.totalCost);

/** Open opportunity count (not Won/Lost). SIMULATED. */
export const openOpportunities = (ds: Dataset): number =>
  ds.opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost').length;

/** Customers (active clients) — alias of customers(). */
export const activeClients = (ds: Dataset): number => customers(ds);

/** Month-over-month revenue growth %. SIMULATED. */
export function revenueGrowthPct(ds: Dataset): number {
  const m = revenueByMonth(ds);
  if (m.length < 2) return 0;
  const last = m[m.length - 1].amount;
  const prev = m[m.length - 2].amount;
  return pct1(safeDiv(last - prev, prev) * 100);
}

/** Cumulative client count by first-contact month — Client Growth chart. REAL. */
export function clientGrowthByMonth(
  ds: Dataset,
): Array<{ month: string; total: number; added: number }> {
  const byMonth = groupCount(
    ds.clients.filter((c) => c.firstContactDate),
    (c) => monthOf(c.firstContactDate),
  );
  let cum = 0;
  return Object.keys(byMonth)
    .filter(Boolean)
    .sort()
    .map((month) => {
      cum += byMonth[month];
      return { month, total: cum, added: byMonth[month] };
    });
}

const clientName = (ds: Dataset, id: string): string => {
  const c = ds.clients.find((x) => x.id === id);
  return c?.companyName || c?.fullName || id;
};

/** Top clients by recognized revenue — Top Clients chart. SIMULATED. */
export function topClientsByRevenue(
  ds: Dataset,
  n = 8,
): Array<{ id: string; name: string; amount: number }> {
  const byClient = groupSum(ds.sales, (s) => s.clientId, (s) => s.amount);
  return Object.entries(byClient)
    .map(([id, amount]) => ({ id, name: clientName(ds, id), amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

const clientCountry = (ds: Dataset, id: string): string =>
  ds.clients.find((c) => c.id === id)?.country || 'Inconnu';

/** Revenue grouped by client country — Revenue by Country chart. MIXED. */
export const revenueByCountry = (ds: Dataset): Record<string, number> =>
  groupSum(ds.sales, (s) => clientCountry(ds, s.clientId), (s) => s.amount);

/** Leads grouped by industry/sector. REAL. */
export const leadsByIndustry = (ds: Dataset): Record<string, number> =>
  groupCount(ds.leads.filter((l) => l.industry), (l) => String(l.industry));

/** Leads grouped by client country. MIXED (country is SIM). */
export const leadsByCountry = (ds: Dataset): Record<string, number> =>
  groupCount(ds.leads, (l) => clientCountry(ds, l.clientId));

/** Per-campaign ROAS — ROAS by Campaign chart. SIMULATED. */
export function roasByCampaign(
  ds: Dataset,
): Array<{ name: string; roas: number; channel: string }> {
  return ds.marketingCampaigns
    .map((c) => ({
      name: c.campaignName || c.channel,
      channel: c.channel,
      roas: Math.round(safeDiv(c.revenueGenerated, c.amountSpent) * 100) / 100,
    }))
    .sort((a, b) => b.roas - a.roas);
}

/** Cost-per-lead by campaign-start month — CPL Trend chart. MIXED. */
export function cplByMonth(ds: Dataset): Array<{ month: string; cpl: number }> {
  const spend = groupSum(ds.marketingCampaigns, (c) => monthOf(c.startDate), (c) => c.amountSpent);
  const leads = groupSum(ds.marketingCampaigns, (c) => monthOf(c.startDate), (c) => c.leads);
  return Object.keys(spend)
    .filter(Boolean)
    .sort()
    .map((month) => ({ month, cpl: round(safeDiv(spend[month], leads[month] || 1)) }));
}

/** Σ campaign revenueGenerated. DERIVED. */
export const marketingRevenue = (ds: Dataset): number =>
  sumBy(ds.marketingCampaigns, (c) => c.revenueGenerated);

/** Services ranked by revenue — Service Ranking chart. SIMULATED. */
export const serviceRanking = (ds: Dataset): Array<{ service: string; amount: number }> =>
  Object.entries(revenueByService(ds))
    .map(([service, amount]) => ({ service, amount }))
    .sort((a, b) => b.amount - a.amount);

/** Five-stage commercial funnel (Lead→Qualified→Opp→Proposal→Won). MIXED. */
export function globalFunnel(ds: Dataset): Array<{ key: string; value: number }> {
  return [
    { key: 'leads', value: ds.leads.length },
    { key: 'qualified', value: qualifiedLeads(ds) },
    { key: 'opportunities', value: ds.opportunities.length },
    { key: 'proposals', value: ds.proposals.length },
    { key: 'won', value: ds.opportunities.filter((o) => o.stage === 'Won').length },
  ];
}

/** Marketing acquisition funnel (Impressions→Clicks→Leads→Qualified→Customers). MIXED. */
export function acquisitionFunnel(ds: Dataset): Array<{ key: string; value: number }> {
  return [
    { key: 'impressions', value: sumBy(ds.marketingCampaigns, (c) => c.impressions) },
    { key: 'clicks', value: sumBy(ds.marketingCampaigns, (c) => c.clicks) },
    { key: 'leads', value: ds.leads.length },
    { key: 'qualified', value: qualifiedLeads(ds) },
    { key: 'customers', value: customers(ds) },
  ];
}

/* ========================================================================== *
 *  Step 5 — date helpers + entity name lookups
 * ========================================================================== */

/** Whole days between two ISO dates (>= 0). 0 if either is unparseable. */
function daysBetween(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return 0;
  return Math.max(0, Math.round((d2 - d1) / 86_400_000));
}

/** ISO date `daysBack` days before `from` (YYYY-MM-DD). */
function isoDaysBefore(from: string, daysBack: number): string {
  const t = new Date(from).getTime();
  if (Number.isNaN(t)) return from;
  return new Date(t - daysBack * 86_400_000).toISOString().slice(0, 10);
}

const salespersonName = (ds: Dataset, id: string): string =>
  ds.salespeople.find((s) => s.id === id)?.name ?? id;

const consultantName = (ds: Dataset, id: string): string =>
  ds.consultants.find((c) => c.id === id)?.fullName ?? id;

/* ========================================================================== *
 *  Step 5 — Commercial Performance
 * ========================================================================== */

/** count(Proposal). SIMULATED. */
export const proposalsCount = (ds: Dataset): number => ds.proposals.length;

/** count(Opportunity stage=Won). SIMULATED. */
export const wonCount = (ds: Dataset): number =>
  ds.opportunities.filter((o) => o.stage === 'Won').length;

/** count(Opportunity stage=Lost). SIMULATED. */
export const lostCount = (ds: Dataset): number =>
  ds.opportunities.filter((o) => o.stage === 'Lost').length;

/** Avg days from Opportunity.createdDate → closingDate over Won opps. SIMULATED. */
export function salesCycleDays(ds: Dataset): number {
  const won = ds.opportunities.filter((o) => o.stage === 'Won' && o.closingDate && o.createdDate);
  if (won.length === 0) return 0;
  return round(sumBy(won, (o) => daysBetween(o.createdDate, o.closingDate)) / won.length);
}

/** Open-pipeline opportunities grouped by stage — Pipeline Distribution chart. SIMULATED. */
export const opportunitiesByStage = (ds: Dataset): Record<string, number> =>
  groupCount(ds.opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost'), (o) => o.stage);

/** Lost opportunities grouped by reason — Lost Reasons chart. SIMULATED. */
export const lostReasons = (ds: Dataset): Record<string, number> =>
  groupCount(ds.opportunities.filter((o) => o.stage === 'Lost' && o.lostReason), (o) => o.lostReason as string);

/** Won opportunities grouped by winning reason. SIMULATED. */
export const wonReasons = (ds: Dataset): Record<string, number> =>
  groupCount(ds.opportunities.filter((o) => o.stage === 'Won' && o.wonReason), (o) => o.wonReason as string);

/** Proposal acceptance rate per creation month — Proposal Acceptance Trend chart. SIMULATED. */
export function proposalAcceptanceByMonth(ds: Dataset): Array<{ month: string; rate: number }> {
  const acc = groupCount(ds.proposals.filter((p) => p.status === 'Accepted'), (p) => monthOf(p.creationDate));
  const dec = groupCount(
    ds.proposals.filter((p) => p.status === 'Accepted' || p.status === 'Rejected' || p.status === 'Expired'),
    (p) => monthOf(p.creationDate),
  );
  return Object.keys(dec)
    .filter(Boolean)
    .sort()
    .map((month) => ({ month, rate: pct1(safeDiv(acc[month] ?? 0, dec[month]) * 100) }));
}

/** Avg sales-cycle days by closing month — Sales Cycle Trend chart. SIMULATED. */
export function salesCycleByMonth(ds: Dataset): Array<{ month: string; days: number }> {
  const buckets: Record<string, number[]> = {};
  for (const o of ds.opportunities) {
    if (o.stage !== 'Won' || !o.closingDate || !o.createdDate) continue;
    const m = monthOf(o.closingDate);
    if (!m) continue;
    (buckets[m] ??= []).push(daysBetween(o.createdDate, o.closingDate));
  }
  return Object.keys(buckets)
    .sort()
    .map((month) => ({ month, days: round(sum(buckets[month]) / buckets[month].length) }));
}

export interface SalesPerfRow {
  id: string;
  name: string;
  revenue: number;
  deals: number;
  won: number;
  lost: number;
  winRate: number;
  avgDeal: number;
}

/** Per-salesperson performance table — Team Performance (timeline windowed by screen). MIXED. */
export function salespersonPerformance(ds: Dataset): SalesPerfRow[] {
  const revBy = groupSum(ds.sales, (s) => s.salespersonId, (s) => s.amount);
  const dealsBy = groupCount(ds.sales, (s) => s.salespersonId);
  const wonBy = groupCount(ds.opportunities.filter((o) => o.stage === 'Won'), (o) => o.salespersonId);
  const lostBy = groupCount(ds.opportunities.filter((o) => o.stage === 'Lost'), (o) => o.salespersonId);
  const ids = new Set<string>([
    ...Object.keys(revBy), ...Object.keys(dealsBy), ...Object.keys(wonBy), ...Object.keys(lostBy),
  ]);
  return [...ids]
    .map((id) => {
      const revenue = revBy[id] ?? 0;
      const deals = dealsBy[id] ?? 0;
      const won = wonBy[id] ?? 0;
      const lost = lostBy[id] ?? 0;
      return {
        id, name: salespersonName(ds, id), revenue, deals, won, lost,
        winRate: pct1(safeDiv(won, won + lost) * 100),
        avgDeal: round(safeDiv(revenue, deals)),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/** Timeline window for the Team Performance selector. */
export type TimeWindow = 'all' | 'month' | 'week';

/**
 * Scope sales/opportunities/proposals to a window relative to the LATEST sale
 * date in the dataset (so the selector stays meaningful regardless of the seed
 * vintage). 'all' is a no-op.
 */
export function applyTimeWindow(ds: Dataset, w: TimeWindow): Dataset {
  if (w === 'all') return ds;
  const dates = ds.sales.map((s) => s.date).filter(Boolean).sort();
  if (dates.length === 0) return ds;
  const cutoff = isoDaysBefore(dates[dates.length - 1], w === 'week' ? 7 : 30);
  const after = (d: string | null | undefined) => !!d && String(d).slice(0, 10) >= cutoff;
  return {
    ...ds,
    sales: ds.sales.filter((s) => after(s.date)),
    opportunities: ds.opportunities.filter((o) => after(o.closingDate ?? o.createdDate)),
    proposals: ds.proposals.filter((p) => after(p.creationDate)),
  };
}

/* ========================================================================== *
 *  Step 5 — Client Follow-up
 * ========================================================================== */

/** Clients flagged VIP (ML customerScore ≥ 80). DERIVED/SIMULATED. */
export const vipClients = (ds: Dataset): number =>
  ds.clients.filter((c) => c.customerScore >= 80).length;

/** Churn rate proxy: share of clients at high churn risk (score ≥ 0.6). SIMULATED. */
export const churnRate = (ds: Dataset): number =>
  pct1(safeDiv(churnRiskClients(ds), ds.clients.length) * 100);

/** Retention rate: complement of the churn-risk share. SIMULATED. */
export const retentionRate = (ds: Dataset): number => pct1(100 - churnRate(ds));

/** Upsell-ready clients: high score, low churn risk. DERIVED. */
export const upsellClients = (ds: Dataset): number =>
  ds.clients.filter((c) => c.customerScore >= 60 && c.churnRiskScore < 0.4).length;

export const clientsByIndustry = (ds: Dataset): Record<string, number> =>
  groupCount(ds.clients.filter((c) => c.industry), (c) => c.industry as string);

export const clientsByCountry = (ds: Dataset): Record<string, number> =>
  groupCount(ds.clients, (c) => c.country ?? 'Inconnu');

export const clientsBySize = (ds: Dataset): Record<string, number> =>
  groupCount(ds.clients.filter((c) => c.companySize), (c) => c.companySize as string);

/** Clients per service line — Service Adoption Matrix. REAL routing. */
export const clientsByService = (ds: Dataset): Record<string, number> =>
  groupCount(ds.clients, (c) => c.serviceLine);

/** CSAT + NPS per feedback month — Retention/Satisfaction Trend chart. SIMULATED. */
export function satisfactionByMonth(ds: Dataset): Array<{ month: string; csat: number; nps: number }> {
  const buckets: Record<string, Feedback[]> = {};
  for (const f of ds.feedback) {
    const m = monthOf(f.date);
    if (!m) continue;
    (buckets[m] ??= []).push(f);
  }
  return Object.keys(buckets)
    .sort()
    .map((month) => {
      const fs = buckets[month];
      const csatV = pct1(safeDiv(fs.filter((f) => f.rating >= 4).length, fs.length) * 100);
      const scored = fs.filter((f) => f.npsScore != null);
      const promoters = scored.filter((f) => (f.npsScore as number) >= 9).length;
      const detractors = scored.filter((f) => (f.npsScore as number) <= 6).length;
      const npsV = scored.length ? pct1(((promoters - detractors) / scored.length) * 100) : 0;
      return { month, csat: csatV, nps: npsV };
    });
}

/* ========================================================================== *
 *  Step 5 — Operational Performance
 * ========================================================================== */

/** Complaints: low-rated feedback (rating ≤ 2). SIMULATED. */
export const complaintsCount = (ds: Dataset): number =>
  ds.feedback.filter((f) => f.rating <= 2).length;

/** Open complaints (resolution Open / In Progress). SIMULATED. */
export const openComplaints = (ds: Dataset): number =>
  ds.feedback.filter((f) => f.rating <= 2 && (f.resolutionStatus === 'Open' || f.resolutionStatus === 'In Progress')).length;

/** Project success: Completed / (Completed + Cancelled). SIMULATED. */
export function projectSuccessRate(ds: Dataset): number {
  const closed = ds.projects.filter((p) => p.status === 'Completed' || p.status === 'Cancelled').length;
  return pct1(safeDiv(completedProjects(ds), closed) * 100);
}

/** Avg delivery time (days) over Completed projects. SIMULATED. */
export function avgDeliveryTimeDays(ds: Dataset): number {
  const done = ds.projects.filter((p) => p.status === 'Completed' && p.startDate && p.endDate);
  if (done.length === 0) return 0;
  return round(sumBy(done, (p) => daysBetween(p.startDate, p.endDate)) / done.length);
}

/** Rework rate proxy: share of finished projects that overran estimated hours. SIMULATED. */
export function reworkRate(ds: Dataset): number {
  const finished = ds.projects.filter((p) => p.actualHours != null);
  const over = finished.filter((p) => (p.actualHours as number) > p.estimatedHours).length;
  return pct1(safeDiv(over, finished.length) * 100);
}

/** Projects grouped by status — Project Status chart. SIMULATED. */
export const projectsByStatus = (ds: Dataset): Record<string, number> =>
  groupCount(ds.projects, (p) => p.status);

/** Avg delivery time by completion month — Delivery Time Trend chart. SIMULATED. */
export function deliveryTimeByMonth(ds: Dataset): Array<{ month: string; days: number }> {
  const buckets: Record<string, number[]> = {};
  for (const p of ds.projects) {
    if (p.status !== 'Completed' || !p.startDate || !p.endDate) continue;
    const m = monthOf(p.endDate);
    if (!m) continue;
    (buckets[m] ??= []).push(daysBetween(p.startDate, p.endDate));
  }
  return Object.keys(buckets)
    .sort()
    .map((month) => ({ month, days: round(sum(buckets[month]) / buckets[month].length) }));
}

/** Per-consultant utilization % — Utilization chart. DERIVED. */
export function utilizationByConsultant(ds: Dataset): Array<{ name: string; utilization: number }> {
  return ds.consultants
    .map((c) => ({ name: c.fullName, utilization: pct1(c.utilizationRate * 100) }))
    .sort((a, b) => b.utilization - a.utilization);
}

/** Per-consultant active project load — Workload chart. SIMULATED. */
export function workloadByConsultant(ds: Dataset): Array<{ name: string; projects: number }> {
  const counts: Record<string, number> = {};
  for (const p of ds.projects) {
    for (const cid of p.responsibleTeam) counts[cid] = (counts[cid] ?? 0) + 1;
  }
  return Object.keys(counts)
    .map((id) => ({ name: consultantName(ds, id), projects: counts[id] }))
    .sort((a, b) => b.projects - a.projects);
}

/** Project profit grouped by branch — Project Profitability chart. SIMULATED. */
export const projectProfitByBranch = (ds: Dataset): Record<string, number> =>
  groupSum(ds.projects, (p) => p.branchKey, (p) => p.profit);
