"""
kpis.py — KPI / fact layer over the warehouse.

Axes 2 (Commercial) and 3 (Salesman) are computed from REAL resolved data.
Axes 1 (Financial) and 4 (Operational), plus the NPS feedback, have NO source
data — they are DETERMINISTIC PROJECTIONS derived from dim_pricing. Every
projected row carries is_sample=1.

Determinism: a stable md5 hash of the client_id drives all assignments (tier,
conversion, contract length…). No RNG — so the numbers are reproducible and the
distribution is unbiased (fixes the prior hash-bias bug). Channel-differentiated
conversion is the one real signal the projection rests on.

Run (after pipeline.py):  python src/kpis.py
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pandas as pd

import pricing_extract

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "warehouse"

# ---- documented projection assumptions (see assumptions.md) --------------- #
CHANNEL_CONVERSION = {        # channel-differentiated (the real dimension)
    "Prospection Classique": 0.35,
    "Website": 0.22,
    "Événementiel": 0.18,
    "Campagne Marketing": 0.10,
    "Manual Entry": 0.40,
}
DEFAULT_CONVERSION = 0.15
NPS_BY_CHANNEL_BIAS = {       # nudges the simulated NPS so it varies by channel
    "Prospection Classique": 2, "Website": 1, "Événementiel": 0,
    "Campagne Marketing": -1, "Manual Entry": 2,
}


def h(cid, salt: str) -> int:
    return int(hashlib.md5(f"{cid}:{salt}".encode()).hexdigest()[:8], 16)


def converts(cid, channel) -> bool:
    rate = CHANNEL_CONVERSION.get(channel, DEFAULT_CONVERSION)
    return (h(cid, "conv") % 10000) / 10000.0 < rate


# --------------------------------------------------------------------------- #
# fact_transaction (SIMULATED)                                                #
# --------------------------------------------------------------------------- #
def build_fact_transaction(dim_client, dim_pricing):
    rows = []
    for _, c in dim_client.iterrows():
        branch = c["branch"]
        if branch == "UNASSIGNED":
            continue                       # cannot price an unknown branch — honest
        if not converts(c["client_id"], c["channel"]):
            continue
        # candidate price rows for this client's service_line (fallback: branch)
        cand = dim_pricing[(dim_pricing["service_line"] == c["service_line"])]
        if cand.empty:
            cand = dim_pricing[dim_pricing["branch"] == branch]
        if cand.empty:
            continue
        pr = cand.iloc[h(c["client_id"], "tier") % len(cand)]
        model = pr["revenue_model"]
        cid = c["client_id"]
        base = float(pr["base_price_da"] or 0)
        cost_ratio = float(pr["cost_ratio"] or 0)
        start_month = 1 + h(cid, "month") % 5     # 2026-0X
        period = f"2026-{start_month:02d}"

        def emit(gross, recognized, rec_type, model_, period_):
            rows.append({
                "client_id": cid, "branch": branch, "service_line": c["service_line"],
                "salesman": c["salesman"], "channel": c["channel"], "sector": c["sector"],
                "revenue_model": model_, "recognition_type": rec_type,
                "gross_flow_amount": round(gross, 2), "recognized_revenue": round(recognized, 2),
                "cost_ratio": cost_ratio,
                "projected_margin": round(recognized * (1 - cost_ratio), 2),
                "period_date": period_, "pricing_ref": pr["pricing_ref"], "is_sample": 1,
            })

        if model == "one_time":
            emit(base, base, "own_revenue", model, period)
        elif model == "hourly":
            hours = 2 + h(cid, "hrs") % 19            # 2–20 h
            amt = base * hours
            emit(amt, amt, "own_revenue", model, period)
        elif model == "recurring_monthly":
            monthly = float(pr["recurring_da"] or base) / (12 if pr["recurring_period"] == "yearly" else 1)
            months = 3 + h(cid, "len") % 10           # 3–12 month contract
            for m in range(months):
                pm = f"2026-{min(12, start_month + m):02d}"
                emit(monthly, monthly, "own_revenue", model, pm)
        elif model == "commission_pct":
            comm = float(pr["commission_rate"] or 0.20)
            gross = 80000 + (h(cid, "flow") % 42) * 10000   # 80k–500k flow
            emit(gross, gross * comm, "commission_only", model, period)
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------- #
# fact_client_stage (SIMULATED) + fact_feedback (SIMULATED NPS)               #
# --------------------------------------------------------------------------- #
def build_fact_stage(dim_client, dim_stage):
    rows = []
    for _, c in dim_client.iterrows():
        seq = dim_stage[dim_stage["branch"] == c["branch"]].sort_values("stage_order")
        if seq.empty:
            seq = dim_stage[dim_stage["branch"] == "UNASSIGNED"]
        idx = h(c["client_id"], "stage") % len(seq)
        st = seq.iloc[idx]
        rows.append({
            "client_id": c["client_id"], "branch": c["branch"],
            "stage_id": st["stage_id"], "stage_name": st["stage_name"],
            "meta_status": st["meta_status"], "entered_at": c["first_seen"] or "2026-02-01",
            "is_sample": 1,
        })
    return pd.DataFrame(rows)


def build_fact_feedback(fact_tx):
    # NPS only from clients who "transacted" (post-delivery survey), simulated
    rows = []
    for cid in fact_tx["client_id"].unique():
        sub = fact_tx[fact_tx["client_id"] == cid].iloc[0]
        bias = NPS_BY_CHANNEL_BIAS.get(sub["channel"], 0)
        score = 5 + h(cid, "nps") % 6 + bias          # ~5–10
        score = max(0, min(10, score))
        rows.append({"client_id": cid, "branch": sub["branch"], "salesman": sub["salesman"],
                     "channel": sub["channel"], "score": score, "date": sub["period_date"],
                     "is_sample": 1})
    return pd.DataFrame(rows)


def nps(scores: pd.Series) -> float:
    if len(scores) == 0:
        return 0.0
    promoters = (scores >= 9).mean()
    detractors = (scores <= 6).mean()
    return round((promoters - detractors) * 100, 1)


# --------------------------------------------------------------------------- #
# KPI aggregates                                                              #
# --------------------------------------------------------------------------- #
def main():
    dim_client = pd.read_csv(OUT / "dim_client.csv")
    dim_pricing = pd.read_csv(OUT / "dim_pricing.csv")
    dim_stage = pd.read_csv(OUT / "dim_stage.csv")

    fact_tx = build_fact_transaction(dim_client, dim_pricing)
    fact_stage = build_fact_stage(dim_client, dim_stage)
    fact_fb = build_fact_feedback(fact_tx)

    for name, df in {"fact_transaction": fact_tx, "fact_client_stage": fact_stage,
                     "fact_feedback": fact_fb}.items():
        df.to_csv(OUT / f"{name}.csv", index=False, encoding="utf-8")

    # ---- Axe 2 Commercial (REAL) ---- #
    axe2 = {
        "leads_by_channel": dim_client.groupby("channel").size().to_dict(),
        "leads_by_sector": dim_client.groupby("sector").size().to_dict(),
        "leads_by_branch": dim_client.groupby("branch").size().to_dict(),
        "merged_clients": int(dim_client["is_merged"].sum()),
    }
    (dim_client.groupby(["channel", "branch"]).size().reset_index(name="leads")
     .to_csv(OUT / "kpi_axe2_commercial.csv", index=False))

    # ---- Axe 3 Salesman (REAL) ---- #
    a3 = dim_client.groupby("salesman").agg(leads=("client_id", "count")).reset_index()
    conv = fact_tx.groupby("salesman")["client_id"].nunique().rename("converted_sim")
    rev = fact_tx.groupby("salesman")["recognized_revenue"].sum().rename("sim_revenue_da")
    a3 = a3.merge(conv, on="salesman", how="left").merge(rev, on="salesman", how="left").fillna(0)
    a3.to_csv(OUT / "kpi_axe3_salesman.csv", index=False)

    # ---- Axe 1 Financial (SIMULATED) ---- #
    headline_rev = float(fact_tx["recognized_revenue"].sum())     # recognized ONLY
    gross_volume = float(fact_tx["gross_flow_amount"].sum())
    mrr = float(fact_tx[fact_tx["revenue_model"] == "recurring_monthly"]
                .groupby("period_date")["recognized_revenue"].sum().mean() or 0)
    (fact_tx.groupby(["branch", "revenue_model"]).agg(
        recognized_revenue_da=("recognized_revenue", "sum"),
        gross_flow_da=("gross_flow_amount", "sum"),
        projected_margin_da=("projected_margin", "sum"),
        txns=("client_id", "count")).reset_index()
     .to_csv(OUT / "kpi_axe1_financial.csv", index=False))

    # ---- Axe 4 Operational (SIMULATED) ---- #
    (fact_stage.groupby(["branch", "meta_status"]).size().reset_index(name="clients")
     .to_csv(OUT / "kpi_axe4_operational.csv", index=False))

    summary = {
        "_note": "Axe2/Axe3 = REAL. Axe1/Axe4/NPS = SIMULATED projection (is_sample=1).",
        "real": {
            "unique_clients": int(len(dim_client)),
            "leads_by_channel": axe2["leads_by_channel"],
            "leads_by_branch": axe2["leads_by_branch"],
            "salesmen": int(dim_client["salesman"].nunique()),
        },
        "simulated": {
            "transactions": int(len(fact_tx)),
            "recognized_revenue_da": round(headline_rev, 2),
            "gross_platform_volume_da": round(gross_volume, 2),
            "avg_mrr_da": round(mrr, 2),
            "projected_margin_da": round(float(fact_tx["projected_margin"].sum()), 2),
            "nps_overall": nps(fact_fb["score"]),
            "client_tax_saving_pct": pricing_extract.CLIENT_TAX_SAVING,
        },
    }
    (OUT / "kpi_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False),
                                          encoding="utf-8")

    # also push facts into sqlite
    import sqlite3
    con = sqlite3.connect(OUT / "moustachir.sqlite")
    for name, df in {"fact_transaction": fact_tx, "fact_client_stage": fact_stage,
                     "fact_feedback": fact_fb}.items():
        df.to_sql(name, con, if_exists="replace", index=False)
    con.commit(); con.close()

    print("KPIs built.")
    print(f"  REAL: {len(dim_client)} clients | "
          f"{dim_client['salesman'].nunique()} salesmen")
    print(f"  SIM : {len(fact_tx)} txns | recognized={headline_rev:,.0f} DA | "
          f"gross_volume={gross_volume:,.0f} DA | NPS={summary['simulated']['nps_overall']}")
    print(f"  all simulated rows carry is_sample=1 → "
          f"{int(fact_tx['is_sample'].min()) == 1 and int(fact_tx['is_sample'].max()) == 1}")


if __name__ == "__main__":
    main()
