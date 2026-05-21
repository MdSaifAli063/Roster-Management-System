"""Heuristic invoice field extraction from PDF pipeline output — no LLM."""

from __future__ import annotations

import re
from typing import Any


def _find_in_text(text: str, patterns: list[str]) -> str | None:
    for pat in patterns:
        m = re.search(pat, text, re.I | re.M)
        if m:
            return m.group(1).strip()
    return None


def extract_invoice_fields(data: dict[str, Any]) -> dict[str, Any]:
    chunks = []
    for p in data.get("pages") or []:
        chunks.append(p.get("text") or "")
    full = "\n".join(chunks)

    supplier = _find_in_text(
        full,
        [r"(?:from|supplier|bill\s*from)[:\s]+([^\n]{3,80})", r"^([A-Z][A-Za-z0-9 &.'-]{4,60})\n"],
    )
    invoice_number = _find_in_text(
        full,
        [r"(?:invoice\s*#?|inv[-\s]*)([A-Z0-9-]+)", r"(INV[-\s]*\d+)"],
    )
    invoice_date = _find_in_text(
        full,
        [r"(?:invoice\s*date|date)[:\s]+(\d{1,2}\s+\w+\s+\d{4})", r"(\d{4}-\d{2}-\d{2})"],
    )
    due_date = _find_in_text(full, [r"(?:due\s*date|due\s*on)[:\s]+([^\n]+)"])
    subtotal = _find_in_text(full, [r"(?:subtotal|sub\s*total)[:\s]*[₹$]?\s*([\d,.]+)"])
    gst = _find_in_text(full, [r"(?:gst|tax)[:\s]*[₹$]?\s*([\d,.]+)"])
    total = _find_in_text(full, [r"(?:total|balance\s*due|amount\s*due)[:\s]*[₹$]?\s*([\d,.]+)"])

    line_items = []
    for t in data.get("tables") or []:
        rows = t.get("rows") or []
        if len(rows) < 2:
            continue
        headers = " ".join(str(c) for c in rows[0]).lower()
        if any(k in headers for k in ("description", "qty", "amount", "item", "#")):
            for row in rows[1:]:
                if any(str(c).strip() for c in row):
                    line_items.append({"cells": row})
            break

    return {
        "supplier": supplier,
        "invoice_number": invoice_number,
        "invoice_date": invoice_date,
        "due_date": due_date,
        "subtotal": subtotal,
        "gst": gst,
        "total": total,
        "line_items": line_items,
    }
