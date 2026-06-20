"""
common.py — Shared normalization, entity-resolution and masking utilities for the
Moustachir data-centralization POC.

Single source of truth: BOTH the batch ETL (pipeline.py) and the live "Manual
Prospect Entry" feature (app.py) import these functions. The human's raw input
is never trusted as canonical — it is normalized here, exactly like every other
ingestion source.

No third-party dependencies (portable for the jury): phone normalization is a
purpose-built Algerian E.164 normalizer; fuzzy matching uses stdlib difflib.
"""
from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher

# --------------------------------------------------------------------------- #
# Phone — Algerian E.164                                                       #
# --------------------------------------------------------------------------- #
# Observed raw formats across the 4 sources:
#   p:+213550000000   (Campagnes Marketing, "p:" prefix + already E.164)
#   +213 550 00 00 00 (spaced)
#   00213550000000    (international 00 prefix)
#   0550000000        (national, leading 0)
#   550000000         (bare 9-digit, no leading 0 — Prospection/website xlsx)
# Algerian mobile = 9 national digits beginning 5/6/7 ; landline begins 2/3/4.

_MOBILE_PREFIXES = ("5", "6", "7")


def normalize_phone(raw) -> tuple[str | None, str]:
    """Return (e164_or_None, status).

    status in {"ok", "empty", "invalid"}. Never raises — invalid input is
    reported, not corrected, so the data-quality report can count it.
    """
    if raw is None:
        return None, "empty"
    s = str(raw).strip()
    if not s or s.lower() in {"nan", "none"}:
        return None, "empty"

    # drop the "p:" lead-form marker and any non-digit decoration
    s = s.lower().replace("p:", "")
    digits = re.sub(r"\D", "", s)
    if not digits:
        return None, "invalid"

    # peel the country / trunk prefix down to 9 national digits
    if digits.startswith("00213"):
        digits = digits[5:]
    elif digits.startswith("213"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]

    if len(digits) == 9 and digits[0] in _MOBILE_PREFIXES:
        return "+213" + digits, "ok"
    # landlines (begin 2/3/4) — keep but tag separately; rare in this data
    if len(digits) == 9 and digits[0] in ("2", "3", "4"):
        return "+213" + digits, "ok"
    return None, "invalid"


# --------------------------------------------------------------------------- #
# Email                                                                        #
# --------------------------------------------------------------------------- #
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_email(raw) -> tuple[str | None, str]:
    """Return (lowercased_trimmed_email_or_None, status).

    status in {"ok", "empty", "invalid"}. Malformed addresses (e.g. 'gmail.om')
    are KEPT but flagged invalid — we do not guess corrections.
    """
    if raw is None:
        return None, "empty"
    s = str(raw).strip().lower()
    if not s or s in {"nan", "none"}:
        return None, "empty"
    s = s.replace(" ", "")
    if _EMAIL_RE.match(s):
        return s, "ok"
    return s, "invalid"


# --------------------------------------------------------------------------- #
# Salesman canonicalization (Axe 3)                                            #
# --------------------------------------------------------------------------- #
# Manual alias map for tokens that cannot be reconciled by token-sort alone
# (single-token names, surname/forename swaps, spelling drift). Keys lowercased.
_SALESMAN_ALIASES = {
    "touri": "maroua touri",
    "maroua": "maroua touri",
    "touri maroua": "maroua touri",
    "maroua touri": "maroua touri",
    "dalel": "dalel moussaoui",
    "dalal": "dalel moussaoui",
    "dalel moussaousaid": "dalel moussaoui",
    "younes": "younes bahnas",
    "bahnas younes": "younes bahnas",
    "raissi hadjer": "hadjer raissi",
    "hadjer raissi": "hadjer raissi",
    "raissi": "hadjer raissi",
}


def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def canonicalize_salesman(raw) -> str:
    """Collapse spelling/order variants to one canonical Title-Cased name.

    'TOURI Maroua', 'Touri maroua', 'Touri', 'Maroua' -> 'Maroua Touri'.
    Missing -> 'Unassigned'.
    """
    if raw is None:
        return "Unassigned"
    s = _strip_accents(str(raw).strip().lower())
    s = re.sub(r"\s+", " ", s)
    if not s or s in {"nan", "none"}:
        return "Unassigned"
    # token-sort to neutralise word order
    token_sorted = " ".join(sorted(s.split()))
    canon = _SALESMAN_ALIASES.get(s) or _SALESMAN_ALIASES.get(token_sorted) or token_sorted
    return canon.title()


