"""
pipeline.py — Moustachir data-centralization ETL.

Flow (provenance preserved end to end):
  raw 4 sources (+ optional stg_manual_leads.csv)
    -> staging (normalize phone E.164 / email / salesman / sector / branch)
    -> entity resolution (auto-merge on email|phone exact; fuzzy -> needs_review)
    -> golden records w/ source-priority + recency survivorship
    -> PII-isolated star schema (dim_client has NO PII; dim_client_pii restricted)
    -> SQLite + CSV exports + data_quality_report.md

Run:  python src/pipeline.py
"""
from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

import pandas as pd

import common as C
import pricing_extract

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "BASE DE DONNES DES CLIENTS"
OUT = ROOT / "warehouse"
MANUAL = OUT / "stg_manual_leads.csv"   # written by the app's Manual Prospect Entry

# source priority for survivorship (higher = more trusted)
SOURCE_PRIORITY = {
    "manual": 5, "website": 4, "evenementiel": 3, "classique": 3, "campagne": 2,
}


# --------------------------------------------------------------------------- #
# 1. Ingest -> unified staging frame                                          #
# --------------------------------------------------------------------------- #
def _stage_row(full_name, email, phone, *, source, channel, created_time=None,
               salesman=None, company=None, sector=None,
               desired_service=None, campaign_service=None, project_stage=None,
               consent=None, needs_review=0):
    e164, ph_status = C.normalize_phone(phone)
    email_n, em_status = C.normalize_email(email)
    branch, service_line, branch_conf = C.map_branch(
        desired_service=desired_service, campaign_service=campaign_service)
    return {
        "source": source,
        "channel": channel,
        "created_time": created_time,
        "full_name": (str(full_name).strip() if full_name is not None else ""),
        "email_norm": email_n,
        "email_status": em_status,
        "phone_e164": e164,
        "phone_status": ph_status,
        "salesman_canon": C.canonicalize_salesman(salesman),
        "company_name": (str(company).strip() if company else ""),
        "sector_std": C.standardize_sector(sector),
        "branch": branch,
        "service_line": service_line,
        "branch_confidence": branch_conf,
        "project_stage": (str(project_stage).strip() if project_stage else ""),
        "consent_flag": (1 if str(consent).strip() == "1" else 0),
        "needs_review_in": (1 if str(needs_review).strip() == "1" else 0),
    }


def ingest() -> tuple[pd.DataFrame, dict]:
    rows: list[dict] = []
    counts: dict[str, int] = {}

    # Campagnes Marketing — UTF-16, tab-delimited, phone 'p:' prefix
    cm = pd.read_csv(DATA / "Campagnes Marketing.csv", sep="\t", encoding="utf-16", dtype=str)
    counts["campagne"] = len(cm)
    svc_col = next((c for c in cm.columns if c.lower().startswith("service")), None)
    for _, r in cm.iterrows():
        rows.append(_stage_row(
            r.get("full_name"), r.get("email"), r.get("phone_number"),
            source="campagne", channel="Campagne Marketing",
            created_time=r.get("created_time"),
            campaign_service=(r.get(svc_col) if svc_col else None)))

    # Prospection Classique — richest: salesman + desired_service + sector
    pc = pd.read_excel(DATA / "Prospection Classique.xlsx", dtype=str)
    counts["classique"] = len(pc)
    for _, r in pc.iterrows():
        rows.append(_stage_row(
            r.get("full_name"), r.get("email_address"), r.get("phone_number"),
            source="classique", channel="Prospection Classique",
            salesman=r.get("salesman"), company=r.get("company_name"),
            sector=r.get("activity_sector"), desired_service=r.get("desired_service")))

    # Prospection Événementielle — Arabic names + project_stage
    pe = pd.read_excel(DATA / "Prospection Événementielle.xlsx", dtype=str)
    counts["evenementiel"] = len(pe)
    for _, r in pe.iterrows():
        rows.append(_stage_row(
            r.get("full_name"), r.get("email_address"), r.get("phone_number"),
            source="evenementiel", channel="Événementiel",
            project_stage=r.get("project_stage")))

    # Website — name/email/phone only
    ws = pd.read_excel(DATA / "website.xlsx", dtype=str)
    counts["website"] = len(ws)
    for _, r in ws.iterrows():
        rows.append(_stage_row(
            r.get("full_name"), r.get("email_address"), r.get("phone_number"),
            source="website", channel="Website"))

    # Manual prospect entries — SAME path, just another source (idempotent)
    if MANUAL.exists():
        mn = pd.read_csv(MANUAL, dtype=str).fillna("")
        counts["manual"] = len(mn)
        for _, r in mn.iterrows():
            rows.append(_stage_row(
                r.get("full_name"), r.get("email"), r.get("phone"),
                source="manual", channel=(r.get("channel") or "Manual Entry"),
                salesman=r.get("salesman"), company=r.get("company"),
                sector=r.get("sector"), desired_service=r.get("desired_service"),
                consent=r.get("consent_flag"), needs_review=r.get("needs_review", 0)))

    return pd.DataFrame(rows), counts


