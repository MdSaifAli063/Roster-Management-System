"""Table extraction via camelot (lattice/stream) and pdfplumber."""

from __future__ import annotations

from typing import Any

import pdfplumber

from .utils import normalize_indices, open_pdf_safe

# camelot is optional at import time — heavy cv deps
try:
    import camelot

    HAS_CAMELOT = True
except ImportError:
    HAS_CAMELOT = False


def _clean_rows(rows: list[list]) -> list[list[str]]:
    out = []
    for row in rows:
        if row is None:
            continue
        cleaned = [str(c).strip() if c is not None else "" for c in row]
        if any(cleaned):
            out.append(cleaned)
    return out


def _extract_pdfplumber_tables(pdf_path: str, page_index: int) -> list[list[list[str]]]:
    tables = []
    with pdfplumber.open(pdf_path) as pdf:
        if page_index >= len(pdf.pages):
            return tables
        page = pdf.pages[page_index]
        try:
            found = page.extract_tables(
                table_settings={
                    "vertical_strategy": "lines_strict",
                    "horizontal_strategy": "lines_strict",
                    "intersection_tolerance": 5,
                },
            )
            for t in found or []:
                cleaned = _clean_rows(t)
                if cleaned:
                    tables.append(cleaned)
        except Exception:
            pass

        if not tables:
            try:
                found = page.extract_tables(
                    table_settings={
                        "vertical_strategy": "text",
                        "horizontal_strategy": "text",
                    },
                )
                for t in found or []:
                    cleaned = _clean_rows(t)
                    if cleaned:
                        tables.append(cleaned)
            except Exception:
                pass
    return tables


def _extract_camelot(pdf_path: str, page_num_1based: int) -> list[dict]:
    """page_num_1based: 1-based page number for camelot."""
    if not HAS_CAMELOT:
        return []

    records = []
    for flavor in ("lattice", "stream"):
        try:
            tables = camelot.read_pdf(
                str(pdf_path),
                pages=str(page_num_1based),
                flavor=flavor,
                suppress_stdout=True,
            )
            for i, table in enumerate(tables):
                df = table.df
                rows = [list(df.columns)] + df.values.tolist()
                cleaned = _clean_rows(rows)
                if cleaned:
                    records.append(
                        {
                            "method": f"camelot_{flavor}",
                            "rows": cleaned,
                            "accuracy": getattr(table, "accuracy", None),
                        }
                    )
        except (OSError, PermissionError):
            continue
        except Exception:
            continue
    return records


def _dedupe_tables(candidates: list[dict]) -> list[dict]:
    """Remove duplicate tables by row content hash."""
    seen = set()
    unique = []
    for c in candidates:
        key = tuple(tuple(r) for r in c.get("rows", []))
        if key in seen or not key:
            continue
        seen.add(key)
        unique.append(c)
    return unique


def extract_tables(pdf_path: str, pages: list[int] | None = None) -> list[dict[str, Any]]:
    """
    Extract tables as structured records:
    {page, table_index, method, rows: [[cell,...], ...]}
    """
    doc = open_pdf_safe(pdf_path)
    total = doc.page_count
    doc.close()

    indices = normalize_indices(pages, total)
    all_tables: list[dict[str, Any]] = []

    for idx in indices:
        pnum = idx + 1
        candidates: list[dict] = []

        for ti, rows in enumerate(_extract_pdfplumber_tables(pdf_path, idx)):
            candidates.append({"method": "pdfplumber", "rows": rows, "table_index": ti})

        camelot_recs = _extract_camelot(pdf_path, pnum)
        for cr in camelot_recs:
            candidates.append(cr)

        deduped = _dedupe_tables(candidates)
        for ti, rec in enumerate(deduped):
            all_tables.append(
                {
                    "page": pnum,
                    "table_index": ti,
                    "method": rec.get("method", "unknown"),
                    "rows": rec.get("rows", []),
                    "row_count": len(rec.get("rows", [])),
                    "col_count": max((len(r) for r in rec.get("rows", [])), default=0),
                }
            )

    return all_tables
