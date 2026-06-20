# KPI Definitions — formulas, source fields, REAL vs SIMULATED

> **Status:** LOCKED contract (Step 0). `app/src/lib/kpis.ts` (Step 3) implements these as pure functions over
> repository data; analytics screens (Steps 4–5) call them. Field references use `spec/entities.ts` names.
>
> **Provenance tags**
> - **REAL** — computable from real warehouse data (Axe2 commercial / Axe3 salesman acquisition). Must reconcile.
> - **SIMULATED** — depends on `isSample` rows (Axe1 financial, Axe4 operational, NPS). UI shows projection badge.
> - **MIXED** — real denominator/leads, simulated numerator (revenue/spend).
>
> **Real anchors** (filter = All): unique clients **1,451** · total leads **1,451** · salesmen **14** ·
> recognized revenue **10,729,000 DA** · gross volume **12,145,000 DA** · projected margin **6,043,400 DA** ·
> avg MRR **16,000 DA** · NPS **33.3%** · tax saving **53.75%**.
> Currency formatting: `#,##0 "DA"`. Period comparisons use `period_date` / `date` fields.

Notation: `Σ` = sum over current filter scope; `count(X)` = row count; `prev` = previous comparable period.

---

## 1. Dashboard (executive)

| KPI | Formula | Source fields | Tag |
|-----|---------|---------------|-----|
| **Revenue** | `Σ Sale.amount` | `sales.amount` (recognized) | SIMULATED → **10,729,000 DA** |
| **Profit** | `Σ Sale.margin` | `sales.margin` | SIMULATED → **6,043,400 DA** |
| **Active Clients** | `count(Client where status='Customer' AND lastActivityDate within window)` | `clients.status,lastActivityDate` | MIXED |
| **New Clients** | `count(Client where firstContactDate in period)` | `clients.firstContactDate` | REAL |
| **Leads** | `count(Lead)` | `leads.id` | REAL → **1,451** |
| **Opportunities** | `count(Opportunity where stage ∉ {Won,Lost})` | `opportunities.stage` | SIMULATED |
| **Active Projects** | `count(Project where status='Active')` | `projects.status` | SIMULATED |
| **Satisfaction Score** | `avg(Feedback.rating) * 20` (→0–100) | `feedback.rating` | SIMULATED |
| **Revenue Growth %** | `(Revenue − Revenue_prev) / Revenue_prev * 100` | `sales.amount,date` | SIMULATED |
| **Profit Margin %** | `Σ Sale.margin / Σ Sale.amount * 100` | `sales.margin,amount` | SIMULATED → ~56.3% |
| **Lead → Client Conversion** | `count(Client type=Customer) / count(Lead) * 100` | `clients.type,leads` | MIXED |
| **Retention Rate** | see §5 | — | SIMULATED |
| **Project Success Rate** | see §6 | — | SIMULATED |

---

## 2. Financial Performance

| KPI | Formula | Source fields | Tag |
|-----|---------|---------------|-----|
| **Revenue** | `Σ Sale.amount` | `sales.amount` | SIMULATED → **10,729,000 DA** |
| **Gross Platform Volume** | `Σ Sale.grossFlowAmount` | `sales.grossFlowAmount` | SIMULATED → **12,145,000 DA** |
| **MRR** (Monthly Recurring Revenue) | `avg over active months of (Σ recurring Sale.amount per month)` — recurring = `revenueModel∈{subscription,commission}`; matches the Power BI `AVERAGEX(VALUES(month), …)` context-transition fix | `sales.amount,revenueModel,date` | SIMULATED → **16,000 DA** |
| **ARR** (Annual Recurring Revenue) | `MRR * 12` | derived from MRR | SIMULATED → 192,000 DA |
| **Gross Margin** | `Σ Sale.margin / Σ Sale.amount * 100` (pre-overhead, uses `costRatio`) | `sales.margin,amount` | SIMULATED |
| **Net Margin** | `(Σ Sale.amount − Σ Expense.totalCost) / Σ Sale.amount * 100` | `sales.amount,expenses.totalCost` | SIMULATED |
| **Profit Margin %** | `Σ Sale.margin / Σ Sale.amount * 100` | `sales` | SIMULATED → ~56.3% |
| **Revenue Growth %** | `(Rev − Rev_prev)/Rev_prev * 100` | `sales.amount,date` | SIMULATED |
| **Cash Available** | `Σ Payment.amount(status=Paid) − Σ Expense.totalCost` | `payments,expenses` | SIMULATED |
| **Forecast Revenue** | `Σ (Opportunity.valueExpected * probability)` for open opps + recurring run-rate | `opportunities.valueExpected,probability` | SIMULATED |
| **Marketing Cost** | `Σ Expense.totalCost where category=Marketing` (+ `Σ Campaign.amountSpent`) | `expenses.category,marketingCampaigns.amountSpent` | SIMULATED |
| **Operational Cost** | `Σ Project.cost` | `projects.cost` | SIMULATED |
| **Consultant Cost** | `Σ Expense.totalCost where category∈{Salary,Freelancers}` (consultant dept) | `expenses` | SIMULATED |
| **Administrative Cost** | `Σ Expense.totalCost where category∈{HR,Software,Taxes,Other}` | `expenses` | SIMULATED |
| **Best ROI Activity** | `argmax_service( Σ margin / Σ attributed cost )` | `sales,expenses,marketingCampaigns` | SIMULATED |

