"""
app.py — Moustachir BI dashboard (Streamlit).

Run:  streamlit run src/app.py
Prereq: python src/pipeline.py && python src/kpis.py

Design rules honoured:
  - Axe 2 / Axe 3 = REAL data (green).
  - Axe 1 / Axe 4 / NPS = PROJECTION; every such page shows a red banner and the
    figures are flagged is_sample. Methodology is never hidden.
  - Loi 18-07: PII (name/email/phone) is masked by default; an access-control
    passphrase in the sidebar reveals cleartext (demo of need-to-know access).
"""
from __future__ import annotations

import csv
from pathlib import Path

import pandas as pd
import streamlit as st

import common as C

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "warehouse"
MANUAL = OUT / "stg_manual_leads.csv"
PII_PASSPHRASE = "moustachir"   # demo access control (not a real secret)

st.set_page_config(page_title="Moustachir BI", page_icon="📊", layout="wide")


@st.cache_data
def load(name):
    p = OUT / f"{name}.csv"
    return pd.read_csv(p) if p.exists() else pd.DataFrame()


def sim_banner():
    st.markdown(
        "<div style='background:#7f1d1d;color:#fff;padding:8px 14px;border-radius:6px;"
        "font-weight:600'>⚠ PROJECTION — simulated figures derived from the Offres de "
        "Services (is_sample=1). NOT booked revenue. See assumptions.md.</div>",
        unsafe_allow_html=True)


def real_badge():
    st.markdown(
        "<div style='background:#14532d;color:#fff;padding:8px 14px;border-radius:6px;"
        "font-weight:600'>✅ REAL data — resolved from the 4 source files.</div>",
        unsafe_allow_html=True)


