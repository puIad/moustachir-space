"""
pricing_extract.py — Seeds `dim_pricing` from Moustachir's Offres de Services.

The price figures below were extracted at build time from the real PDFs:
  - Moustachir_Com_Offre_de_Services.pdf        (native text, branding + strategy)
  - Moustachir_Com_Offre_de_Services_IT_-_EN.pdf (native text, web/app dev catalog)
  - Solution_rentabilit__open_innovation.pdf     (image pages, read via render/vision)

Every row records its `source_pdf` + `source_page` so any number is auditable.
`confidence`:
  - "real" : transcribed directly from a published Offre page.
  - "tbv"  : To-Be-Verified placeholder — NOT in any provided PDF (Consulting
             hourly rate, Formation tuition, Idarati dossier fees, and the
             Rentabilité PLATFORM COMMISSION rate). Documented in assumptions.md.

IMPORTANT (anti-fabrication): the earlier Gemini framing claimed a "20% platform
commission / 5% split". The real PDF shows only the legally-fixed **IFU 5%
retenue à la source libératoire** (Art. 10, JO N°79, 30/12/2018) vs a **58.75%**
classic burden (IRG 15% + CNAS 35% + redressement 8.75%). The 5% is a CLIENT tax
benefit, not Moustachir revenue. Moustachir's own commission rate is unknown in
the data → carried as a TBV placeholder, never asserted as 20%.

`cost_ratio` (for the margin projection in the Cost Engine) is an assumed share
of price consumed by delivery cost. All margin output is flagged is_simulated.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "warehouse"
COM = "Moustachir_Com_Offre_de_Services.pdf"
ITEN = "Moustachir_Com_Offre_de_Services_IT_-_EN.pdf"
RENT = "Solution_rentabilit__open_innovation.pdf"

# Legally-fixed / model fiscal constants (Rentabilité) — real, with citation.
IFU_RATE = 0.05          # retenue à la source libératoire (IFU), Art. 10 JO N°79
CLASSIC_BURDEN = 0.5875  # IRG 15% + CNAS 35% + redressement 8.75%
CLIENT_TAX_SAVING = round(CLASSIC_BURDEN - IFU_RATE, 4)  # 0.5375 (Customer axis)

# columns: branch, service_line, item, tier, base_price_da, recurring_da,
#          recurring_period, revenue_model, commission_rate, cost_ratio,
#          source_pdf, source_page, confidence
PRICING: list[dict] = []


def add(branch, service_line, item, tier, price, revenue_model, *, recurring=0,
        recurring_period="", commission_rate="", cost_ratio=0.0,
        src="", page="", confidence="real"):
    PRICING.append(dict(
        branch=branch, service_line=service_line, item=item, tier=tier,
        base_price_da=price, recurring_da=recurring, recurring_period=recurring_period,
        revenue_model=revenue_model, commission_rate=commission_rate,
        cost_ratio=cost_ratio, source_pdf=src, source_page=page, confidence=confidence,
    ))


# --- COM : Branding (real, COM PDF p2) ------------------------------------- #
for tier, price in [("Basic", 73000), ("Pro", 113000), ("Entreprise", 183000)]:
    add("COM", "com_branding", "Branding pack", tier, price, "one_time",
        cost_ratio=0.35, src=COM, page=2)

# --- COM : Marketing strategy (real, COM PDF p3) --------------------------- #
add("COM", "com_digital", "Stratégie Marketing (6 mois)", "Standard", 119000,
    "one_time", cost_ratio=0.40, src=COM, page=3)

# --- COM : Web development catalog (real, IT-EN PDF) ----------------------- #
# (representative packages; one-time dev fee + annual recurring)
_web = [
    ("Single-service / Landing site", 4, [28000, 35000, 42000], [8000, 10000, 14000]),
    ("Multi-page business site",       5, [40000, 56000, 64000], [8000, 10000, 14000]),
    ("Corporate website",              6, [80000, 100000, 160000], [8000, 10000, 14000]),
    ("Portfolio site",                 7, [35000, 47000, 100000], [8000, 10000, 14000]),
    ("E-commerce store",               9, [120000, 160000, 190000], [8000, 10000, 14000]),
]
for item, page, prices, recs in _web:
    for tier, price, rec in zip(("Basic", "Pro", "Enterprise"), prices, recs):
        add("COM", "com_web_dev", item, tier, price, "one_time",
            recurring=rec, recurring_period="yearly", cost_ratio=0.45, src=ITEN, page=page)

# --- COM : Mobile app (real, IT-EN PDF p19 appointment booking) ------------ #
for tier, price in zip(("Basic", "Pro", "Enterprise"), (200000, 280000, 320000)):
    add("COM", "com_web_dev", "Mobile app (appointment booking)", tier, price,
        "one_time", recurring=25000, recurring_period="yearly", cost_ratio=0.50, src=ITEN, page=19)

# --- COM : Maintenance plans (real, IT-EN PDF p25) ------------------------- #
for tier, rec in zip(("Basic", "Standard", "Premium"), (30000, 60000, 120000)):
    add("COM", "com_web_dev", "Maintenance plan", tier, 0, "recurring_monthly",
        recurring=rec, recurring_period="yearly", cost_ratio=0.30, src=ITEN, page=25)

# --- COM : Custom solutions (real, IT-EN PDF p28) -------------------------- #
for tier, price in zip(("Basic", "Pro", "Enterprise"), (300000, 400000, 600000)):
    add("COM", "com_web_dev", "Custom solution", tier, price, "one_time",
        cost_ratio=0.50, src=ITEN, page=28)

# --- CONSULTING : Technical consulting packages (real, IT-EN PDF p26-27) --- #
for tier, price in zip(("Quick review", "Standard", "Deep dive"), (10000, 30000, 50000)):
    add("CONSULTING", "consulting_package", "Technical consulting", tier, price,
        "one_time", cost_ratio=0.30, src=ITEN, page=27)
# Expert hourly booking (the Consulting branch core model) — rate NOT published.
add("CONSULTING", "consulting_hourly", "Expert booking (per hour)", "Standard", 2500,
    "hourly", cost_ratio=0.30, src="(none)", page="", confidence="tbv")

# --- COMPTA / RENTABILITÉ -------------------------------------------------- #
# Rentabilité = consultant brokerage; Moustachir recognises only its commission.
# The platform commission rate is NOT in any PDF -> TBV placeholder (0.20).
add("COMPTA", "rentabilite_commission", "Platform commission on consultant flow",
    "Standard", 0, "commission_pct", commission_rate=0.20, cost_ratio=0.40,
    src=RENT, page="11 (model); rate not published", confidence="tbv")
# Compta admin (Idarati accounting + monthly IFU G-12 declaration) — fee TBV.
add("COMPTA", "compta_admin", "Accounting + monthly IFU G-12 declaration",
    "Standard", 0, "recurring_monthly", recurring=8000, recurring_period="monthly",
    cost_ratio=0.30, src="(none)", page="", confidence="tbv")

# --- FORMATION (Academy) — tuition NOT in provided PDFs -> TBV ------------- #
add("FORMATION", "academy", "B2C online course (seat)", "Standard", 15000, "one_time",
    cost_ratio=0.40, src="(none)", confidence="tbv")
add("FORMATION", "academy", "B2B corporate training path", "Enterprise", 150000, "one_time",
    cost_ratio=0.45, src="(none)", confidence="tbv")

# --- IDARATI — dossier fees NOT in provided PDFs -> TBV -------------------- #
add("IDARATI", "idarati_admin", "Company creation dossier", "Standard", 25000, "one_time",
    cost_ratio=0.25, src="(none)", confidence="tbv")
add("IDARATI", "idarati_admin", "BTP Express public-works bid assistance", "Standard", 40000,
    "one_time", cost_ratio=0.25, src="(none)", confidence="tbv")


def write_csv() -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "dim_pricing.csv"
    cols = ["pricing_ref", "branch", "service_line", "item", "tier", "base_price_da",
            "recurring_da", "recurring_period", "revenue_model", "commission_rate",
            "cost_ratio", "source_pdf", "source_page", "confidence"]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for i, row in enumerate(PRICING, 1):
            row = {"pricing_ref": f"PR{i:03d}", **row}
            w.writerow(row)
    return path


if __name__ == "__main__":
    p = write_csv()
    real = sum(1 for r in PRICING if r["confidence"] == "real")
    tbv = sum(1 for r in PRICING if r["confidence"] == "tbv")
    print(f"dim_pricing written: {p}")
    print(f"  {len(PRICING)} rows  ({real} real / {tbv} TBV placeholders)")
    print(f"  Rentabilité fiscal: IFU={IFU_RATE:.0%}  classic={CLASSIC_BURDEN:.2%}  "
          f"client_saving={CLIENT_TAX_SAVING:.2%}")