Breakdowns (Revenue/Profit by Service/Country/Client/Salesperson) = the above grouped by
`serviceLine` / `Client.country` / `clientId` / `salespersonId`.

---

## 3. Marketing Performance

| KPI | Formula | Source fields | Tag |
|-----|---------|---------------|-----|
| **Leads Generated** | `count(Lead)` (group by `source`) | `leads.source` | REAL → 1,451 (448/189/366/448) |
| **Qualified Leads** | `count(Lead where qualificationScore ≥ 60)` | `leads.qualificationScore` | SIMULATED |
| **Marketing Spend** | `Σ MarketingCampaign.amountSpent` | `marketingCampaigns.amountSpent` | SIMULATED |
| **CPL** (Cost per Lead) | `Marketing Spend / count(Lead)` | `marketingCampaigns.amountSpent, leads` | MIXED |
| **CAC** (Cust. Acq. Cost) | `Marketing Spend / count(Client type=Customer acquired in period)` | `marketingCampaigns, clients.type` | MIXED |
| **ROAS** | `Σ MarketingCampaign.revenueGenerated / Σ MarketingCampaign.amountSpent` | `marketingCampaigns` | SIMULATED |
| **Visitor → Lead Conversion** | `count(Lead source=Website) / website_visits` (visits SIM) | `leads.source` | SIMULATED |
| **Reach / Impressions / Clicks** | `Σ` of campaign fields | `marketingCampaigns.{reach,impressions,clicks}` | SIMULATED |

Audience analytics (Leads by Country/Industry/Company Size) = `count(Lead)` grouped by
`Client.country` / `leads.industry` / `Client.companySize`. **Leads by Channel/Branch are REAL** (anchors).

---

## 4. Commercial Performance

| KPI | Formula | Source fields | Tag |
|-----|---------|---------------|-----|
| **Pipeline Value** | `Σ Opportunity.valueExpected where stage ∉ {Won,Lost}` | `opportunities.valueExpected,stage` | SIMULATED |
| **Win Rate** | `count(Opp stage=Won) / count(Opp stage∈{Won,Lost}) * 100` | `opportunities.stage` | SIMULATED |
| **Lead → Customer Rate** | `count(Client type=Customer) / count(Lead) * 100` | `clients.type,leads` | MIXED |
| **Proposal Acceptance Rate** | `count(Proposal status=Accepted) / count(Proposal status∈{Accepted,Rejected,Expired}) * 100` | `proposals.status` | SIMULATED |
| **Average Deal Size** | `Σ Sale.amount / count(Sale)` | `sales.amount` | SIMULATED → ~78,314 DA (10,729,000/137) |
| **Sales Cycle Duration** | `avg(Opportunity.closingDate − createdDate)` for Won | `opportunities.createdDate,closingDate` | SIMULATED |
| **Revenue per Salesperson** | `Σ Sale.amount group by salespersonId` | `sales.amount,salespersonId` | MIXED (roster REAL) |
| **Sales Funnel** | stage counts: Lead→Prospect→Meeting→Proposal→Sale | `leads,opportunities.stage,proposals,sales` | MIXED |
| **Team Performance** (per salesperson, window All/last-month/last-week) | `count(Interaction type=Call)`, `count(Interaction type=Meeting)`, `count(Opportunity)`, `count(Opp stage=Won)`, `Σ Sale.amount` | `interactions,opportunities,sales` filtered by `salespersonId` + window | MIXED |
| **Lost / Winning Reasons** | freq of `Opportunity.lostReason / wonReason` | `opportunities.{lostReason,wonReason}` | SIMULATED |

---

## 5. Client Follow-up

