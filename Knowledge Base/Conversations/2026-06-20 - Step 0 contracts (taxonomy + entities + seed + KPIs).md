---
tags: [conversation, project]
date: 2026-06-20
---
# 2026-06-20 — Step 0 contracts (taxonomy + entities + seed + KPIs)

## Ask
Run **Step 0** of the Moustachir BI Platform roadmap: a planning/contracts step (no app code). Lock the
shared contracts every later session imports so nothing drifts — taxonomy, entity types, seed schema, KPI
definitions — by reading `NEW Implementation.docx` + the `warehouse/` real data.

## What we did
- Read the full vision doc (954 non-empty paras), all 18 `warehouse/*.csv` headers, `kpi_summary.json`,
  `data_quality_report.md`, the Power BI theme, and distinct branch/service/stage codes.
- Wrote four `/spec` contracts + started `PROGRESS.md`.
- Reconciled the doc's **four parallel naming systems** for the 5 branches into one `branchKey` mapping.

## Artifacts
- [spec/taxonomy.md](../../spec/taxonomy.md) — 5 branches + triage bucket, 4-way mapping, colors, entity ownership, stages.
- [spec/entities.ts](../../spec/entities.ts) — 15 typed entities + all enums, REAL/SIM/DERIVED tags, FKs.
- [spec/seed-schema.md](../../spec/seed-schema.md) — `seed.json` + `data_quality.json` envelopes, Dexie index map.
- [spec/kpi-definitions.md](../../spec/kpi-definitions.md) — every KPI's formula + REAL/SIMULATED tag.
- [PROGRESS.md](../../PROGRESS.md) — Step 0 handoff entry.

## Decisions & gotchas
- **Resolve branches by `branchKey`, never display string.** IDARATI↔"Management" (dual: admin service +
  internal HQ). UNASSIGNED (814 clients) = triage bucket, not a nav branch / not colored.
- **Provenance is immutable:** Axe2/Axe3 REAL (1,451 clients, 14 salesmen, lead counts); Axe1/Axe4/NPS
  SIMULATED (10,729,000 DA revenue, 6,043,400 DA margin, 16,000 DA MRR, NPS 33.3%). Projection badges required.
- Doc's "~15" = **14 core entities + AuditEvent**; branch UI labels (Invoice/Student/Objective/…) are aliases
  over the 14, not new tables.
- MRR = average-over-active-months (matches the 19 Jun Power BI context-transition fix), not a raw sum.
- Node not yet installed → couldn't `tsc` the spec; it's a hand-validated contract. Node 20+ is a Step 1 prereq.

## Next steps
- **Step 1** — Scaffold Vite + React 18 + TS, port the design system, app shell (2-group sidebar + global
  filters) + routing + FR/EN i18n. Invoke `frontend-design`.

## Links
- [[KB - Home]] · [[2026-06-19 - Power BI model completion]] · [[2026-06-19 - Moustachir POC pre-flight grill + build]]
