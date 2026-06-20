---
tags: [conversation, project, powerbi]
date: 2026-06-19
---
# 2026-06-19 — Power BI model completion (Moustachir)

## Ask
User had started `warehouse/PBI_warehouse.pbix` (data loaded, 9 relationships, 7 measures).
Asked me to finish the Power BI setup using the **powerbi-modeling-mcp**, following
**subagent-driven-development** + **test-driven-development**, then report drastic changes.
(Earlier in the session: corrected the relationship set to a snowflake and fixed a pasted-DAX
syntax error.)

## What we did
TDD against the live model (DAX query = the test): query → watch fail → fix → watch pass.
- **Verified 7 measures** vs warehouse ground truth. 6/7 correct.
- **Found + fixed an MRR bug**: live value 160 000 (grand total) instead of 16 000 (monthly avg).
  Root cause: `AVERAGEX(VALUES(period_date), SUM(...))` with **no context transition** — `SUM`
  ignored the iterated period and returned the total every time. Fix = inner `CALCULATE`.
- **Added RLS role `Viewer_NoPII`** with `FilterExpression = FALSE()` on `dim_client_pii`
  (Loi 18-07 — zero PII rows for report consumers).
- **Hid 9 degenerate columns** (branch/channel/sector on the 4 facts) after proving 0 mismatches
  vs the client's values; kept salesman/service_line visible (no dim table).
- **Updated `POWERBI_SETUP.md`** (MRR DAX, PII role note, hidden-columns note).
- **Independent reviewer subagent** re-audited the model: ALL PASS.

## Artifacts
- `warehouse/PBI_warehouse.pbix` (live model edited via MCP — **must Ctrl+S in PBI Desktop to persist**)
- `POWERBI_SETUP.md` (updated)

## Decisions & gotchas
- The MRR context-transition bug existed in BOTH the model and the doc spec — fixed both.
- Relationships were already the corrected snowflake (no `fact_transaction[branch]→dim_branch`).
- The MCP edits the **in-memory** model; changes are not in the `.pbix` until the user saves.
- Report visuals/pages and the `is_sample` projection banner are **report-layer** — the modeling
  MCP cannot build them; still manual.
- `column_operations Get` needs key `Name`, not `ColumnName`.

## Next steps
- Save the `.pbix` in Power BI Desktop.
- Build report pages (§5) + the red "PROJECTION / is_sample" banner (§4) by hand.
- Confirm the 7 TBV pricing rates with the client.

## Links
- [[KB - Home]]