| KPI | Formula | Source fields | Tag |
|-----|---------|---------------|-----|
| **Total Clients** | `count(Client)` | `clients` | REAL → 1,451 |
| **Active Clients** | `count(Client status=Customer AND lastActivityDate in window)` | `clients` | MIXED |
| **VIP Clients** | `count(Client where lifetimeRevenue ≥ p90)` | `clients.lifetimeRevenue` | SIMULATED |
| **Retention Rate** | `clients active at period end & start / clients active at start * 100` | `clients.lastActivityDate` | SIMULATED |
| **Churn Rate** | `100 − Retention Rate` (or `count(type=Former Customer)/count(active prev)`) | `clients.type` | SIMULATED |
| **NPS** | `(%promoters − %detractors)` where promoter `npsScore≥9`, detractor `≤6` | `feedback.npsScore` | SIMULATED → **33.3%** |
| **CSAT** | `count(Feedback rating ≥ 4) / count(Feedback) * 100` | `feedback.rating` | SIMULATED |
| **LTV** (Lifetime Value) | `avg(Client.lifetimeRevenue)` or `Avg Deal Size × Avg Purchases × (1/Churn Rate)` | `clients.lifetimeRevenue` | SIMULATED |
| **Time to First Purchase** | `avg(Client.firstPurchaseDate − firstContactDate)` | `clients` | SIMULATED |
| **Average Purchases** | `avg(Client.numberPurchases)` | `clients.numberPurchases` | SIMULATED |
| **Upsell Opportunities** | `count(Client using exactly 1 serviceLine with high customerScore)` | `clients.serviceLine,customerScore` | SIMULATED |
| **Clients Likely to Churn** | `count(Client where churnRiskScore ≥ 0.6)` | `clients.churnRiskScore` | SIMULATED |

Segmentation (by Industry/Country/Company Size/Service) = `count(Client)` grouped by the field.

---

## 6. Operational Performance

| KPI | Formula | Source fields | Tag |
|-----|---------|---------------|-----|
| **Active Projects** | `count(Project status=Active)` | `projects.status` | SIMULATED |
| **Delayed Projects** | `count(Project status=Delayed OR endDate>planned)` | `projects.status,endDate` | SIMULATED |
| **Completed Projects** | `count(Project status=Completed)` | `projects.status` | SIMULATED |
| **Project Success Rate** | `count(Completed on-time & in-budget) / count(Completed) * 100` | `projects.{status,endDate,cost,budget}` | SIMULATED |
| **On-Time Delivery Rate** | `count(Project endDate ≤ planned end) / count(Completed) * 100` | `projects.endDate` | SIMULATED |
| **Delivery Time** | `avg(Project.endDate − startDate)` for Completed | `projects.{startDate,endDate}` | SIMULATED |
| **Utilization Rate** | `Σ Consultant.utilizationRate / count(Consultant)` = billable hrs / capacity hrs | `consultants.utilizationRate` (← `tasks.actualHours`) | SIMULATED |
| **Rework Rate** | `count(Task where rework/reopened) / count(Task) * 100` | `tasks.status` | SIMULATED |
| **Project Profitability** | `Σ Project.profit / Σ Project.budget * 100` | `projects.{profit,budget}` | SIMULATED |
| **Available Capacity** | `Σ Consultant.availabilityPercentage` | `consultants.availabilityPercentage` | SIMULATED |
| **Workload / Resource Allocation** | hours per consultant: `Σ Task.actualHours group by employeeId` | `tasks.actualHours,employeeId` | SIMULATED |

---

## 7. ML-derived scores (foundry, Step 2 — logged in `data_quality.json`)

| Score | Definition | Inputs | Model | Range |
|-------|-----------|--------|-------|-------|
| **Customer Score** | engagement × value composite | `lifetimeRevenue, numberPurchases, recency, interactions` | rule + k-means tier | 0–100 |
| **Churn Risk Score** | P(client lapses) | `lastActivityDate gap, frequency, satisfaction` | logistic | 0–1 |
| **Lead Qualification Score** | P(lead converts) | `source, industry, expectedBudget, engagement` | rule/weighted | 0–100 |
| **Consultant Performance Score** | delivery quality composite | `deliverySuccessRate, avgClientRating, utilizationRate` | weighted | 0–100 |

---

## 8. Reconciliation rules (every implementing session honors)

1. With **filter = All**, REAL KPIs reproduce the anchors **exactly**; SIMULATED KPIs reproduce within **±1%**.
2. Any KPI tagged **SIMULATED** or **MIXED** that surfaces a number on screen ⇒ the view shows the
   **"PROJECTION — sample data"** badge (driven by `isSample` rows / `meta.provenance`).
3. Never let synthetic data shift a REAL headline. The four channel lead counts, the six branch lead counts,
   the 1,451 client total, and the 14-salesman roster are immutable from `warehouse/kpi_summary.json`.
4. All money KPIs are DA integers formatted `#,##0 "DA"`. Percentages to 1 decimal. Ratios (ROAS) to 2 decimals.
