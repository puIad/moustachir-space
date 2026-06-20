# Seed Schema — `seed.json` & `data_quality.json` contract

> **Status:** LOCKED contract (Step 0). The Python foundry (Step 2) **emits** exactly this shape to
> `app/src/seed/`; the Dexie seeding layer (Step 3) **consumes** it verbatim. Field types are defined in
> `spec/entities.ts`; this file fixes the **file-level envelope** (keys, arrays, meta block).

Two files are produced:

| File | Producer | Consumer | Purpose |
|------|----------|----------|---------|
| `app/src/seed/seed.json` | `src/foundry.py` (Step 2) | `app/src/store/seed.ts` (Step 3) | All entity rows + meta |
| `app/src/seed/data_quality.json` | `src/foundry.py` (Step 2) | Data Manager UI (Step 8) | ML cleaning log |

---

## 1. `seed.json` — top-level envelope

```jsonc
{
  "meta": { /* …see §2… */ },

  // One array per entity. Keys are camelCase and MUST match these names exactly.
  // Row shapes are the interfaces in spec/entities.ts. Every array is present
  // (possibly empty). Every row includes "isSample": boolean.
  "clients":            [ /* Client[] */ ],
  "leads":              [ /* Lead[] */ ],
  "interactions":       [ /* Interaction[] */ ],
  "opportunities":      [ /* Opportunity[] */ ],
  "proposals":          [ /* Proposal[] */ ],
  "sales":              [ /* Sale[] */ ],
  "payments":           [ /* Payment[] */ ],
  "expenses":           [ /* Expense[] */ ],
  "marketingCampaigns": [ /* MarketingCampaign[] */ ],
  "salespeople":        [ /* Salesperson[] */ ],
  "consultants":        [ /* Consultant[] */ ],
  "projects":           [ /* Project[] */ ],
  "tasks":              [ /* Task[] */ ],
  "feedback":           [ /* Feedback[] */ ],
  "auditEvents":        [ /* AuditEvent[] */ ]
}
```

**Rules**
1. **All 15 arrays present**, even if empty. Dexie creates a table per key (see §4).
2. **Stable string ids.** PKs are strings (`"C0001"`, `"S03"`, …). The foundry assigns them deterministically
   under a fixed random seed → identical output across runs.
3. **No orphan foreign keys.** Every FK (`clientId`, `salespersonId`, `opportunityId`, …) resolves to an id
   present in its target array. Step 2 tests assert this.
4. **Real keys preserved.** `Client.id`, `Lead.clientId`, `Salesperson.id`, `Sale.clientId` reuse the real
   warehouse keys/names so analytics reconcile to the anchors.
5. **`isSample` on every row.** Real-derived rows → `false`; generated rows → `true`. Any field that is SIM/
   DERIVED per `entities.ts` does not change the row flag — the **row** flag means "this record is a projection".
6. **Currency = DA** everywhere; numbers are plain integers (no thousands separators, no currency symbol).

---

## 2. `meta` block

```jsonc
"meta": {
  "schemaVersion": 1,                 // bump when envelope shape changes; seed.ts re-seeds on change
  "seedVersion": "2026-06-20",        // foundry run tag (date or git short-sha)
  "generatedAt": "2026-06-20T12:00:00Z", // ISO-8601 UTC of generation
  "randomSeed": 42,                   // fixed seed used → reproducibility
  "currency": "DA",
  "currencyFormat": "#,##0 \"DA\"",

  // Row counts per entity (must equal the array lengths). Sanity gate for the loader.
  "counts": {
    "clients": 1451, "leads": 1451, "interactions": 0, "opportunities": 0,
    "proposals": 0, "sales": 137, "payments": 0, "expenses": 0,
    "marketingCampaigns": 4, "salespeople": 14, "consultants": 0, "projects": 0,
    "tasks": 0, "feedback": 0, "auditEvents": 0
  },

  // How many rows in each table are projections (isSample=true). UI projection-badge audit.
  "sampleCounts": {
    "clients": 814, "leads": 0, "sales": 137, "feedback": 0 /* …all tables… */
  },

  // Per-table provenance label for the Data Manager + badges.
  "provenance": {
    "clients": "real", "leads": "real", "salespeople": "real",
    "marketingCampaigns": "mixed",          // real lead counts, simulated spend
    "sales": "real-totals",                 // per-row simulated, totals reconcile to anchors
    "interactions": "simulated", "opportunities": "simulated", "proposals": "simulated",
    "payments": "simulated", "expenses": "simulated", "consultants": "simulated",
    "projects": "simulated", "tasks": "simulated", "feedback": "simulated",
    "auditEvents": "simulated"
  },

  // THE credibility contract — analytics must reproduce these from seeded rows (±1%).
  // Values copied from warehouse/kpi_summary.json. See spec/kpi-definitions.md.
  "kpiAnchors": {
    "uniqueClients": 1451,                  // REAL
    "totalLeads": 1451,                     // REAL
    "salesmenCount": 14,                    // REAL
    "leadsByChannel": {                     // REAL
      "Campagne Marketing": 448, "Prospection Classique": 189,
      "Website": 366, "Événementiel": 448
    },
    "leadsByBranch": {                      // REAL
      "COM": 511, "COMPTA": 25, "CONSULTING": 35,
      "FORMATION": 49, "IDARATI": 17, "UNASSIGNED": 814
    },
    "recognizedRevenueDA": 10729000,        // SIMULATED projection
    "grossPlatformVolumeDA": 12145000,      // SIMULATED projection
    "projectedMarginDA": 6043400,           // SIMULATED projection
    "avgMrrDA": 16000,                      // SIMULATED projection
    "transactions": 137,                    // SIMULATED
    "npsOverall": 33.3,                     // SIMULATED projection
    "clientTaxSavingPct": 0.5375            // SIMULATED projection
  },

  // Mirrors spec/taxonomy.md §1+§3 so the frontend has branch metadata without re-deriving.
  "branches": [
    { "branchKey": "consulting",    "warehouseCode": "CONSULTING", "service": "Consulting",   "navEN": "Consulting",          "color": "#0ea5e9" },
    { "branchKey": "comptabilite",  "warehouseCode": "COMPTA",     "service": "Rentabilité",  "navEN": "Comptabilité France", "color": "#22c55e" },
    { "branchKey": "communication", "warehouseCode": "COM",        "service": "COMM",         "navEN": "Communication",       "color": "#ec4899" },
    { "branchKey": "academy",       "warehouseCode": "FORMATION",  "service": "Academy",      "navEN": "Academy",             "color": "#f59e0b" },
    { "branchKey": "management",    "warehouseCode": "IDARATI",    "service": "Idarati",      "navEN": "Management",          "color": "#8b5cf6" },
    { "branchKey": "unassigned",    "warehouseCode": "UNASSIGNED", "service": null,           "navEN": null,                  "color": "#64748b" }
  ]
}
```

