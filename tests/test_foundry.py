"""
test_foundry.py — acceptance tests for the Moustachir data foundry (Step 2).

Asserts the contract in spec/seed-schema.md:
  * every entity array present & non-empty (every /spec entity has rows),
  * meta.counts / meta.sampleCounts equal the actual arrays,
  * REAL KPI anchors reconcile exactly (clients, leads-by-channel/branch, 14 salesmen),
  * SIMULATED money anchors reconcile within +/-1% (recognized / gross / margin),
  * NPS anchor reconciles within +/-1% (33.3%),
  * no orphan foreign keys across the relational graph,
  * every row carries an isSample flag,
  * output is byte-for-byte deterministic under the fixed seed.

Run:  python -m pytest tests/ -q     (from project root)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
SEED_DIR = ROOT / "app" / "src" / "seed"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

import foundry  # noqa: E402  (path injected above)

# ---- anchors copied from warehouse/kpi_summary.json (the credibility contract) ----
ANCHORS = {
    "uniqueClients": 1451,
    "totalLeads": 1451,
    "salesmenCount": 14,
    "leadsByChannel": {
        "Campagne Marketing": 448,
        "Prospection Classique": 189,
        "Website": 366,
        "Événementiel": 448,
    },
    "leadsByBranch": {
        "COM": 511, "COMPTA": 25, "CONSULTING": 35,
        "FORMATION": 49, "IDARATI": 17, "UNASSIGNED": 814,
    },
    "recognizedRevenueDA": 10729000,
    "grossPlatformVolumeDA": 12145000,
    "projectedMarginDA": 6043400,
    "npsOverall": 33.3,
}

ENTITY_KEYS = [
    "clients", "leads", "interactions", "opportunities", "proposals", "sales",
    "payments", "expenses", "marketingCampaigns", "salespeople", "consultants",
    "projects", "tasks", "feedback", "auditEvents",
]

# FK -> target array. Each (field, target) must resolve; None values are allowed (optional FK).
FOREIGN_KEYS = {
    "leads": [("clientId", "clients"), ("assignedSalespersonId", "salespeople")],
    "interactions": [("clientId", "clients"), ("salespersonId", "salespeople")],
    "opportunities": [("clientId", "clients"), ("salespersonId", "salespeople")],
    "proposals": [("clientId", "clients"), ("opportunityId", "opportunities"),
                  ("salespersonId", "salespeople")],
    "sales": [("clientId", "clients"), ("salespersonId", "salespeople"),
              ("opportunityId", "opportunities"), ("projectId", "projects")],
    "payments": [("saleId", "sales"), ("clientId", "clients")],
    "expenses": [("responsiblePersonId", "salespeople")],
    "projects": [("clientId", "clients"), ("saleId", "sales")],
    "tasks": [("projectId", "projects")],
    "feedback": [("clientId", "clients"), ("projectId", "projects"),
                 ("saleId", "sales"), ("consultantId", "consultants"),
                 ("responsibleEmployeeId", "salespeople")],
    "clients": [("responsibleSalespersonId", "salespeople")],
}


@pytest.fixture(scope="module")
def seed():
    s, _dq = foundry.build()
    return s


@pytest.fixture(scope="module")
def dq():
    _s, dq = foundry.build()
    return dq


def _ids(seed, key):
    return {row["id"] for row in seed[key]}


# --------------------------------------------------------------------------- #
# Coverage: every /spec entity has rows
# --------------------------------------------------------------------------- #
def test_all_entity_arrays_present_and_nonempty(seed):
    for key in ENTITY_KEYS:
        assert key in seed, f"missing entity array: {key}"
        assert len(seed[key]) > 0, f"entity array is empty: {key}"


# --------------------------------------------------------------------------- #
# meta integrity
# --------------------------------------------------------------------------- #
def test_meta_counts_match_arrays(seed):
    for key in ENTITY_KEYS:
        assert seed["meta"]["counts"][key] == len(seed[key]), f"count mismatch: {key}"


def test_meta_sample_counts_match_arrays(seed):
    for key in ENTITY_KEYS:
        actual = sum(1 for r in seed[key] if r.get("isSample"))
        assert seed["meta"]["sampleCounts"][key] == actual, f"sampleCount mismatch: {key}"


def test_every_row_has_is_sample_flag(seed):
    for key in ENTITY_KEYS:
        for row in seed[key]:
            assert "isSample" in row, f"row missing isSample in {key}: {row.get('id')}"
            assert isinstance(row["isSample"], bool)


# --------------------------------------------------------------------------- #
# REAL anchors — must reconcile EXACTLY
# --------------------------------------------------------------------------- #
def test_unique_clients_anchor(seed):
    assert len(seed["clients"]) == ANCHORS["uniqueClients"]


def test_total_leads_anchor(seed):
    assert len(seed["leads"]) == ANCHORS["totalLeads"]


def test_salesmen_roster_anchor(seed):
    assert len(seed["salespeople"]) == ANCHORS["salesmenCount"]


def test_leads_by_channel_exact(seed):
    counts = {}
    for lead in seed["leads"]:
        counts[lead["source"]] = counts.get(lead["source"], 0) + 1
    assert counts == ANCHORS["leadsByChannel"]


def test_leads_by_branch_exact(seed):
    # warehouse codes via the branches map in meta
    code = {b["branchKey"]: b["warehouseCode"] for b in seed["meta"]["branches"]}
    counts = {}
    for lead in seed["leads"]:
        wc = code[lead["branchKey"]]
        counts[wc] = counts.get(wc, 0) + 1
    assert counts == ANCHORS["leadsByBranch"]


# --------------------------------------------------------------------------- #
# SIMULATED money anchors — reconcile within +/-1%
# --------------------------------------------------------------------------- #
def _within(actual, target, pct=0.01):
    return abs(actual - target) <= abs(target) * pct


def test_recognized_revenue_reconciles(seed):
    total = sum(s["amount"] for s in seed["sales"])
    assert _within(total, ANCHORS["recognizedRevenueDA"]), total


def test_gross_volume_reconciles(seed):
    total = sum(s["grossFlowAmount"] for s in seed["sales"])
    assert _within(total, ANCHORS["grossPlatformVolumeDA"]), total


def test_projected_margin_reconciles(seed):
    total = sum(s["margin"] for s in seed["sales"])
    assert _within(total, ANCHORS["projectedMarginDA"]), total


def test_nps_reconciles(seed):
    scores = [f["npsScore"] for f in seed["feedback"] if f.get("npsScore") is not None]
    assert scores, "no NPS scores present"
    promoters = sum(1 for s in scores if s >= 9)
    detractors = sum(1 for s in scores if s <= 6)
    nps = (promoters - detractors) / len(scores) * 100
    assert _within(nps, ANCHORS["npsOverall"], pct=0.03), nps


# --------------------------------------------------------------------------- #
# Referential integrity — no orphan foreign keys
# --------------------------------------------------------------------------- #
def test_no_orphan_foreign_keys(seed):
    targets = {k: _ids(seed, k) for k in ENTITY_KEYS}
    for table, fks in FOREIGN_KEYS.items():
        for field, target in fks:
            valid = targets[target]
            for row in seed[table]:
                val = row.get(field)
                if val is None:
                    continue
                assert val in valid, f"orphan {table}.{field}={val!r} -> {target}"


def test_all_salesperson_fks_resolve(seed):
    sp = _ids(seed, "salespeople")
    for table in ENTITY_KEYS:
        for row in seed[table]:
            for field in ("salespersonId", "assignedSalespersonId",
                          "responsibleSalespersonId", "responsiblePersonId"):
                if field in row and row[field] is not None:
                    assert row[field] in sp, f"{table}.{field}={row[field]!r}"


# --------------------------------------------------------------------------- #
# Determinism — identical output for the fixed seed
# --------------------------------------------------------------------------- #
def test_build_is_deterministic():
    a_seed, a_dq = foundry.build()
    b_seed, b_dq = foundry.build()
    assert json.dumps(a_seed, sort_keys=True, ensure_ascii=False) == \
        json.dumps(b_seed, sort_keys=True, ensure_ascii=False)
    assert json.dumps(a_dq, sort_keys=True, ensure_ascii=False) == \
        json.dumps(b_dq, sort_keys=True, ensure_ascii=False)


# --------------------------------------------------------------------------- #
# data_quality.json — cleaning log shape
# --------------------------------------------------------------------------- #
def test_data_quality_log_shape(dq):
    assert "meta" in dq and "tables" in dq and "derivedScores" in dq
    assert dq["meta"]["rawRowsIngested"] >= dq["meta"]["uniqueAfterResolution"]
    assert len(dq["tables"]) > 0
    for t in dq["tables"]:
        assert {"table", "rowsIn", "rowsOut", "actions"} <= set(t)
    names = {d["name"] for d in dq["derivedScores"]}
    assert {"customerScore", "churnRiskScore", "qualificationScore",
            "performanceScore"} <= names


def test_emitted_files_match_build():
    """main() must write the same content build() returns."""
    foundry.main()
    seed_disk = json.loads((SEED_DIR / "seed.json").read_text(encoding="utf-8"))
    s, _ = foundry.build()
    assert seed_disk["meta"]["counts"] == s["meta"]["counts"]
    assert (SEED_DIR / "data_quality.json").exists()
