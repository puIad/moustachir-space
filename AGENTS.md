# AGENTS.md

Two apps over one KPI contract. See `README.md`.

- `spec/` is the locked contract: `kpi-definitions.md` and `entities.ts`. Change it deliberately, both apps follow it.
- Python side (`src/`): `python src/pipeline.py`, then `python src/kpis.py`, then `streamlit run src/app.py`. Tests: `tests/test_foundry.py`. Needs pandas and streamlit.
- React side (`app/`): Node 20+, `npm install`, `npm run dev`, `npm run build`. KPIs are pure functions in `app/src/lib/kpis.ts`.
- Provenance rule: Axes 2 and 3 are real data; Axes 1, 4 and NPS are projections flagged `is_sample` and must show a projection badge. Never present projected figures as real.
- Personal data (name, email, phone) is masked by default (Algerian law 18-07). Keep it that way.
