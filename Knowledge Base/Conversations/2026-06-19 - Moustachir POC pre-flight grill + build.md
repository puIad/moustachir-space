---
tags: [conversation, project]
date: 2026-06-19
---
# 2026-06-19 — Moustachir POC: pre-flight grill + build

## Ask
Critical pre-flight review of a 7-step data-centralization plan for Moustachir SPA,
then (after a `/grill-me` interview locking the business logic) build the
jury-grade proof of concept: ETL → star schema → BI dashboard, with 4 features and
5 business branches modelled.

## What we did
- Ran an 8-question `grill-me` interview resolving every open branch.
- Audited the real on-disk data (4 acquisition sources, 1,593 raw rows) and the
  Offres de Services PDFs (extracted real pricing; read the image-only Rentabilité
  model via render/vision).
- Built and verified the full POC end-to-end.

## Artifacts
- `src/common.py`, `src/pricing_extract.py`, `src/pipeline.py`, `src/kpis.py`, `src/app.py`
- `warehouse/` — star schema (SQLite + CSV), KPIs, `data_quality_report.md`
- `assumptions.md`, `compliance_notes.md`, `README.md`, `POWERBI_SETUP.md`
- Plan: `~/.claude/plans/you-are-a-principal-optimized-zebra.md`

## Decisions & gotchas
- **Jury POC**: Axe 2/3 real; Axe 1/4 = deterministic projections flagged `is_sample=1`.
- **Anti-fabrication win**: the Gemini "20%/5% split" is wrong. Real model = IFU **5%**
  retenue à la source (Art. 10 JO N°79, 30/12/2018) vs **58.75%** classic burden →
  client tax saving ~53.75% (Customer axis). Moustachir commission rate is **TBV**.
- **Loi 18-07**: no hashing (debunked). PII isolated in `dim_client_pii`; mask-on-output.
- One `fact_transaction` with `revenue_model`; commission rows recognize the cut only
  (`recognized_revenue` ≤ `gross_flow_amount`).
- Manual entry = another ingestion source; exact email/phone → auto-merge; fuzzy →
  `needs_review`. Idempotency + `needs_review` propagation verified.
- Gotcha fixed: `_append_manual` ordering in Streamlit; manual `needs_review` was not
  ingested until pipeline patched.

## Next steps
- Confirm TBV rates (Consulting hourly, Formation/Idarati fees, Rentabilité commission %).
- Build the Power BI `.pbix` from `POWERBI_SETUP.md` for Livrable 2.
- Finalize the presentation deck (Livrable 1) with real Axe 2/3 + flagged Axe 1/4.

## Links
- [[KB - Home]]
- Run: `python src/pipeline.py && python src/kpis.py && streamlit run src/app.py`