**Invariants the Step 2 test suite asserts**
- `meta.counts[k] === seed[k].length` for every entity key `k`.
- `meta.sampleCounts[k] === seed[k].filter(r => r.isSample).length`.
- Sales reconcile: `Σ sales.amount ≈ recognizedRevenueDA`, `Σ sales.grossFlowAmount ≈ grossPlatformVolumeDA`,
  `Σ sales.margin ≈ projectedMarginDA` (±1%).
- `leadsByBranch` / `leadsByChannel` recomputed from `leads` equal the anchors exactly.
- `salespeople.length === 14` and every `*.salespersonId` ∈ salespeople ids.

---

## 3. `data_quality.json` — ML cleaning log (Step 2 → Step 8)

```jsonc
{
  "meta": {
    "generatedAt": "2026-06-20T12:00:00Z",
    "rawRowsIngested": 1593,                // data_quality_report.md
    "uniqueAfterResolution": 1451,
    "duplicatesCollapsed": 142,
    "mergedFromMultiple": 117,
    "needsReview": 0
  },

  // One entry per table the foundry touched.
  "tables": [
    {
      "table": "clients",
      "rowsIn": 1593,
      "rowsOut": 1451,
      "actions": {
        "dedupMerges": 142,                 // cross-source duplicates collapsed
        "imputations": 0,                   // missing numerics filled
        "normalizations": 40,               // phone/email/text standardized
        "anomaliesFlagged": 0
      },
      "details": [
        { "type": "merge",     "rule": "fuzzy_name+phone", "affected": 117, "examples": [/* ids */] },
        { "type": "normalize", "rule": "phone_e164",       "affected": 40,  "kept": true, "flagged": true },
        { "type": "impute",    "field": "country",         "method": "mode_DZ", "affected": 0 }
      ]
    }
    // …one object per table…
  ],

  // ML-derived score columns added by the foundry (per spec/kpi-definitions.md "DERIVED").
  "derivedScores": [
    { "name": "customerScore",       "entity": "client",     "model": "rule+kmeans", "range": [0, 100] },
    { "name": "churnRiskScore",      "entity": "client",     "model": "logistic",    "range": [0, 1] },
    { "name": "qualificationScore",  "entity": "lead",       "model": "rule",        "range": [0, 100] },
    { "name": "performanceScore",    "entity": "consultant", "model": "weighted",    "range": [0, 100] }
  ]
}
```

The Data Manager view (Step 8) renders `tables[]` as "what ML did to clean each table" (rows in/out, dedups,
imputations, normalizations, anomalies, before/after) and `derivedScores[]` as the score-engineering panel.

---

## 4. Dexie mapping (Step 3 reference)

| seed.json key | Dexie table | Primary key | Suggested indexes |
|---------------|-------------|-------------|-------------------|
| `clients` | `clients` | `id` | `branchKey, serviceLine, responsibleSalespersonId, type, churnRiskScore` |
| `leads` | `leads` | `id` | `clientId, branchKey, source, status, assignedSalespersonId` |
| `interactions` | `interactions` | `id` | `clientId, salespersonId, type, date` |
| `opportunities` | `opportunities` | `id` | `clientId, salespersonId, branchKey, stage` |
| `proposals` | `proposals` | `id` | `opportunityId, clientId, status, version` |
| `sales` | `sales` | `id` | `clientId, branchKey, serviceLine, salespersonId, date` |
| `payments` | `payments` | `id` | `saleId, clientId, status, dueDate` |
| `expenses` | `expenses` | `id` | `branchKey, category, date` |
| `marketingCampaigns` | `marketingCampaigns` | `id` | `channel, platform, startDate` |
| `salespeople` | `salespeople` | `id` | `branchKey, status` |
| `consultants` | `consultants` | `id` | `seniorityLevel, availabilityStatus, status` |
| `projects` | `projects` | `id` | `clientId, branchKey, serviceLine, status` |
| `tasks` | `tasks` | `id` | `projectId, employeeId, kind, status, priority` |
| `feedback` | `feedback` | `id` | `clientId, source, type, resolutionStatus, date` |
| `auditEvents` | `auditEvents` | `id` | `entity, entityId, timestamp` |

Seeding contract: on first load (empty DB **or** `meta.schemaVersion` newer than stored) → bulk-import all
arrays. `resetToSeed()` clears tables and re-imports from `seed.json`. Versioned so re-seeding is idempotent.