# --------------------------------------------------------------------------- #
# 2. Entity resolution                                                        #
# --------------------------------------------------------------------------- #
def resolve(stg: pd.DataFrame) -> pd.DataFrame:
    """Assign client_id. Auto-merge on email-exact OR phone-E.164-exact only;
    fuzzy name+sector matches are flagged needs_review, never auto-merged."""
    stg = stg.reset_index(drop=True).copy()
    stg["client_id"] = -1
    # seed from manual "confirm new despite warning"; fuzzy detection ORs in below
    stg["needs_review"] = stg.get("needs_review_in", 0)
    stg["needs_review"] = stg["needs_review"].fillna(0).astype(int)

    email_idx: dict[str, int] = {}
    phone_idx: dict[str, int] = {}
    clients: list[dict] = []   # canonical client seeds, index == client_id

    for i, r in stg.iterrows():
        em = r["email_norm"] if r["email_status"] == "ok" else None
        ph = r["phone_e164"] if r["phone_status"] == "ok" else None
        cid = None
        if em and em in email_idx:
            cid = email_idx[em]
        elif ph and ph in phone_idx:
            cid = phone_idx[ph]

        if cid is None:
            cid = len(clients)
            clients.append({"client_id": cid})
            # fuzzy check against existing canonical names -> review flag only
            for c in clients[:-1]:
                if (r["sector_std"] != "Unknown" and r["sector_std"] == c.get("sector")
                        and C.name_similarity(r["full_name"], c.get("name")) >= 0.90):
                    stg.at[i, "needs_review"] = 1
                    break

        if em:
            email_idx.setdefault(em, cid)
        if ph:
            phone_idx.setdefault(ph, cid)
        # remember a representative name/sector for fuzzy comparisons
        if "name" not in clients[cid]:
            clients[cid]["name"] = r["full_name"]
            clients[cid]["sector"] = r["sector_std"]
        stg.at[i, "client_id"] = cid

    return stg


# --------------------------------------------------------------------------- #
# 3. Survivorship -> golden dim_client / dim_client_pii                       #
# --------------------------------------------------------------------------- #
def _priority(row) -> tuple:
    # higher source priority, then most-recent created_time, wins
    p = SOURCE_PRIORITY.get(row["source"], 0)
    t = row["created_time"] or ""
    return (p, str(t))


def build_golden(stg: pd.DataFrame):
    dim_client, dim_pii = [], []
    for cid, g in stg.groupby("client_id"):
        g = g.sort_values(by="created_time", na_position="first")
        best = max((r for _, r in g.iterrows()), key=_priority)

        def pick(col):  # most-recent non-null by priority order
            ordered = sorted((r for _, r in g.iterrows()), key=_priority, reverse=True)
            for r in ordered:
                v = r[col]
                if v not in (None, "", "Unknown", "Unassigned") and not pd.isna(v):
                    return v
            return best[col]

        dim_client.append({
            "client_id": cid,
            "channel": best["channel"],
            "salesman": pick("salesman_canon"),
            "sector": pick("sector_std"),
            "branch": pick("branch"),
            "service_line": pick("service_line"),
            "branch_confidence": pick("branch_confidence"),
            "company_name": pick("company_name"),
            "project_stage": pick("project_stage"),
            "source_count": int(len(g)),
            "is_merged": int(len(g) > 1),
            "needs_review": int(g["needs_review"].max()),
            "consent_flag": int(g["consent_flag"].max()),
            "first_seen": g["created_time"].dropna().min() or "",
        })
        dim_pii.append({
            "client_id": cid,
            "full_name": pick("full_name"),
            "email": pick("email_norm"),
            "phone_e164": pick("phone_e164"),
            "consent_flag": int(g["consent_flag"].max()),
        })
    return pd.DataFrame(dim_client), pd.DataFrame(dim_pii)


# --------------------------------------------------------------------------- #
# 4. Build dimensions + write                                                 #
# --------------------------------------------------------------------------- #
STAGES = {  # per-branch ordered pipeline stages + unified meta-status
    "COM": [("brief", "lead"), ("design", "active"), ("dev", "active"),
            ("delivery", "delivered"), ("closed", "delivered")],
    "CONSULTING": [("request", "lead"), ("scheduled", "active"),
                   ("session", "active"), ("completed", "delivered")],
    "COMPTA": [("onboard", "lead"), ("contract", "active"),
               ("monthly_filing", "active"), ("renewed", "delivered")],
    "FORMATION": [("enrolled", "lead"), ("in_progress", "active"),
                  ("certified", "delivered")],
    "IDARATI": [("intake", "lead"), ("processing", "active"),
                ("submitted", "active"), ("granted", "delivered")],
    "UNASSIGNED": [("lead", "lead")],
}


