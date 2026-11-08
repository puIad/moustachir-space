# Moustachir BI & Performance Platform

Business intelligence and performance platform built for the Moustachir data challenge. It turns scattered operational data into one set of KPIs, shown in two apps that follow the same contract.

| Part | What | Stack |
|---|---|---|
| `src/` | data pipeline, KPI computation, dashboard | Python, pandas, Streamlit |
| `app/` | offline-first analytics app | React 18, TypeScript, Vite, Dexie (IndexedDB), Zustand, Chart.js |
| `spec/` | the locked KPI contract: formulas, source fields, entities | Markdown, TypeScript |

## Data honesty

Real and projected figures are kept apart. Commercial (Axe 2) and salesman acquisition (Axe 3) figures are real. Financial (Axe 1), operational (Axe 4) and NPS figures are projections, flagged `is_sample`, and every such page carries a projection badge. Personal data (name, email, phone) is masked by default, in line with Algerian law 18-07.

## Run the Python side

```bash
python src/pipeline.py
python src/kpis.py
streamlit run src/app.py
```

Needs pandas and streamlit. Tests: `tests/test_foundry.py`.

## Run the React app

```bash
cd app
npm install
npm run dev       # http://localhost:5173
npm run build
```

Node 20 or later. See [app/README.md](app/README.md) for details.

## More

- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): 5 to 8 minute jury demo script
- [spec/kpi-definitions.md](spec/kpi-definitions.md): every KPI, its formula and whether it is real or simulated
- `Problem Statement/`, `Knowledge Base/`: the challenge brief and project notes
