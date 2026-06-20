# Taxonomy — Canonical Branches, Services, Colors & Entity Ownership

> **Status:** LOCKED contract (Step 0). Every later session imports this; none redefines it.
> Sources reconciled: `NEW Implementation.docx`, `warehouse/dim_branch.csv`, `warehouse/dim_pricing.csv`,
> `warehouse/dim_stage.csv`, `warehouse/kpi_summary.json`, `warehouse/theme/moustachir_theme.json`,
> and the Locked Decisions in `IMPLEMENTATION_ROADMAP.md`.

The doc carries **four parallel name systems** for the same five business units. The roadmap lists them
in identical order, which fixes the row alignment below as the single source of truth. **Resolve by
`branchKey`, never by display string.**

---

## 1. The 5 canonical branches (+ 1 triage bucket)

| # | `branchKey` | Warehouse code | Service line name (INPUT) | Group-2 nav (EN) | Group-2 nav (FR) | "Les branches" (early doc) | Real clients |
|---|-------------|----------------|---------------------------|------------------|------------------|----------------------------|--------------|
| 1 | `consulting`     | `CONSULTING` | Consulting   | Consulting          | Consulting          | Moustachir Consulting | 35  |
| 2 | `comptabilite`   | `COMPTA`     | Rentabilité  | Comptabilité France | Comptabilité France | Moustachir Compta     | 25  |
| 3 | `communication`  | `COM`        | COMM         | Communication       | Communication       | COMM                  | 511 |
| 4 | `academy`        | `FORMATION`  | Academy      | Academy             | Academy             | Formation             | 49  |
| 5 | `management`     | `IDARATI`    | Idarati      | Management          | Management          | Idarati               | 17  |
| — | `unassigned`     | `UNASSIGNED` | —            | *(not a nav branch)* | —                  | —                     | 814 |

**Notes / resolved ambiguities**
- **`comptabilite` (COMPTA):** the warehouse branch label is *"Moustachir Compta (Idarati/Rentabilité)"* and
  carries two service lines — `compta_admin` and `rentabilite_commission`. The headline service is
  **Rentabilité** (the profitability/tax-optimization solution); the nav name is **Comptabilité France**. All
  three refer to one branch. Do **not** confuse with the `idarati_admin` service line, which belongs to branch 5.
- **`management` (IDARATI):** dual nature. Externally it is the **Idarati** administrative-services line
  (`idarati_admin`: legal/admin/tech support). Internally the Group-2 nav names it **Management** and its
  branch actions are HQ functions (Objectives, Internal Tasks, Evaluations, Decisions). Both map to one
  `branchKey = management`. Treat Idarati service delivery and internal management as the same workspace.
- **`unassigned` (UNASSIGNED):** **not** a business branch and **not** a Group-2 nav item. It is the triage
  bucket for the **814 leads** whose branch could not be resolved during ETL (`branch_confidence = inferred`).
  Surfaces only in the Data Manager / lead-routing UI, never as a branch color or analytics segment of its own.

---

## 2. Service-line reconciliation (granular `service_line` → branch)

`service_line` is the column present in `dim_client.csv` / `dim_pricing.csv` / `fact_transaction.csv`. It is
finer-grained than `branchKey`. Mapping (real distinct values, counts from `dim_client`):

| `service_line` | → `branchKey` | Warehouse branch | Clients | Pricing item group |
|----------------|---------------|------------------|---------|--------------------|
| `consulting_hourly`      | `consulting`    | CONSULTING | 35  | Consulting (hourly)         |
| `consulting_package`     | `consulting`    | CONSULTING | 0\* | Consulting (package)        |
| `compta_admin`           | `comptabilite`  | COMPTA     | 0\* | Accounting / admin filing   |
| `rentabilite_commission` | `comptabilite`  | COMPTA     | 25  | Profitability (commission)  |
| `com_branding`           | `communication` | COM        | 77  | Branding                    |
| `com_digital`            | `communication` | COM        | 63  | Digital / social            |
| `com_web_dev`            | `communication` | COM        | 371 | Web development             |
| `academy`                | `academy`       | FORMATION  | 49  | Training                    |
| `idarati_admin`          | `management`    | IDARATI    | 17  | Administrative services     |
| `unknown`                | `unassigned`    | UNASSIGNED | 814 | — (unrouted)                |

\* `consulting_package` and `compta_admin` exist in `dim_pricing` (priceable) but have 0 resolved real clients;
the foundry (Step 2) may generate `is_sample` rows against them. `revenue_model` per line: Consulting/Academy/
COM/Idarati = service fee; `rentabilite_commission` = commission %.

---

## 3. Branch color system

Source palette: `warehouse/theme/moustachir_theme.json` → `dataColors`. One color per branch, applied
consistently across sidebar accents, KPI card accents, chart series, status pills, and the client-process
timeline. **`#ef4444` (red) is reserved for negative/alert semantics** (churn, lost, delayed, overdue) and is
**never** a branch color.