def _append_manual(rec: dict):
    cols = ["full_name", "email", "phone", "channel", "salesman", "company",
            "sector", "desired_service", "consent_flag", "needs_review"]
    rec = {c: rec.get(c, "") for c in cols}
    new = not MANUAL.exists()
    MANUAL.parent.mkdir(parents=True, exist_ok=True)
    with MANUAL.open("a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        if new:
            w.writeheader()
        w.writerow(rec)
    load.clear()


# ---- guard: warehouse must be built ---- #
if load("dim_client").empty:
    st.error("Warehouse not built. Run:  python src/pipeline.py && python src/kpis.py")
    st.stop()

dim_client = load("dim_client")
fact_tx = load("fact_transaction")
fact_stage = load("fact_client_stage")
fact_fb = load("fact_feedback")
dim_pricing = load("dim_pricing")
dim_pii = load("dim_client_pii")

# ---- sidebar nav + filters ---- #
st.sidebar.title("Moustachir BI")
page = st.sidebar.radio("View", [
    "Overview", "Axe 2 — Commercial (real)", "Axe 3 — Salesman (real)",
    "Axe 1 — Financial (projection)", "Axe 4 — Operational (projection)",
    "NPS feedback (projection)", "Manual Prospect Entry", "Cost Engine", "Clients (PII)"])

st.sidebar.markdown("---")
ch_opts = ["(all)"] + sorted(dim_client["channel"].dropna().unique().tolist())
br_opts = ["(all)"] + sorted(dim_client["branch"].dropna().unique().tolist())
f_channel = st.sidebar.selectbox("Channel", ch_opts)
f_branch = st.sidebar.selectbox("Branch", br_opts)


def apply_filters(df):
    if df.empty:
        return df
    if f_channel != "(all)" and "channel" in df:
        df = df[df["channel"] == f_channel]
    if f_branch != "(all)" and "branch" in df:
        df = df[df["branch"] == f_branch]
    return df


dc = apply_filters(dim_client)
ftx = apply_filters(fact_tx)

# =========================================================================== #
if page == "Overview":
    st.title("📊 Moustachir — Unified Data Overview")
    st.caption("Sources are acquisition/lead data. Axe 2 & 3 are real; Axe 1 & 4 "
               "are projections derived from the Offres de Services.")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Unique clients (real)", f"{len(dim_client):,}")
    c2.metric("Salesmen (real)", dim_client["salesman"].nunique())
    c3.metric("Merged duplicates (real)", int(dim_client["is_merged"].sum()))
    c4.metric("Sim. recognized revenue", f"{fact_tx['recognized_revenue'].sum():,.0f} DA",
              help="PROJECTION — is_sample=1")
    st.markdown("---")
    a, b = st.columns(2)
    with a:
        st.subheader("Leads by channel (real)")
        st.bar_chart(dim_client.groupby("channel").size())
    with b:
        st.subheader("Leads by branch (real)")
        st.bar_chart(dim_client.groupby("branch").size())
    st.info("Branch mapping: 637 clients mapped from a real source field; 814 "
            "(Website + Événementiel) carry no service signal and are 'UNASSIGNED' "
            "— shown honestly rather than invented.")

elif page == "Axe 2 — Commercial (real)":
    st.title("Axe 2 — Commercial")
    real_badge()
    st.subheader("Leads by channel × branch")
    pivot = dc.groupby(["channel", "branch"]).size().unstack(fill_value=0)
    st.bar_chart(pivot)
    a, b = st.columns(2)
    a.subheader("By sector"); a.bar_chart(dc.groupby("sector").size())
    b.subheader("By service line"); b.bar_chart(dc.groupby("service_line").size())
    st.dataframe(dc.groupby(["branch", "sector"]).size().reset_index(name="leads"),
                 use_container_width=True)

elif page == "Axe 3 — Salesman (real)":
    st.title("Axe 3 — Salesman performance")
    real_badge()
    a3 = load("kpi_axe3_salesman")
    st.bar_chart(a3.set_index("salesman")["leads"])
    st.caption("`converted_sim` and `sim_revenue_da` below are projections (is_sample).")
    st.dataframe(a3.sort_values("leads", ascending=False), use_container_width=True)

elif page == "Axe 1 — Financial (projection)":
    st.title("Axe 1 — Financial")
    sim_banner()
    if ftx.empty:
        st.warning("No simulated transactions for this filter.")
    else:
        c1, c2, c3 = st.columns(3)
        c1.metric("Recognized revenue", f"{ftx['recognized_revenue'].sum():,.0f} DA",
                  help="Moustachir's own revenue + commission cut only")
        c2.metric("Gross platform volume", f"{ftx['gross_flow_amount'].sum():,.0f} DA",
                  help="Includes Rentabilité pass-through flow — NOT revenue")
        c3.metric("Projected margin", f"{ftx['projected_margin'].sum():,.0f} DA")
        st.subheader("Recognized revenue by branch & revenue model")
        st.bar_chart(ftx.groupby("branch")["recognized_revenue"].sum())
        st.caption("Recognized (revenue) vs gross flow (volume) — commission rows "
                   "recognize only the cut. Headline KPIs use recognized only.")
        st.dataframe(ftx.groupby(["branch", "revenue_model", "recognition_type"]).agg(
            recognized_da=("recognized_revenue", "sum"),
            gross_flow_da=("gross_flow_amount", "sum")).reset_index(),
            use_container_width=True)

elif page == "Axe 4 — Operational (projection)":
    st.title("Axe 4 — Operational (pipeline / progress)")
    sim_banner()
    fs = apply_filters(fact_stage)
    st.subheader("Clients by meta-status")
    st.bar_chart(fs.groupby("meta_status").size())
    st.subheader("Per-branch stage distribution")
    st.dataframe(fs.groupby(["branch", "stage_name", "meta_status"]).size()
                 .reset_index(name="clients"), use_container_width=True)

elif page == "NPS feedback (projection)":
    st.title("NPS & feedback")
    sim_banner()
    ffb = apply_filters(fact_fb)
    if not ffb.empty:
        promoters = (ffb["score"] >= 9).mean()
        detractors = (ffb["score"] <= 6).mean()
        st.metric("NPS (simulated)", f"{(promoters - detractors) * 100:.0f}")
        a, b = st.columns(2)
        a.subheader("NPS by channel")
        a.bar_chart(ffb.groupby("channel")["score"].mean())
        b.subheader("NPS by salesman")
        b.bar_chart(ffb.groupby("salesman")["score"].mean())

elif page == "Manual Prospect Entry":
    st.title("➕ Manual Prospect Entry (Feature 1)")
    st.caption("Input is normalized by the SAME pipeline functions. Suspected "
               "duplicates trigger a warn-but-allow forced choice (needs_review).")
    with st.form("entry"):
        col1, col2 = st.columns(2)
        full_name = col1.text_input("Full name *")
        email = col2.text_input("Email")
        phone = col1.text_input("Phone (any format)")
        channel = col2.selectbox("Channel", ["Manual Entry", "Prospection Classique",
                                             "Website", "Événementiel"])
        desired = col1.selectbox("Desired service", ["", "Moustachir com",
                                 "Moustachir academy", "Moustachir consulting",
                                 "Moustachir rentabilité", "Idarati"])
        salesman = col2.text_input("Salesman")
        sector = col1.text_input("Activity sector")
        company = col2.text_input("Company")
        consent = st.checkbox("Consent obtained (Loi 18-07 lawful basis)", value=True)
        submitted = st.form_submit_button("Check & add")

    if submitted:
        if not full_name.strip():
            st.error("Full name required.")
        else:
            e164, ph_st = C.normalize_phone(phone)
            email_n, em_st = C.normalize_email(email)
            sector_std = C.standardize_sector(sector)
            st.write(f"Normalized → phone: `{e164 or 'invalid'}` ({ph_st}) · "
                     f"email: `{email_n or '—'}` ({em_st}) · sector: `{sector_std}`")
            base = dict(full_name=full_name, email=email_n or "", phone=e164 or phone,
                        channel=channel, salesman=salesman, company=company,
                        sector=sector, desired_service=desired,
                        consent_flag=1 if consent else 0)
            # 1) EXACT key (email|phone) -> auto-merge by rule (decision #8). No choice.
            exact, reason = None, ""
            if email_n and not dim_pii.empty and (dim_pii["email"] == email_n).any():
                exact = dim_pii[dim_pii["email"] == email_n].iloc[0]; reason = "email"
            elif e164 and not dim_pii.empty and (dim_pii["phone_e164"] == e164).any():
                exact = dim_pii[dim_pii["phone_e164"] == e164].iloc[0]; reason = "phone"
            if exact is not None:
                _append_manual(base)
                st.info(f"Exact {reason} match → existing client #{int(exact['client_id'])} "
                        f"({C.mask_name(exact['full_name'])}). Per the auto-merge rule this "
                        "row will LINK on the next pipeline run — no duplicate is created.")
            else:
                # 2) FUZZY name+sector (no exact key) -> warn-but-allow forced choice
                cand = dim_pii.merge(dim_client[["client_id", "sector"]], on="client_id", how="left")
                fuzzy = None
                if sector_std != "Unknown":
                    same = cand[cand["sector"] == sector_std]
                    for _, m in same.iterrows():
                        if C.name_similarity(full_name, m["full_name"]) >= 0.85:
                            fuzzy = m; break
                if fuzzy is not None:
                    st.warning(f"⚠ Fuzzy match (name + sector '{sector_std}') → client "
                               f"#{int(fuzzy['client_id'])}: {C.mask_name(fuzzy['full_name'])}. "
                               "No exact email/phone key, so this is NOT auto-merged.")
                    st.session_state["pending"] = base
                    st.session_state["needs_choice"] = True
                else:
                    _append_manual(base)
                    st.success("New prospect added to staging. Re-run pipeline.py (idempotent).")

    if st.session_state.get("needs_choice"):
        st.markdown("**Forced choice on suspected (fuzzy) duplicate:**")
        choice = st.radio("Action", ["Link to existing (skip new row)",
                                     "Confirm new (flag needs_review)"])
        if st.button("Confirm choice"):
            p = st.session_state["pending"]
            if choice.startswith("Confirm new"):
                p["needs_review"] = 1
                _append_manual(p)
                st.success("New prospect added, flagged needs_review for a human to confirm.")
            else:
                st.info("Linked to existing client — no duplicate row created.")
            st.session_state["needs_choice"] = False

elif page == "Cost Engine":
    st.title("💰 Cost / Pricing Engine (Feature 3)")
    st.caption("Quote from real Offre prices. Margin uses an assumed cost_ratio "
               "(is_sample) — see assumptions.md.")
    br = st.selectbox("Branch", sorted(dim_pricing["branch"].unique()))
    sub = dim_pricing[dim_pricing["branch"] == br]
    item = st.selectbox("Service", sorted(sub["item"].unique()))
    sub2 = sub[sub["item"] == item]
    tier = st.selectbox("Tier", sub2["tier"].tolist())
    row = sub2[sub2["tier"] == tier].iloc[0]
    qty = st.number_input("Quantity / hours / months", 1, 100, 1)

    base = float(row["base_price_da"] or 0)
    model = row["revenue_model"]
    if model == "commission_pct":
        flow = st.number_input("Estimated consultant flow (DA)", 10000, 5_000_000, 200000, step=10000)
        comm = float(row["commission_rate"] or 0.20)
        quote = flow * comm
        st.metric("Moustachir commission (recognized)", f"{quote:,.0f} DA",
                  help=f"{comm:.0%} of flow — rate is TBV placeholder")
        st.metric("Client tax saving (IFU 5% vs 58.75%)", "53.75% of consultant cost")
    elif model == "recurring_monthly":
        monthly = float(row["recurring_da"] or base) / (12 if row["recurring_period"] == "yearly" else 1)
        quote = monthly * qty
        st.metric("Quote (recurring)", f"{quote:,.0f} DA  ({monthly:,.0f}/mo × {qty})")
    else:
        quote = base * qty
        st.metric("Quote", f"{quote:,.0f} DA")
    margin = quote * (1 - float(row["cost_ratio"] or 0))
    st.metric("Projected margin (simulated)", f"{margin:,.0f} DA",
              help=f"cost_ratio={row['cost_ratio']} (assumed)")
    if row["confidence"] == "tbv":
        st.warning("⚠ This price is a TBV placeholder — not from a published Offre.")
    else:
        st.caption(f"Source: {row['source_pdf']} p.{row['source_page']}")

elif page == "Clients (PII)":
    st.title("Clients — PII (Loi 18-07: masked by default)")
    unlock = st.sidebar.text_input("PII access passphrase", type="password")
    show_clear = unlock == PII_PASSPHRASE
    if show_clear:
        st.success("Access granted — cleartext PII (audit this access).")
        view = dim_pii.copy()
    else:
        st.info("Masked view. Enter the access passphrase in the sidebar to reveal "
                "(demo of need-to-know access control).")
        view = dim_pii.copy()
        view["full_name"] = view["full_name"].map(C.mask_name)
        view["email"] = view["email"].map(C.mask_email)
        view["phone_e164"] = view["phone_e164"].map(C.mask_phone)
    st.dataframe(view, use_container_width=True)