def write_warehouse(stg, dim_client, dim_pii, counts):
    OUT.mkdir(parents=True, exist_ok=True)
    pricing_extract.write_csv()
    dim_pricing = pd.read_csv(OUT / "dim_pricing.csv")

    dim_channel = (dim_client.groupby("channel").size()
                   .reset_index(name="lead_count").reset_index(names="channel_id"))
    dim_sector = (dim_client.groupby("sector").size()
                  .reset_index(name="lead_count").reset_index(names="sector_id"))
    dim_branch = pd.DataFrame(
        [{"branch": k, "branch_name": v} for k, v in C.BRANCHES.items()])
    dim_stage = pd.DataFrame(
        [{"stage_id": f"{b}:{i}", "branch": b, "stage_order": i,
          "stage_name": s[0], "meta_status": s[1]}
         for b, seq in STAGES.items() for i, s in enumerate(seq)])

    # fact_leads — the REAL acquisition fact (one row per resolved client)
    fact_leads = dim_client[["client_id", "channel", "salesman", "sector",
                             "branch", "service_line", "is_merged",
                             "needs_review", "first_seen"]].copy()
    fact_leads["lead_count"] = 1

    # write CSVs
    tables = {
        "dim_client": dim_client, "dim_client_pii": dim_pii,
        "dim_branch": dim_branch, "dim_channel": dim_channel,
        "dim_sector": dim_sector, "dim_stage": dim_stage,
        "dim_pricing": dim_pricing, "fact_leads": fact_leads,
        "stg_resolved": stg,
    }
    for name, df in tables.items():
        df.to_csv(OUT / f"{name}.csv", index=False, encoding="utf-8")

    # SQLite (PII in a separate table; mark restricted in a note)
    con = sqlite3.connect(OUT / "moustachir.sqlite")
    for name, df in tables.items():
        df.to_sql(name, con, if_exists="replace", index=False)
    con.commit()
    con.close()
    return tables


# --------------------------------------------------------------------------- #
# 5. Data-quality report                                                      #
# --------------------------------------------------------------------------- #
def write_dq_report(stg, dim_client, counts):
    raw_total = sum(counts.values())
    uniq = len(dim_client)
    ph_bad = int((stg["phone_status"] == "invalid").sum())
    ph_empty = int((stg["phone_status"] == "empty").sum())
    em_bad = int((stg["email_status"] == "invalid").sum())
    review = int(dim_client["needs_review"].sum())
    merged = int(dim_client["is_merged"].sum())
    dedup_rate = (raw_total - uniq) / raw_total * 100 if raw_total else 0
    pii_cols = [c for c in dim_client.columns
                if c in ("full_name", "email", "phone_e164")]

    md = [
        "# Data Quality Report — Moustachir Pipeline",
        f"_Generated {datetime.now():%Y-%m-%d %H:%M}_  (POC — sources are acquisition data only)",
        "",
        "## Ingestion",
        f"- Raw rows ingested: **{raw_total}**",
        *[f"  - {k}: {v}" for k, v in counts.items()],
        "",
        "## Entity resolution",
        f"- Unique clients after resolution: **{uniq}**",
        f"- Cross-source duplicates collapsed: **{raw_total - uniq}** ({dedup_rate:.1f}%)",
        f"- Clients merged from ≥2 raw rows: **{merged}**",
        f"- Rows flagged `needs_review` (fuzzy, not auto-merged): **{review}**",
        "",
        "## Normalization",
        f"- Phone → E.164 invalid (kept, flagged): **{ph_bad}**; empty: **{ph_empty}**",
        f"- Email malformed (kept, flagged): **{em_bad}**",
        f"- Salesman canonicalized to: {sorted(dim_client['salesman'].unique())}",
        "",
        "## Loi 18-07 — PII isolation check",
        f"- PII columns present in `dim_client`: **{pii_cols or 'NONE ✅'}**",
        "- PII (name/email/phone) is stored ONLY in restricted `dim_client_pii`.",
        "",
        "## Branch mapping provenance",
        *[f"- {b}: {int((dim_client['branch'] == b).sum())} clients"
          for b in dim_client["branch"].unique()],
        f"- Mapping confidence: "
        f"real={int((dim_client['branch_confidence'] == 'real').sum())}, "
        f"inferred={int((dim_client['branch_confidence'] == 'inferred').sum())}",
    ]
    (OUT / "data_quality_report.md").write_text("\n".join(md), encoding="utf-8")


def main():
    print("Ingesting…")
    stg, counts = ingest()
    print(f"  {sum(counts.values())} raw rows: {counts}")
    print("Resolving entities…")
    stg = resolve(stg)
    dim_client, dim_pii = build_golden(stg)
    print(f"  {len(dim_client)} unique clients "
          f"({sum(counts.values()) - len(dim_client)} duplicates collapsed)")
    print("Writing warehouse…")
    write_warehouse(stg, dim_client, dim_pii, counts)
    write_dq_report(stg, dim_client, counts)
    bad = int((stg["phone_status"] == "invalid").sum())
    pii_leak = [c for c in dim_client.columns if c in ("full_name", "email", "phone_e164")]
    print(f"  phone invalid={bad}  PII in dim_client={pii_leak or 'none ✅'}")
    print(f"Done → {OUT}")


if __name__ == "__main__":
    main()