# --------------------------------------------------------------------------- #
# Sector standardization (Axe 4 dimension cleaning)                            #
# --------------------------------------------------------------------------- #
# Source values look like 'activity-sectors.logistics_transport'.
_SECTOR_LABELS = {
    "professional_services": "Professional Services",
    "it_telecoms": "IT & Telecoms",
    "industry_manufacture": "Industry & Manufacturing",
    "construction_engineering": "Construction & Engineering",
    "health": "Health",
    "logistics_transport": "Logistics & Transport",
    "financial_services": "Financial Services",
    "government_public": "Government & Public",
}


def standardize_sector(raw) -> str:
    if raw is None:
        return "Unknown"
    s = str(raw).strip()
    if not s or s.lower() in {"nan", "none"}:
        return "Unknown"
    key = s.split(".")[-1].strip().lower()
    return _SECTOR_LABELS.get(key, key.replace("_", " ").title())


# --------------------------------------------------------------------------- #
# Branch assignment (5 pillars)                                                #
# --------------------------------------------------------------------------- #
# Branch codes used across the warehouse.
BRANCHES = {
    "CONSULTING": "Moustachir Consulting",
    "COMPTA": "Moustachir Compta (Idarati/Rentabilité)",
    "FORMATION": "Formation (Moustachir Academy)",
    "IDARATI": "Idarati",
    "COM": "Moustachir COM",
    "UNASSIGNED": "Unassigned",
}

# desired_service (Prospection Classique) -> (branch, service_line) — REAL signal.
_DESIRED_SERVICE_MAP = {
    "moustachir com": ("COM", "com_digital"),
    "moustachir academy": ("FORMATION", "academy"),
    "moustachir consulting": ("CONSULTING", "consulting_hourly"),
    "moustachir rentabilité": ("COMPTA", "rentabilite_commission"),
    "moustachir rentabilite": ("COMPTA", "rentabilite_commission"),
    "idarati": ("IDARATI", "idarati_admin"),
}

# Campagnes Marketing "service" labels -> COM service_line — REAL signal.
_CAMPAIGN_SERVICE_MAP = {
    "dev website": ("COM", "com_web_dev"),
    "branding": ("COM", "com_branding"),
    "landing page": ("COM", "com_web_dev"),
}


def map_branch(*, desired_service=None, campaign_service=None) -> tuple[str, str, str]:
    """Return (branch_code, service_line, mapping_confidence).

    confidence in {"real", "inferred"}. Real when a source field names the
    service; inferred/unassigned otherwise (documented in assumptions.md).
    """
    if desired_service:
        key = _strip_accents(str(desired_service).strip().lower())
        for k, v in _DESIRED_SERVICE_MAP.items():
            if _strip_accents(k) == key:
                return v[0], v[1], "real"
    if campaign_service:
        key = str(campaign_service).strip().lower()
        if key in _CAMPAIGN_SERVICE_MAP:
            v = _CAMPAIGN_SERVICE_MAP[key]
            return v[0], v[1], "real"
        return "COM", "com_digital", "real"  # any campaign row is a COM lead
    return "UNASSIGNED", "unknown", "inferred"


# --------------------------------------------------------------------------- #
# Fuzzy name match (stdlib)                                                    #
# --------------------------------------------------------------------------- #
def name_similarity(a, b) -> float:
    if not a or not b:
        return 0.0
    na = " ".join(sorted(_strip_accents(str(a).lower()).split()))
    nb = " ".join(sorted(_strip_accents(str(b).lower()).split()))
    return SequenceMatcher(None, na, nb).ratio()


# --------------------------------------------------------------------------- #
# PII masking (Loi 18-07 — mask on OUTPUT, not on storage)                     #
# --------------------------------------------------------------------------- #
def mask_phone(e164) -> str:
    if not e164:
        return ""
    s = str(e164)
    if len(s) < 6:
        return "***"
    return s[:5] + " " + "X" * (len(s) - 7) + " " + s[-2:]


def mask_email(email) -> str:
    if not email or "@" not in str(email):
        return ""
    local, _, domain = str(email).partition("@")
    shown = local[0] if local else ""
    return f"{shown}***@{domain}"


def mask_name(name) -> str:
    if not name:
        return ""
    parts = str(name).split()
    return " ".join((p[0] + "." if p else "") for p in parts)
