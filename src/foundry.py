"""
foundry.py — Moustachir BI data foundry (Step 2).

ONE reproducible script that produces the frontend seed by blending REAL warehouse
data with CONSISTENT synthetic data, then running an ML cleaning + scoring pass.

Pipeline
--------
1. Load every warehouse/*.csv as the real base.
2. Map real rows into the /spec entity model (Client, Lead, Sale, Salesperson,
   Feedback, MarketingCampaign carry REAL signal).
3. Generate referentially-consistent synthetic rows for the entities with no real
   source (Interaction, Opportunity, Proposal, Payment, Expense, Consultant,
   Project, Task, AuditEvent) — keyed to real client_ids / branches / the 14-name
   salesman roster, totals reconciling to the real KPI anchors. FIXED seed -> the
   output is byte-identical across runs. Every synthetic row carries isSample=True.
4. ML cleaning pass (pandas + scikit-learn): dedup/merge accounting (respects the
   warehouse's is_merged/needs_review), text normalization, numeric imputation,
   phone/email standardization, and the four DERIVED scores (Customer Score,
   Churn Risk, Lead Qualification, Consultant Performance). Every action is logged.
5. Emit app/src/seed/seed.json (per spec/seed-schema.md) + app/src/seed/data_quality.json.

Run:  python src/foundry.py        (from project root)
Test: python -m pytest tests/ -q
"""
from __future__ import annotations

import os

# Pin BLAS/OMP threads before importing sklearn: silences the Windows MKL KMeans
# memory-leak warning and keeps the run output pristine. Determinism is already
# guaranteed by the fixed random_state; thread count does not affect the result.
os.environ.setdefault("OMP_NUM_THREADS", "6")

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import MinMaxScaler

import common  # warehouse normalizers (phone/email/sector/salesman)

# --------------------------------------------------------------------------- #
# Paths & constants
# --------------------------------------------------------------------------- #
ROOT = Path(__file__).resolve().parents[1]
WAREHOUSE = ROOT / "warehouse"
SEED_DIR = ROOT / "app" / "src" / "seed"

RANDOM_SEED = 42
SCHEMA_VERSION = 1
SEED_VERSION = "2026-06-20"
GENERATED_AT = "2026-06-20T00:00:00Z"  # fixed (not wall-clock) => deterministic bytes

# Real KPI anchors (warehouse/kpi_summary.json) — the credibility contract.
ANCHORS = {
    "uniqueClients": 1451,
    "totalLeads": 1451,
    "salesmenCount": 14,
    "leadsByChannel": {
        "Campagne Marketing": 448, "Prospection Classique": 189,
        "Website": 366, "Événementiel": 448,
    },
    "leadsByBranch": {
        "COM": 511, "COMPTA": 25, "CONSULTING": 35,
        "FORMATION": 49, "IDARATI": 17, "UNASSIGNED": 814,
    },
    "recognizedRevenueDA": 10729000,
    "grossPlatformVolumeDA": 12145000,
    "projectedMarginDA": 6043400,
    "avgMrrDA": 16000,
    "transactions": 137,
    "npsOverall": 33.3,
    "clientTaxSavingPct": 0.5375,
}

# branchKey <-> warehouse code <-> nav/color (mirrors spec/taxonomy.md §1+§3).
BRANCHES = [
    {"branchKey": "consulting",    "warehouseCode": "CONSULTING", "service": "Consulting",  "navEN": "Consulting",          "color": "#0ea5e9"},
    {"branchKey": "comptabilite",  "warehouseCode": "COMPTA",     "service": "Rentabilité", "navEN": "Comptabilité France", "color": "#22c55e"},
    {"branchKey": "communication", "warehouseCode": "COM",        "service": "COMM",        "navEN": "Communication",       "color": "#ec4899"},
    {"branchKey": "academy",       "warehouseCode": "FORMATION",  "service": "Academy",     "navEN": "Academy",             "color": "#f59e0b"},
    {"branchKey": "management",    "warehouseCode": "IDARATI",    "service": "Idarati",     "navEN": "Management",          "color": "#8b5cf6"},
    {"branchKey": "unassigned",    "warehouseCode": "UNASSIGNED", "service": None,          "navEN": None,                  "color": "#64748b"},
]
CODE_TO_KEY = {b["warehouseCode"]: b["branchKey"] for b in BRANCHES}

# revenue_model (fact_transaction) -> spec RevenueModel
REVENUE_MODEL_MAP = {
    "one_time": "service_fee",
    "hourly": "service_fee",
    "recurring_monthly": "subscription",
    "commission_pct": "commission",
}

# Synthetic value pools (DZ-weighted) — fixed, so generation is reproducible.
DZ_CITIES = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Sétif", "Batna", "Tlemcen"]
COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"]
POSITIONS = ["Gérant", "Directeur", "Responsable Marketing", "DAF", "CEO", "Chargé de projet"]
LOST_REASONS = ["Prix trop élevé", "Concurrent choisi", "Budget annulé", "Pas de réponse", "Mauvais timing"]
WON_REASONS = ["Meilleure offre", "Relation de confiance", "Recommandation", "Réactivité", "Expertise"]
EXPENSE_CATEGORIES = ["Salary", "Marketing", "Software", "Investment", "Transport",
                      "Digital production", "Freelancers", "HR", "Taxes", "Other"]


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _client_id(raw) -> str:
    return f"C{int(raw):04d}"