| `branchKey` | Color | Hex | CSS token (Step 1 defines) | Rationale |
|-------------|-------|-----|----------------------------|-----------|
| `consulting`     | Sky blue | `#0ea5e9` | `--branch-consulting`     | Flagship / primary (also `tableAccent`) |
| `comptabilite`   | Green    | `#22c55e` | `--branch-comptabilite`   | Money / profitability |
| `communication`  | Pink     | `#ec4899` | `--branch-communication`  | Creative / brand |
| `academy`        | Amber    | `#f59e0b` | `--branch-academy`        | Learning / energy |
| `management`     | Violet   | `#8b5cf6` | `--branch-management`     | Authority / admin |
| `unassigned`     | Slate    | `#64748b` | `--branch-unassigned`     | Neutral / pending (not in data palette) |
| *(reserved)*     | Red      | `#ef4444` | `--state-negative`        | Alerts / lost / delayed — **not a branch** |

App chrome (from theme): background `#0f172a`, surface `#1e293b`, border `#334155`, foreground `#f8fafc`.

---

## 4. Branch → entity ownership matrix

Most entities are **shared** (exist for every branch, scoped by the `branch`/`branchKey` FK). A few are
**branch-scoped** in the Group-2 explorer. The doc's branch-specific UI labels are **aliases/views** over the
14 canonical entities (see `entities.ts`) — no new tables are created for them.

| Canonical entity | Consulting | Comptabilité | Communication | Academy | Management | UI alias in that branch |
|------------------|:---------:|:-----------:|:-------------:|:------:|:----------:|--------------------------|
| Client        | ✓ | ✓ | ✓ | ✓ | ✓ | Academy → **Student** |
| Lead          | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Interaction   | ✓ | ✓ | ✓ | ✓ | ✓ | "Meetings" / "Calls" |
| Opportunity   | ✓ | ✓ | ✓ | ✓ | ✓ | Academy → **Enrollment** |
| Proposal      | ✓ | ✓ | ✓ | ✓ | · | — |
| Sale          | ✓ | ✓ | ✓ | ✓ | · | Comptabilité → **Invoice** |
| Payment       | ✓ | ✓ | ✓ | ✓ | · | — |
| Expense       | · | ✓ (owner) | ✓ | · | ✓ | Comptabilité → **Tax Record** (category=Taxes) |
| MarketingCampaign | · | · | ✓ (owner) | · | · | — |
| Salesperson   | ✓ | ✓ | ✓ | ✓ | ✓ (roster owner) | — |
| Consultant    | ✓ (owner) | · | ✓ | ✓ | · | — |
| Project       | ✓ | · | ✓ | ✓ | · | Communication → **Content/Production**; Academy → **Cohort** |
| Task          | ✓ | ✓ | ✓ | ✓ | ✓ (owner) | Management → **Objective / Evaluation / Decision** (via `kind`) |
| Feedback      | ✓ | ✓ | ✓ | ✓ | ✓ | "Complaint" when `type` is negative |
| AuditEvent\*  | ✓ | ✓ | ✓ | ✓ | ✓ | History / Audit timeline (all entities) |

\* `AuditEvent` is the 15th, platform-level entity (not in the doc's "Identify the data" list) backing the
required History/Audit timeline and "see the process of the client" view. See `entities.ts`.

**Branch-specific action → entity write (for Step 7):**
- **Consulting:** Create Lead→`Lead`; Create Proposal→`Proposal`; Record Meeting→`Interaction`; Record Sale→`Sale`; Record Payment→`Payment`; Create Project→`Project`.
- **Comptabilité France:** Create Invoice→`Sale`(+`Payment`); Record Payment→`Payment`; Record Expense→`Expense`; Update Tax Record→`Expense{category:'Taxes'}`.
- **Communication:** Create Campaign→`MarketingCampaign`; Create Content / Record Production→`Project`/`Task`; Record Client Feedback→`Feedback`.
- **Academy:** Create Student→`Client`; Register Enrollment→`Opportunity`/`Sale`; Record Attendance→`Task`(under a cohort `Project`); Record Payment→`Payment`.
- **Management:** Create Objective / Internal Task / Evaluation→`Task{kind:…}`; Record Decision→`Task{kind:'decision'}` (+`AuditEvent`).

---

## 5. Stage taxonomy (client lifecycle per branch)

From `warehouse/dim_stage.csv`. The Group-2 "see the process of the client" timeline color-codes stages by
`meta_status`. Each branch has its own ordered stage names; `meta_status ∈ {lead, active, delivered}`.

| `branchKey` | Ordered stages (`stage_order`: name → meta_status) |
|-------------|----------------------------------------------------|
| `communication` (COM)   | 0 brief→lead · 1 design→active · 2 dev→active · 3 delivery→delivered · 4 closed→delivered |
| `consulting` (CONSULTING) | 0 request→lead · 1 scheduled→active · 2 session→active · 3 completed→delivered |
| `comptabilite` (COMPTA) | 0 onboard→lead · 1 contract→active · 2 monthly_filing→active · 3 renewed→delivered |
| `academy` (FORMATION)   | 0 enrolled→lead · 1 in_progress→active · 2 certified→delivered |
| `management` (IDARATI)  | 0 intake→lead · 1 processing→active · 2 submitted→active · 3 granted→delivered |
| `unassigned`            | 0 lead→lead |

`meta_status` colors for the timeline: `lead` → branch color @ 40% / muted; `active` → branch color full;
`delivered` → `#22c55e` (green) regardless of branch (success). Cross-branch funnel maps any branch's
`lead → active → delivered` onto the global Lead → Prospect → … → Won pipeline.