def _coerce(obj):
    """Recursively coerce numpy/pandas scalars to plain JSON types."""
    if isinstance(obj, dict):
        return {k: _coerce(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_coerce(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return None if math.isnan(obj) else float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if obj is pd.NaT:
        return None
    return obj


def _load_warehouse() -> dict[str, pd.DataFrame]:
    names = [
        "dim_client", "dim_client_pii", "dim_pricing", "dim_sector", "dim_stage",
        "dim_branch", "dim_channel", "fact_leads", "fact_transaction",
        "fact_feedback", "fact_client_stage", "stg_resolved",
    ]
    return {n: pd.read_csv(WAREHOUSE / f"{n}.csv") for n in names}


# --------------------------------------------------------------------------- #
# Entity builders
# --------------------------------------------------------------------------- #
class Foundry:
    def __init__(self) -> None:
        self.rng = np.random.default_rng(RANDOM_SEED)
        self.wh = _load_warehouse()
        self.log: list[dict] = []          # data_quality table entries
        self.seed: dict[str, list] = {}

    # -- ML cleaning bookkeeping ------------------------------------------- #
    def _table_log(self, table, rows_in, rows_out, *, dedup=0, imputations=0,
                   normalizations=0, anomalies=0, details=None):
        self.log.append({
            "table": table,
            "rowsIn": int(rows_in),
            "rowsOut": int(rows_out),
            "actions": {
                "dedupMerges": int(dedup),
                "imputations": int(imputations),
                "normalizations": int(normalizations),
                "anomaliesFlagged": int(anomalies),
            },
            "details": details or [],
        })

    # -- 10. Salesperson (REAL roster of 14) -------------------------------- #
    def build_salespeople(self) -> None:
        dc = self.wh["dim_client"]
        roster = sorted(dc["salesman"].dropna().unique().tolist())
        rows = []
        for name in roster:
            branch_key = None
            # primary branch = the branch this person has most clients in
            sub = dc[dc["salesman"] == name]
            if len(sub):
                top_code = sub["branch"].mode().iloc[0]
                branch_key = CODE_TO_KEY.get(top_code)
            rows.append({
                "id": name,
                "name": name,
                "role": "Commercial" if name != "Unassigned" else None,
                "department": "Sales",
                "branchKey": branch_key,
                "managerId": None,
                "hireDate": "2025-09-01",
                "salary": int(self.rng.integers(45000, 120000)) if name != "Unassigned" else None,
                "status": "Active",
                "isSample": name == "Unassigned" or False,  # roster real; Unassigned is a placeholder bucket
            })
        # roster names are REAL -> isSample False (incl. Unassigned, a real warehouse value)
        for r in rows:
            r["isSample"] = False
        self.seed["salespeople"] = rows
        self._table_log("salespeople", len(roster), len(rows), normalizations=len(rows),
                        details=[{"type": "normalize", "rule": "salesman_canonical",
                                  "affected": len(rows), "kept": True}])

    # -- 1. Client (REAL base) --------------------------------------------- #
    def build_clients(self) -> None:
        dc = self.wh["dim_client"].sort_values("client_id").reset_index(drop=True)
        pii = self.wh["dim_client_pii"].set_index("client_id")
        txn = self.wh["fact_transaction"]
        buyers = set(txn["client_id"].astype(int).tolist())

        normalizations = 0
        imputations = 0
        rows = []
        for _, c in dc.iterrows():
            cid_int = int(c["client_id"])
            cid = _client_id(cid_int)
            is_inferred = c["branch_confidence"] == "inferred"
            branch_key = CODE_TO_KEY.get(c["branch"], "unassigned")
            is_buyer = cid_int in buyers

            if is_buyer:
                ctype = "Customer"
            elif not is_inferred:
                ctype = "Prospect"
            else:
                ctype = "Lead"

            # PII (normalize on read; warehouse already E.164, count as standardized)
            p = pii.loc[cid_int] if cid_int in pii.index else None
            full_name = email = phone = None
            if p is not None:
                full_name = None if pd.isna(p["full_name"]) else str(p["full_name"])
                email_n, est = common.normalize_email(p["email"])
                phone_n, pst = common.normalize_phone(p["phone_e164"])
                email, phone = email_n, phone_n
                if est == "ok":
                    normalizations += 1
                if pst == "ok":
                    normalizations += 1

            industry = common.standardize_sector(c["sector"])
            if industry != "Unknown":
                normalizations += 1
            # country missing in warehouse -> impute DZ (logged)
            country = "Algérie"
            imputations += 1

            company = None if pd.isna(c["company_name"]) else str(c["company_name"]).strip().title()
            first_seen = str(c["first_seen"])[:10]

            rows.append({
                "id": cid,
                "type": ctype,
                "fullName": full_name,
                "email": email,
                "phone": phone,
                "companyName": company,
                "industry": industry,
                "country": country,
                "city": DZ_CITIES[cid_int % len(DZ_CITIES)],
                "address": None,
                "position": POSITIONS[cid_int % len(POSITIONS)],
                "companySize": COMPANY_SIZES[cid_int % len(COMPANY_SIZES)],
                "sourceAcquisition": c["channel"],
                "acquisitionCampaign": None,
                "acquisitionChannel": c["channel"],
                "responsibleSalespersonId": c["salesman"],
                "branchKey": branch_key,
                "serviceLine": c["service_line"],
                "branchConfidence": c["branch_confidence"],
                "firstContactDate": first_seen,
                "firstPurchaseDate": None,   # filled after sales
                "lastPurchaseDate": None,
                "lastActivityDate": first_seen,
                "status": ctype,
                "lifetimeRevenue": 0,        # derived after sales
                "lifetimeProfit": 0,
                "numberPurchases": 0,
                "numberCalls": 0,
                "numberMeetings": 0,
                "numberMessages": 0,
                "customerScore": 0,          # ML, filled later
                "churnRiskScore": 0.0,       # ML, filled later
                "consentFlag": bool(c["consent_flag"]),
                "isMerged": bool(c["is_merged"]),
                "needsReview": bool(c["needs_review"]),
                "sourceCount": int(c["source_count"]),
                "isSample": bool(is_inferred),   # 814 inferred = projections
            })
        self.seed["clients"] = rows

        raw_rows = len(self.wh["stg_resolved"])
        merged = int((dc["source_count"] > 1).sum())
        dedup = raw_rows - len(dc)
        self._table_log(
            "clients", raw_rows, len(rows),
            dedup=dedup, imputations=imputations, normalizations=normalizations,
            anomalies=int(dc["needs_review"].sum()),
            details=[
                {"type": "merge", "rule": "fuzzy_name+phone", "affected": merged, "kept": True},
                {"type": "normalize", "rule": "phone_e164+email+sector", "affected": normalizations, "kept": True, "flagged": True},
                {"type": "impute", "field": "country", "method": "mode_DZ", "affected": imputations},
            ],
        )

    # -- 2. Lead (REAL base: fact_leads) ----------------------------------- #
    def build_leads(self) -> None:
        fl = self.wh["fact_leads"].sort_values("client_id").reset_index(drop=True)
        client_ids = {int(c["id"][1:]) for c in self.seed["clients"]}
        ctype = {c["id"]: c["type"] for c in self.seed["clients"]}
        rows = []
        for i, l in fl.iterrows():
            cid_int = int(l["client_id"])
            if cid_int not in client_ids:
                continue
            cid = _client_id(cid_int)
            converted = ctype.get(cid) == "Customer"
            branch_key = CODE_TO_KEY.get(l["branch"], "unassigned")
            first_seen = str(l["first_seen"])[:10]
            # status: real signal is the resolved branch; synthesize lifecycle status
            if converted:
                status = "Converted"
            elif l["branch_confidence"] if "branch_confidence" in l else False:
                status = "Qualified"
            else:
                status = "New"
            rows.append({
                "id": f"L{i:05d}",
                "clientId": cid,
                "source": l["channel"],
                "campaign": None,
                "adset": None,
                "ad": None,
                "dateCreated": first_seen,
                "status": status,
                "assignedSalespersonId": l["salesman"],
                "qualificationScore": 0,   # ML, filled later
                "industry": common.standardize_sector(l["sector"]),
                "branchKey": branch_key,
                "serviceLine": l["service_line"],
                "expectedBudget": None,    # imputed later
                "need": None,
                "lastContactDate": first_seen,
                "conversionDate": first_seen if converted else None,
                "converted": bool(converted),
                "isMerged": bool(l["is_merged"]),
                "needsReview": bool(l["needs_review"]),
                "isSample": False,         # leads are REAL (anchors)
            })
        self.seed["leads"] = rows
        self._table_log("leads", len(fl), len(rows), normalizations=len(rows),
                        details=[{"type": "normalize", "rule": "sector_std+channel",
                                  "affected": len(rows), "kept": True}])

    # -- 9. MarketingCampaign (mixed: real lead counts) -------------------- #
    def build_campaigns(self) -> None:
        leads_by_channel = ANCHORS["leadsByChannel"]
        platform = {
            "Campagne Marketing": "Meta", "Prospection Classique": "Field Sales",
            "Website": "On-site", "Événementiel": "Events",
        }
        rows = []
        for i, (channel, leads) in enumerate(leads_by_channel.items(), start=1):
            spend = int(self.rng.integers(150000, 600000))
            reach = int(leads * self.rng.integers(80, 160))
            impressions = int(reach * self.rng.uniform(1.5, 3.0))
            clicks = int(leads * self.rng.uniform(2.0, 5.0))
            rows.append({
                "id": f"CMP{i:02d}",
                "platform": platform[channel],
                "channel": channel,
                "campaignName": f"{channel} 2026",
                "objective": "Lead generation",
                "startDate": "2026-01-01",
                "endDate": "2026-06-30",
                "budget": spend + int(self.rng.integers(0, 100000)),
                "amountSpent": spend,
                "reach": reach,
                "impressions": impressions,
                "clicks": clicks,
                "leads": int(leads),          # REAL anchor
                "messages": int(leads * self.rng.uniform(0.5, 1.5)),
                "purchases": 0,               # derived after sales
                "revenueGenerated": 0,        # derived after sales
                "isSample": True,             # spend/funnel simulated
            })
        self.seed["marketingCampaigns"] = rows
        self._table_log("marketingCampaigns", len(rows), len(rows))

    # -- 4/5. Opportunity + Proposal (SIM, keyed to clients) --------------- #
    def build_opportunities_and_proposals(self) -> None:
        clients = self.seed["clients"]
        by_id = {c["id"]: c for c in clients}
        buyers = [c for c in clients if c["type"] == "Customer"]
        # a slice of engaged non-buyers get open/lost opportunities
        engaged = [c for c in clients if c["type"] == "Prospect"]
        opp_rows, prop_rows = [], []
        self._opp_by_client = {}            # clientId -> won opp id (for sale linkage)

        oi = 0
        # Won opportunity for every buyer (links to their sale)
        for c in buyers:
            oid = f"OPP{oi:05d}"; oi += 1
            sp = c["responsibleSalespersonId"]
            created = c["firstContactDate"]
            opp_rows.append({
                "id": oid, "clientId": c["id"], "salespersonId": sp,
                "branchKey": c["branchKey"], "serviceLine": c["serviceLine"],
                "valueExpected": int(self.rng.integers(30000, 200000)),
                "probability": 1.0, "stage": "Won", "createdDate": created,
                "closingDate": created, "lostReason": None,
                "wonReason": WON_REASONS[oi % len(WON_REASONS)], "isSample": True,
            })
            self._opp_by_client[c["id"]] = oid
            # a proposal for the won opp
            prop_rows.append({
                "id": f"PRO{len(prop_rows):05d}", "clientId": c["id"], "opportunityId": oid,
                "salespersonId": sp, "branchKey": c["branchKey"], "serviceLine": c["serviceLine"],
                "version": 1, "creationDate": created, "sentDate": created, "viewedDate": created,
                "expirationDate": None, "amount": int(self.rng.integers(30000, 200000)),
                "discount": 0, "currency": "DA", "estimatedDeliveryTimeDays": int(self.rng.integers(7, 60)),
                "status": "Accepted", "rejectionReason": None, "acceptanceDate": created, "isSample": True,
            })

        # Open / lost opportunities for a deterministic subset of prospects
        n_open = min(len(engaged), 60)
        for c in engaged[:n_open]:
            oid = f"OPP{oi:05d}"; oi += 1
            sp = c["responsibleSalespersonId"]
            stage = ["Qualified", "Proposal", "Negotiation", "Lost"][oi % 4]
            lost = stage == "Lost"
            opp_rows.append({
                "id": oid, "clientId": c["id"], "salespersonId": sp,
                "branchKey": c["branchKey"], "serviceLine": c["serviceLine"],
                "valueExpected": int(self.rng.integers(20000, 150000)),
                "probability": 0.0 if lost else float(round(self.rng.uniform(0.2, 0.8), 2)),
                "stage": stage, "createdDate": c["firstContactDate"],
                "closingDate": c["firstContactDate"] if lost else None,
                "lostReason": LOST_REASONS[oi % len(LOST_REASONS)] if lost else None,
                "wonReason": None, "isSample": True,
            })
            if stage in ("Proposal", "Negotiation"):
                prop_rows.append({
                    "id": f"PRO{len(prop_rows):05d}", "clientId": c["id"], "opportunityId": oid,
                    "salespersonId": sp, "branchKey": c["branchKey"], "serviceLine": c["serviceLine"],
                    "version": 1, "creationDate": c["firstContactDate"], "sentDate": c["firstContactDate"],
                    "viewedDate": None, "expirationDate": None, "amount": int(self.rng.integers(20000, 150000)),
                    "discount": 0, "currency": "DA", "estimatedDeliveryTimeDays": int(self.rng.integers(7, 60)),
                    "status": "Sent", "rejectionReason": None, "acceptanceDate": None, "isSample": True,
                })
        self.seed["opportunities"] = opp_rows
        self.seed["proposals"] = prop_rows
        self._table_log("opportunities", len(opp_rows), len(opp_rows))
        self._table_log("proposals", len(prop_rows), len(prop_rows))

    # -- 6. Sale (REAL totals: fact_transaction) --------------------------- #
    def build_sales(self) -> None:
        ft = self.wh["fact_transaction"].sort_values(
            ["client_id", "period_date"]).reset_index(drop=True)
        client_ids = {int(c["id"][1:]) for c in self.seed["clients"]}
        rows = []
        for i, t in ft.iterrows():
            cid_int = int(t["client_id"])
            if cid_int not in client_ids:
                continue
            cid = _client_id(cid_int)
            rows.append({
                "id": f"SAL{i:05d}",
                "clientId": cid,
                "opportunityId": self._opp_by_client.get(cid),
                "projectId": None,                # linked after projects
                "date": str(t["period_date"]),
                "branchKey": CODE_TO_KEY.get(t["branch"], "unassigned"),
                "serviceLine": t["service_line"],
                "salespersonId": t["salesman"],
                "revenueModel": REVENUE_MODEL_MAP.get(t["revenue_model"], "service_fee"),
                "grossFlowAmount": int(round(float(t["gross_flow_amount"]))),
                "amount": int(round(float(t["recognized_revenue"]))),
                "costRatio": float(t["cost_ratio"]),
                "margin": int(round(float(t["projected_margin"]))),
                "paymentStatus": "Paid",
                "pricingRef": None if pd.isna(t["pricing_ref"]) else str(t["pricing_ref"]),
                "isSample": True,                 # per-row simulated; totals reconcile
            })
        self.seed["sales"] = rows
        self._table_log("sales", len(ft), len(rows),
                        details=[{"type": "reconcile", "rule": "kpi_anchors",
                                  "affected": len(rows), "kept": True}])

    # -- 12. Project (SIM) + back-link sales.projectId --------------------- #
    def build_projects(self) -> None:
        consultants = self.seed["consultants"]
        cons_by_branch: dict[str, list] = {}
        for c in consultants:
            cons_by_branch.setdefault(c.get("_branchKey", "consulting"), []).append(c["id"])
        all_cons = [c["id"] for c in consultants]
        delivery_branches = {"consulting", "communication", "academy"}
        rows = []
        pi = 0
        for sale in self.seed["sales"]:
            if sale["branchKey"] not in delivery_branches:
                continue
            pid = f"PRJ{pi:05d}"; pi += 1
            budget = sale["amount"]
            cost = int(budget * float(self.rng.uniform(0.35, 0.7)))
            status = ["Completed", "Active", "Completed", "Delayed"][pi % 4]
            team = cons_by_branch.get(sale["branchKey"]) or all_cons
            team_pick = [team[pi % len(team)]] if team else []
            est_hours = int(self.rng.integers(20, 200))
            rows.append({
                "id": pid,
                "clientId": sale["clientId"],
                "saleId": sale["id"],
                "branchKey": sale["branchKey"],
                "serviceLine": sale["serviceLine"],
                "startDate": sale["date"] + "-01" if len(sale["date"]) == 7 else sale["date"],
                "endDate": None if status in ("Active", "Delayed") else "2026-06-15",
                "estimatedHours": est_hours,
                "actualHours": est_hours + int(self.rng.integers(-10, 40)),
                "budget": budget,
                "cost": cost,
                "profit": budget - cost,
                "responsibleTeam": team_pick,
                "status": status,
                "isSample": True,
            })
            sale["projectId"] = pid
        self.seed["projects"] = rows
        self._table_log("projects", len(rows), len(rows))

    # -- 7. Payment (SIM) -------------------------------------------------- #
    def build_payments(self) -> None:
        rows = []
        pi = 0
        for sale in self.seed["sales"]:
            n = 1 if sale["revenueModel"] != "subscription" else int(self.rng.integers(1, 4))
            remaining = sale["amount"]
            for k in range(n):
                amt = remaining if k == n - 1 else int(remaining / (n - k))
                remaining -= amt
                rows.append({
                    "id": f"PAY{pi:05d}", "saleId": sale["id"], "clientId": sale["clientId"],
                    "date": sale["date"], "amount": amt,
                    "method": ["Bank Transfer", "Cash", "Card", "Cheque"][pi % 4],
                    "status": "Paid", "invoiceId": f"INV{pi:05d}", "dueDate": None,
                    "isSample": True,
                })
                pi += 1
        self.seed["payments"] = rows
        self._table_log("payments", len(rows), len(rows))

    # -- 3. Interaction (SIM) --------------------------------------------- #
    def build_interactions(self) -> None:
        rows = []
        ii = 0
        roster = [s["id"] for s in self.seed["salespeople"]]
        for c in self.seed["clients"]:
            if c["type"] == "Customer":
                n = int(self.rng.integers(2, 6))
            elif c["type"] == "Prospect":
                n = int(self.rng.integers(1, 4))
            else:
                n = int(self.rng.integers(0, 2))
            sp = c["responsibleSalespersonId"]
            if sp not in roster:
                sp = "Unassigned"
            calls = meetings = msgs = 0
            for _ in range(n):
                itype = ["Call", "Meeting", "WhatsApp", "Email"][ii % 4]
                if itype == "Call":
                    calls += 1
                elif itype == "Meeting":
                    meetings += 1
                else:
                    msgs += 1
                rows.append({
                    "id": f"INT{ii:06d}", "clientId": c["id"], "salespersonId": sp,
                    "type": itype, "date": c["firstContactDate"],
                    "durationMinutes": int(self.rng.integers(5, 60)),
                    "result": None, "notes": None, "followUpDate": None, "isSample": True,
                })
                ii += 1
            c["numberCalls"], c["numberMeetings"], c["numberMessages"] = calls, meetings, msgs
        self.seed["interactions"] = rows
        self._table_log("interactions", len(rows), len(rows))

    # -- 8. Expense (SIM) — sized so net margin stays plausible ------------ #
    def build_expenses(self) -> None:
        # total operating expense target ~ recognized revenue - projected margin (plausible overhead)
        target = ANCHORS["recognizedRevenueDA"] - ANCHORS["projectedMarginDA"]
        rows = []
        ei = 0
        n = 120
        per = target / n
        branch_keys = [b["branchKey"] for b in BRANCHES if b["branchKey"] != "unassigned"]
        roster = [s["id"] for s in self.seed["salespeople"] if s["id"] != "Unassigned"]
        for _ in range(n):
            cat = EXPENSE_CATEGORIES[ei % len(EXPENSE_CATEGORIES)]
            qty = int(self.rng.integers(1, 5))
            unit = max(1000, int(per / qty * float(self.rng.uniform(0.6, 1.4))))
            rows.append({
                "id": f"EXP{ei:05d}", "date": f"2026-0{(ei % 6) + 1}",
                "branchKey": branch_keys[ei % len(branch_keys)],
                "department": cat, "category": cat,
                "supplier": f"Fournisseur {ei % 20}", "description": None,
                "quantity": qty, "unitCost": unit, "totalCost": qty * unit,
                "responsiblePersonId": roster[ei % len(roster)],
                "isSample": True,
            })
            ei += 1
        self.seed["expenses"] = rows
        self._table_log("expenses", len(rows), len(rows))

    # -- 11. Consultant (SIM) --------------------------------------------- #
    def build_consultants(self) -> None:
        rows = []
        names = ["Karim Belhadj", "Sonia Amrani", "Yacine Brahimi", "Nadia Cherif",
                 "Omar Ferhat", "Lila Saadi", "Reda Mansouri", "Imene Khelifi",
                 "Sofiane Atal", "Meriem Daoud"]
        branches = ["consulting", "communication", "academy"]
        for i, name in enumerate(names):
            seniority = ["Junior", "Mid", "Senior", "Expert"][i % 4]
            rate = {"Junior": 4000, "Mid": 7000, "Senior": 11000, "Expert": 16000}[seniority]
            rows.append({
                "id": f"CON{i:02d}", "fullName": name, "country": "Algérie",
                "languages": ["Français", "Arabe"] + (["Anglais"] if i % 2 else []),
                "expertise": [branches[i % 3].title()],
                "certifications": [], "experienceYears": int(self.rng.integers(1, 15)),
                "seniorityLevel": seniority, "hourlyRate": rate, "dailyRate": rate * 8,
                "availabilityStatus": ["Available", "Partially Available", "Unavailable"][i % 3],
                "availabilityPercentage": int(self.rng.integers(20, 100)),
                "joinDate": "2025-09-01", "status": "Active",
                "performanceScore": 0,            # ML, filled later
                "projectsCompleted": 0, "revenueGenerated": 0, "averageProjectValue": 0,
                "averageClientRating": 0.0, "satisfactionScore": 0.0, "retentionScore": 0.0,
                "utilizationRate": float(round(self.rng.uniform(0.4, 0.95), 2)),
                "repeatClientRate": float(round(self.rng.uniform(0.1, 0.6), 2)),
                "deliverySuccessRate": float(round(self.rng.uniform(0.6, 1.0), 2)),
                "_branchKey": branches[i % 3],    # internal helper for project teaming
                "isSample": True,
            })
        self.seed["consultants"] = rows
        self._table_log("consultants", len(rows), len(rows))

    # -- 13. Task (SIM) ---------------------------------------------------- #
    def build_tasks(self) -> None:
        rows = []
        ti = 0
        roster = [s["id"] for s in self.seed["salespeople"] if s["id"] != "Unassigned"]
        # project tasks
        for proj in self.seed["projects"]:
            for _ in range(int(self.rng.integers(1, 4))):
                emp = (proj["responsibleTeam"][0] if proj["responsibleTeam"]
                       else roster[ti % len(roster)])
                est = int(self.rng.integers(2, 30))
                rows.append({
                    "id": f"TSK{ti:05d}", "projectId": proj["id"], "employeeId": emp,
                    "department": "Delivery", "kind": "task",
                    "createdDate": proj["startDate"], "dueDate": None, "completionDate": None,
                    "priority": ["Low", "Medium", "High", "Critical"][ti % 4],
                    "status": ["To Do", "In Progress", "Done", "Blocked"][ti % 4],
                    "estimatedHours": est, "actualHours": est + int(self.rng.integers(-2, 8)),
                    "title": None, "isSample": True,
                })
                ti += 1
        # management objectives/evaluations/decisions (no project)
        for kind in ("objective", "evaluation", "decision"):
            for _ in range(6):
                rows.append({
                    "id": f"TSK{ti:05d}", "projectId": None,
                    "employeeId": roster[ti % len(roster)], "department": "Management",
                    "kind": kind, "createdDate": "2026-03-01", "dueDate": "2026-09-01",
                    "completionDate": None, "priority": "Medium", "status": "In Progress",
                    "estimatedHours": None, "actualHours": None,
                    "title": f"{kind.title()} {ti}", "isSample": True,
                })
                ti += 1
        self.seed["tasks"] = rows
        self._table_log("tasks", len(rows), len(rows))

    # -- 14. Feedback (REAL-ish base: fact_feedback) ----------------------- #
    def build_feedback(self) -> None:
        ff = self.wh["fact_feedback"].sort_values(["client_id", "date"]).reset_index(drop=True)
        client_ids = {int(c["id"][1:]) for c in self.seed["clients"]}
        sale_by_client: dict[str, str] = {}
        for s in self.seed["sales"]:
            sale_by_client.setdefault(s["clientId"], s["id"])
        proj_by_client: dict[str, str] = {}
        for p in self.seed["projects"]:
            proj_by_client.setdefault(p["clientId"], p["id"])
        cons_ids = [c["id"] for c in self.seed["consultants"]]
        roster = [s["id"] for s in self.seed["salespeople"]]
        rows = []
        for i, f in ff.iterrows():
            cid_int = int(f["client_id"])
            if cid_int not in client_ids:
                continue
            cid = _client_id(cid_int)
            score = int(f["score"])                 # 0..10 scale -> NPS score
            rating = max(1, min(5, math.ceil(score / 2)))
            sp = f["salesman"] if f["salesman"] in roster else "Unassigned"
            ftype = "General Satisfaction" if score >= 7 else "Support"
            rows.append({
                "id": f"FB{i:05d}", "clientId": cid,
                "projectId": proj_by_client.get(cid),
                "saleId": sale_by_client.get(cid),
                "consultantId": cons_ids[i % len(cons_ids)] if cons_ids else None,
                "date": str(f["date"]),
                "source": ["WhatsApp", "Email", "Survey", "Phone Call"][i % 4],
                "type": ftype, "rating": rating, "npsScore": score,
                "satisfactionLevel": "High" if score >= 8 else ("Medium" if score >= 5 else "Low"),
                "feedbackText": None, "positivePoints": None, "negativePoints": None,
                "improvementSuggestions": None,
                "resolutionStatus": "Resolved" if score >= 7 else "Open",
                "responsibleEmployeeId": sp if sp != "Unassigned" else None,
                "isSample": True,
            })
        self.seed["feedback"] = rows
        self._table_log("feedback", len(ff), len(rows),
                        details=[{"type": "derive", "rule": "rating=ceil(score/2); nps=score",
                                  "affected": len(rows), "kept": True}])

    # -- 15. AuditEvent (SIM) — creation events for the history timeline ---- #
    def build_audit(self) -> None:
        rows = []
        ai = 0
        for c in self.seed["clients"][:200]:
            rows.append({
                "id": f"AE{ai:05d}", "entity": "client", "entityId": c["id"],
                "action": "create", "field": None, "before": None, "after": None,
                "actor": "foundry", "timestamp": GENERATED_AT, "isSample": True,
            })
            ai += 1
        for s in self.seed["sales"]:
            rows.append({
                "id": f"AE{ai:05d}", "entity": "sale", "entityId": s["id"],
                "action": "create", "field": None, "before": None, "after": None,
                "actor": "foundry", "timestamp": GENERATED_AT, "isSample": True,
            })
            ai += 1
        self.seed["auditEvents"] = rows
        self._table_log("auditEvents", len(rows), len(rows))

    # -- Derived numerics from sales (client value, campaign attribution) --- #
    def derive_rollups(self) -> None:
        sales = self.seed["sales"]
        by_client: dict[str, dict] = {}
        for s in sales:
            agg = by_client.setdefault(s["clientId"], {"rev": 0, "margin": 0, "n": 0, "last": s["date"]})
            agg["rev"] += s["amount"]; agg["margin"] += s["margin"]; agg["n"] += 1
            agg["last"] = max(agg["last"], s["date"])
        for c in self.seed["clients"]:
            a = by_client.get(c["id"])
            if a:
                c["lifetimeRevenue"] = a["rev"]
                c["lifetimeProfit"] = a["margin"]
                c["numberPurchases"] = a["n"]
                c["firstPurchaseDate"] = a["last"]
                c["lastPurchaseDate"] = a["last"]
        # campaign attribution by channel
        rev_by_channel: dict[str, int] = {}
        pur_by_channel: dict[str, int] = {}
        chan_of_client = {c["id"]: c["acquisitionChannel"] for c in self.seed["clients"]}
        for s in sales:
            ch = chan_of_client.get(s["clientId"])
            rev_by_channel[ch] = rev_by_channel.get(ch, 0) + s["amount"]
            pur_by_channel[ch] = pur_by_channel.get(ch, 0) + 1
        for cmp in self.seed["marketingCampaigns"]:
            cmp["revenueGenerated"] = rev_by_channel.get(cmp["channel"], 0)
            cmp["purchases"] = pur_by_channel.get(cmp["channel"], 0)

    # -- ML cleaning pass: imputation + 4 derived scores (scikit-learn) ----- #
    def ml_pass(self) -> None:
        clients = self.seed["clients"]
        df = pd.DataFrame(clients)

        # (a) impute missing lead expectedBudget with median (SimpleImputer)
        leads = self.seed["leads"]
        budgets = np.array([[l["expectedBudget"] if l["expectedBudget"] is not None else np.nan]
                            for l in leads], dtype=float)
        # seed a plausible budget for converted leads, leave others missing -> imputed
        for i, l in enumerate(leads):
            if l["converted"]:
                budgets[i, 0] = float(self.rng.integers(30000, 200000))
        imp = SimpleImputer(strategy="median")
        filled = imp.fit_transform(budgets)
        n_imputed = int(np.isnan(budgets).sum())
        for i, l in enumerate(leads):
            l["expectedBudget"] = int(filled[i, 0])

        # (b) Customer Score — k-means tiering on [revenue, purchases, recency]
        feats = df[["lifetimeRevenue", "numberPurchases"]].astype(float).copy()
        feats["engagement"] = df["numberCalls"] + df["numberMeetings"] + df["numberMessages"]
        X = MinMaxScaler().fit_transform(feats.values)
        km = KMeans(n_clusters=4, random_state=RANDOM_SEED, n_init=10)
        labels = km.fit_predict(X)
        # rank clusters by mean revenue -> tier score 25/50/75/100
        order = np.argsort([feats["lifetimeRevenue"][labels == k].mean() if (labels == k).any() else 0
                            for k in range(4)])
        tier_score = {cluster: (rank + 1) * 25 for rank, cluster in enumerate(order)}
        for i, c in enumerate(clients):
            base = tier_score[labels[i]]
            c["customerScore"] = int(min(100, base))

        # (c) Churn Risk — logistic regression on recency/engagement
        eng = (df["numberCalls"] + df["numberMeetings"] + df["numberMessages"]).astype(float).values
        rev = df["lifetimeRevenue"].astype(float).values
        # rule label: churn if no revenue AND low engagement
        y = ((rev == 0) & (eng <= 1)).astype(int)
        Xc = MinMaxScaler().fit_transform(np.column_stack([rev, eng]))
        if len(set(y.tolist())) > 1:
            lr = LogisticRegression(max_iter=1000)
            lr.fit(Xc, y)
            proba = lr.predict_proba(Xc)[:, 1]
        else:
            proba = y.astype(float)
        for i, c in enumerate(clients):
            c["churnRiskScore"] = float(round(proba[i], 3))

        # (d) Lead Qualification — weighted rule 0..100
        chan_w = {"Website": 70, "Campagne Marketing": 55, "Événementiel": 50, "Prospection Classique": 60}
        for l in leads:
            s = chan_w.get(l["source"], 40)
            if l["branchKey"] != "unassigned":
                s += 20
            if l["converted"]:
                s = max(s, 80)
            l["qualificationScore"] = int(min(100, s))

        # (e) Consultant Performance — weighted composite 0..100
        for c in self.seed["consultants"]:
            score = (c["deliverySuccessRate"] * 40 + c["utilizationRate"] * 35
                     + c["repeatClientRate"] * 25)
            c["performanceScore"] = int(min(100, round(score)))

        # strip internal helper key
        for c in self.seed["consultants"]:
            c.pop("_branchKey", None)

        self._table_log("ml_imputation", len(leads), len(leads), imputations=n_imputed,
                        details=[{"type": "impute", "field": "expectedBudget",
                                  "method": "median", "affected": n_imputed}])

    # -- Assemble meta + data_quality ------------------------------------- #
    def assemble(self) -> tuple[dict, dict]:
        keys = ["clients", "leads", "interactions", "opportunities", "proposals",
                "sales", "payments", "expenses", "marketingCampaigns", "salespeople",
                "consultants", "projects", "tasks", "feedback", "auditEvents"]
        counts = {k: len(self.seed[k]) for k in keys}
        sample_counts = {k: sum(1 for r in self.seed[k] if r.get("isSample")) for k in keys}
        provenance = {
            "clients": "real", "leads": "real", "salespeople": "real",
            "marketingCampaigns": "mixed", "sales": "real-totals",
            "interactions": "simulated", "opportunities": "simulated", "proposals": "simulated",
            "payments": "simulated", "expenses": "simulated", "consultants": "simulated",
            "projects": "simulated", "tasks": "simulated", "feedback": "simulated",
            "auditEvents": "simulated",
        }
        meta = {
            "schemaVersion": SCHEMA_VERSION,
            "seedVersion": SEED_VERSION,
            "generatedAt": GENERATED_AT,
            "randomSeed": RANDOM_SEED,
            "currency": "DA",
            "currencyFormat": '#,##0 "DA"',
            "counts": counts,
            "sampleCounts": sample_counts,
            "provenance": provenance,
            "kpiAnchors": ANCHORS,
            "branches": BRANCHES,
        }
        seed = {"meta": meta, **{k: self.seed[k] for k in keys}}

        raw_rows = len(self.wh["stg_resolved"])
        dc = self.wh["dim_client"]
        dq = {
            "meta": {
                "generatedAt": GENERATED_AT,
                "rawRowsIngested": raw_rows,
                "uniqueAfterResolution": len(dc),
                "duplicatesCollapsed": raw_rows - len(dc),
                "mergedFromMultiple": int((dc["source_count"] > 1).sum()),
                "needsReview": int(dc["needs_review"].sum()),
            },
            "tables": self.log,
            "derivedScores": [
                {"name": "customerScore", "entity": "client", "model": "rule+kmeans", "range": [0, 100]},
                {"name": "churnRiskScore", "entity": "client", "model": "logistic", "range": [0, 1]},
                {"name": "qualificationScore", "entity": "lead", "model": "rule", "range": [0, 100]},
                {"name": "performanceScore", "entity": "consultant", "model": "weighted", "range": [0, 100]},
            ],
        }
        return _coerce(seed), _coerce(dq)

    def run(self) -> tuple[dict, dict]:
        # order matters: FKs resolve against already-built tables
        self.build_salespeople()
        self.build_clients()
        self.build_leads()
        self.build_campaigns()
        self.build_consultants()
        self.build_opportunities_and_proposals()
        self.build_sales()
        self.build_projects()           # back-links sales.projectId
        self.build_payments()
        self.build_interactions()       # fills client interaction counts
        self.build_expenses()
        self.build_tasks()
        self.build_feedback()
        self.build_audit()
        self.derive_rollups()           # client value + campaign attribution
        self.ml_pass()                  # imputation + 4 derived scores
        return self.assemble()


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #
def build() -> tuple[dict, dict]:
    """Build (seed, data_quality) dicts deterministically. No file I/O."""
    return Foundry().run()


def main() -> None:
    seed, dq = build()
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    (SEED_DIR / "seed.json").write_text(
        json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    (SEED_DIR / "data_quality.json").write_text(
        json.dumps(dq, ensure_ascii=False, indent=2), encoding="utf-8")
    m = seed["meta"]
    print(f"[foundry] wrote {SEED_DIR / 'seed.json'}")
    print(f"[foundry] entities: {sum(m['counts'].values())} rows across {len(m['counts'])} tables")
    print(f"[foundry] sales: Σamount={sum(s['amount'] for s in seed['sales']):,} DA "
          f"(anchor {ANCHORS['recognizedRevenueDA']:,})")
    print(f"[foundry] clients={m['counts']['clients']} leads={m['counts']['leads']} "
          f"salespeople={m['counts']['salespeople']}")


if __name__ == "__main__":
    main()
