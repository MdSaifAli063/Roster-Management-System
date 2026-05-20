"""Table extraction via pdfplumber, camelot, and word-layout reconstruction."""

from __future__ import annotations

import re
from typing import Any

import pdfplumber

from .utils import normalize_indices, open_pdf_safe

try:
    import camelot

    HAS_CAMELOT = True
except ImportError:
    HAS_CAMELOT = False

# Line grouping tolerance (pt)
_LINE_Y_TOLERANCE = 5
# Min gap between word clusters to form a new column (pt) — tuned for invoices
_MIN_COL_GAP = 12


def _word_center(w: dict) -> float:
    return (float(w.get("x0", 0)) + float(w.get("x1", 0))) / 2


def _get_page_words(page) -> list[dict]:
    try:
        return (
            page.extract_words(
                x_tolerance=2,
                y_tolerance=3,
                keep_blank_chars=False,
                use_text_flow=False,
            )
            or []
        )
    except Exception:
        return []


def _line_column_splits(line_words: list[dict], min_gap: float) -> list[float]:
    """Midpoints between word clusters on a single line (per-row Excel columns)."""
    if len(line_words) < 2:
        return []
    sorted_w = sorted(line_words, key=lambda x: float(x.get("x0", 0)))
    splits: list[float] = []
    last_x1 = float(sorted_w[0].get("x1", sorted_w[0].get("x0", 0)))
    for w in sorted_w[1:]:
        x0 = float(w.get("x0", 0))
        if x0 - last_x1 >= min_gap:
            splits.append((last_x1 + x0) / 2)
        last_x1 = max(last_x1, float(w.get("x1", x0)))
    return splits


def _cluster_split_positions(splits: list[float], page_width: float) -> list[float]:
    """Merge similar split x-positions from many lines into one grid."""
    if not splits:
        return [0.0, page_width]

    splits = sorted(splits)
    clusters: list[float] = []
    bucket: list[float] = [splits[0]]
    merge_tol = max(12, page_width / 50)

    for s in splits[1:]:
        if s - bucket[-1] <= merge_tol:
            bucket.append(s)
        else:
            clusters.append(sum(bucket) / len(bucket))
            bucket = [s]
    clusters.append(sum(bucket) / len(bucket))

    boundaries = [0.0]
    for c in clusters:
        if c - boundaries[-1] >= 18:
            boundaries.append(c)
    if boundaries[-1] < page_width - 1:
        boundaries.append(page_width)

    if len(boundaries) < 2:
        return [0.0, page_width / 2, page_width]

    while len(boundaries) > 12:
        min_gap = float("inf")
        idx = 1
        for i in range(1, len(boundaries) - 1):
            g = boundaries[i] - boundaries[i - 1]
            if g < min_gap:
                min_gap = g
                idx = i
        boundaries.pop(idx)

    return boundaries


def _detect_column_boundaries(words: list[dict], page_width: float) -> list[float]:
    """
    Build fixed vertical column edges for the whole page (Excel-style grid).
    Learns columns from horizontal gaps on each line, then clusters those gaps.
    """
    if not words:
        return [0.0, page_width]

    lines: dict[float, list[dict]] = {}
    for w in words:
        text = (w.get("text") or "").strip()
        if not text:
            continue
        top = float(w.get("top", 0))
        y_key = round(top / _LINE_Y_TOLERANCE) * _LINE_Y_TOLERANCE
        lines.setdefault(y_key, []).append(w)

    min_gap = max(_MIN_COL_GAP, min(35, page_width / 14))
    all_splits: list[float] = []
    for line_words in lines.values():
        all_splits.extend(_line_column_splits(line_words, min_gap))

    if all_splits:
        return _cluster_split_positions(all_splits, page_width)

    # Fallback: page thirds for sparse invoices
    return [0.0, page_width * 0.38, page_width * 0.62, page_width]


def _col_index(x_mid: float, boundaries: list[float]) -> int:
    for i in range(len(boundaries) - 1):
        if boundaries[i] <= x_mid < boundaries[i + 1]:
            return i
    return max(0, len(boundaries) - 2)


def _table_excel_grid(page) -> list[list[str]]:
    """Map every text line into the same column grid (like Excel)."""
    words = _get_page_words(page)
    if not words:
        return []

    page_width = float(page.width or 612)
    boundaries = _detect_column_boundaries(words, page_width)
    num_cols = len(boundaries) - 1

    lines: dict[float, list[dict]] = {}
    for w in words:
        text = (w.get("text") or "").strip()
        if not text:
            continue
        top = float(w.get("top", 0))
        y_key = round(top / _LINE_Y_TOLERANCE) * _LINE_Y_TOLERANCE
        lines.setdefault(y_key, []).append(w)

    rows: list[list[str]] = []
    prev_y = None
    for y in sorted(lines.keys()):
        # Large vertical gap → blank row separator (optional)
        if prev_y is not None and y - prev_y > 28:
            rows.append([""] * num_cols)
        prev_y = y

        cells = [""] * num_cols
        for w in sorted(lines[y], key=lambda x: float(x.get("x0", 0))):
            text = (w.get("text") or "").strip()
            if not text:
                continue
            ci = _col_index(_word_center(w), boundaries)
            if cells[ci]:
                cells[ci] = f"{cells[ci]} {text}".strip()
            else:
                cells[ci] = text

        if any(c.strip() for c in cells):
            rows.append(cells)

    rows = _trim_noise_rows(rows)
    return _merge_label_value_rows(rows)


_LABEL_HINTS = (
    "BILL TO",
    "SHIP TO",
    "INVOICE DATE",
    "DUE DATE",
    "BALANCE DUE",
    "INVOICE #",
    "PO #",
    "TERMS",
    "GSTIN",
    "PLACE OF SUPPLY",
    "SUBJECT",
)


def _looks_like_label(cell: str) -> bool:
    c = cell.strip()
    if not c or len(c) > 48:
        return False
    upper = c.upper()
    if any(upper == h or upper.startswith(h + ":") for h in _LABEL_HINTS):
        return True
    if c.isupper() and len(c.split()) <= 5 and not any(ch.isdigit() for ch in c):
        return True
    return False


def _merge_label_value_rows(rows: list[list[str]]) -> list[list[str]]:
    """
    Put label + value on one Excel row (e.g. BILL TO | Md Saif Ali) when stacked vertically.
    """
    if len(rows) < 2:
        return rows

    out: list[list[str]] = []
    i = 0
    while i < len(rows):
        row = rows[i]
        non_empty = [j for j, c in enumerate(row) if str(c).strip()]
        if (
            i + 1 < len(rows)
            and len(non_empty) == 1
            and _looks_like_label(row[non_empty[0]])
        ):
            nxt = rows[i + 1]
            nxt_non = [j for j, c in enumerate(nxt) if str(c).strip()]
            if len(nxt_non) >= 1:
                merged = list(row)
                val_j = nxt_non[0]
                val = str(nxt[val_j]).strip()
                target = non_empty[0] + 1
                if target < len(merged):
                    if not str(merged[target]).strip():
                        merged[target] = val
                    else:
                        merged[target] = f"{merged[target]} {val}".strip()
                else:
                    merged.extend([""] * (target - len(merged)))
                    merged.append(val)
                for j, c in enumerate(nxt):
                    if j != val_j and str(c).strip():
                        if j < len(merged):
                            if not str(merged[j]).strip():
                                merged[j] = c
                        else:
                            merged.extend([""] * (j - len(merged)))
                            merged.append(c)
                out.append(merged)
                i += 2
                continue
        out.append(row)
        i += 1
    return _pad_rows(out)


def _trim_noise_rows(rows: list[list[str]]) -> list[list[str]]:
    """Drop leading 1–2 character OCR noise rows."""
    out: list[list[str]] = []
    started = False
    for r in rows:
        joined = " ".join(c for c in r if c).strip()
        if not started and len(joined) <= 2:
            continue
        if joined:
            started = True
        out.append(r)
    return out if out else rows


def _column_balance_score(rows: list[list[str]]) -> float:
    """Reward tables that use multiple columns, not one stacked column."""
    if not rows:
        return 0.0
    cols = max(len(r) for r in rows) if rows else 0
    if cols < 2:
        return 0.0
    filled_by_col = [0] * cols
    for r in rows:
        for i, c in enumerate(r):
            if i < cols and str(c).strip():
                filled_by_col[i] += 1
    total = sum(filled_by_col)
    if total == 0:
        return 0.0
    used = sum(1 for n in filled_by_col if n > 0)
    score = used * 3.0
    if filled_by_col[0] / total > 0.88 and cols > 3:
        score -= 8.0
    return score


def _clean_rows(rows: list[list]) -> list[list[str]]:
    out = []
    for row in rows:
        if row is None:
            continue
        cleaned = [re.sub(r"\s+", " ", str(c).strip()) if c is not None else "" for c in row]
        if any(cleaned):
            out.append(cleaned)
    return out


def _table_from_words(page) -> list[list[str]]:
    """Legacy per-row gap split — fallback when excel grid fails."""
    words = _get_page_words(page)
    if not words:
        return []

    lines: dict[float, list] = {}
    for w in words:
        top = float(w.get("top", 0))
        y_key = round(top / _LINE_Y_TOLERANCE) * _LINE_Y_TOLERANCE
        lines.setdefault(y_key, []).append(w)

    rows: list[list[str]] = []
    cell_gap = 18
    for y in sorted(lines.keys()):
        line_words = sorted(lines[y], key=lambda x: float(x.get("x0", 0)))
        cells: list[str] = []
        chunk: list[str] = []
        last_x1 = 0.0
        for w in line_words:
            text = (w.get("text") or "").strip()
            if not text:
                continue
            x0 = float(w.get("x0", 0))
            x1 = float(w.get("x1", x0))
            if chunk and x0 - last_x1 > cell_gap:
                cells.append(" ".join(chunk))
                chunk = []
            chunk.append(text)
            last_x1 = x1
        if chunk:
            cells.append(" ".join(chunk))
        if cells and any(c.strip() for c in cells):
            rows.append(cells)
    return rows


def _pad_rows(rows: list[list[str]]) -> list[list[str]]:
    if not rows:
        return []
    max_cols = max(len(r) for r in rows)
    return [r + [""] * (max_cols - len(r)) for r in rows]


def _merge_split_cells(rows: list[list[str]]) -> list[list[str]]:
    """Merge adjacent cells that look like one word split across columns."""
    if not rows:
        return rows

    merged = []
    for row in rows:
        if len(row) <= 1:
            merged.append(row)
            continue
        new_row: list[str] = []
        buffer = ""
        for cell in row:
            c = cell.strip()
            if not c:
                if buffer:
                    new_row.append(buffer)
                    buffer = ""
                new_row.append("")
                continue
            # Short fragment likely split from previous cell
            if buffer and (len(c) <= 4 or (len(buffer) <= 4 and not buffer.endswith(" "))):
                buffer = f"{buffer} {c}".strip()
            elif buffer:
                new_row.append(buffer)
                buffer = c
            else:
                buffer = c
        if buffer:
            new_row.append(buffer)
        merged.append(new_row)

    return _pad_rows(merged)


def _collapse_empty_columns(rows: list[list[str]]) -> list[list[str]]:
    """Remove columns that are entirely empty."""
    if not rows:
        return rows
    max_cols = max(len(r) for r in rows)
    keep = []
    for ci in range(max_cols):
        if any(ci < len(r) and r[ci].strip() for r in rows):
            keep.append(ci)
    if not keep:
        return rows
    return [[r[ci] if ci < len(r) else "" for ci in keep] for r in rows]


def _score_table(rows: list[list[str]]) -> float:
    """Higher = better structured table."""
    if not rows or len(rows) < 2:
        return 0.0
    rows = _pad_rows(rows)
    cols = max(len(r) for r in rows)
    if cols < 2:
        return 0.0
    if cols > 14:
        return max(0, 10 - cols)

    score = 10.0 + _column_balance_score(rows)
    total_cells = sum(len(r) for r in rows)
    empty = sum(1 for r in rows for c in r if not str(c).strip())
    if total_cells:
        score -= (empty / total_cells) * 5

    # Penalize single-character cells (fragmentation)
    tiny = sum(1 for r in rows for c in r if len(str(c).strip()) == 1)
    if total_cells:
        score -= (tiny / total_cells) * 15

    # Reward consistent column counts
    col_counts = [len([c for c in r if c.strip()]) for r in rows]
    if col_counts:
        avg = sum(col_counts) / len(col_counts)
        variance = sum((c - avg) ** 2 for c in col_counts) / len(col_counts)
        score -= min(variance, 8)

    # Reward reasonable row count
    if 3 <= len(rows) <= 40:
        score += 3

    return max(score, 0)


def _split_header(rows: list[list[str]]) -> tuple[list[str] | None, list[list[str]]]:
    """Detect header row (line items: #, description, qty, rate, amount)."""
    if len(rows) < 2:
        return None, rows
    first = " ".join(rows[0]).upper()
    keywords = ("#", "DESCRIPTION", "QTY", "RATE", "AMOUNT", "ITEM", "QUANTITY")
    hits = sum(1 for k in keywords if k in first)
    if hits >= 2:
        return rows[0], rows[1:]
    return None, rows


def _normalize_table(rows: list[list[str]], method: str = "") -> dict[str, Any]:
    rows = _clean_rows(rows)
    if method == "excel_grid":
        rows = _merge_label_value_rows(rows)
    rows = _collapse_empty_columns(rows)
    rows = _pad_rows(rows)
    header, body = _split_header(rows)
    if header:
        rows = [header] + body
    return {
        "rows": rows,
        "headers": header,
        "data_rows": body if header else rows,
        "row_count": len(rows),
        "col_count": max((len(r) for r in rows), default=0),
        "has_header": header is not None,
    }


def _extract_pdfplumber_tables(pdf_path: str, page_index: int) -> list[list[list[str]]]:
    tables: list[list[list[str]]] = []
    strategies = [
        {
            "vertical_strategy": "lines_strict",
            "horizontal_strategy": "lines_strict",
            "intersection_tolerance": 5,
        },
        {
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "snap_tolerance": 5,
            "join_tolerance": 5,
        },
        {
            "vertical_strategy": "text",
            "horizontal_strategy": "text",
            "snap_tolerance": 8,
            "join_tolerance": 8,
            "min_words_vertical": 2,
            "min_words_horizontal": 1,
        },
        {
            "vertical_strategy": "explicit",
            "horizontal_strategy": "text",
            "explicit_vertical_lines": [],
            "snap_tolerance": 10,
        },
    ]

    with pdfplumber.open(pdf_path) as pdf:
        if page_index >= len(pdf.pages):
            return tables
        page = pdf.pages[page_index]

        word_rows = _table_excel_grid(page)
        if word_rows:
            tables.append(word_rows)

        for settings in strategies:
            try:
                found = page.extract_tables(table_settings=settings) or []
                for t in found:
                    cleaned = _clean_rows(t)
                    if cleaned and _score_table(cleaned) >= 3:
                        tables.append(cleaned)
            except Exception:
                continue

    return tables


def _extract_camelot(pdf_path: str, page_num_1based: int) -> list[dict]:
    if not HAS_CAMELOT:
        return []

    records = []
    configs = [
        ("stream", {"row_tol": 10, "column_tol": 10, "edge_tol": 50}),
        ("stream", {"row_tol": 15, "column_tol": 15}),
        ("lattice", {}),
    ]
    for flavor, extra in configs:
        try:
            tables = camelot.read_pdf(
                str(pdf_path),
                pages=str(page_num_1based),
                flavor=flavor,
                suppress_stdout=True,
                **extra,
            )
            for table in tables:
                df = table.df
                rows = [list(df.columns)] + df.values.tolist()
                cleaned = _clean_rows(rows)
                if cleaned and _score_table(cleaned) >= 4:
                    records.append(
                        {
                            "method": f"camelot_{flavor}",
                            "rows": cleaned,
                            "accuracy": getattr(table, "accuracy", None),
                        }
                    )
        except Exception:
            continue
    return records


def _pick_best_table(candidates: list[dict]) -> dict | None:
    if not candidates:
        return None
    best = None
    best_score = -1.0
    for c in candidates:
        rows = c.get("rows") or []
        s = _score_table(rows)
        method = c.get("method", "")
        if method == "excel_grid":
            s += 8
        elif "excel_grid" in method:
            s += 5
        elif method == "word_layout":
            s += 1
        if "camelot_stream" in method:
            s += 1.5
        if s > best_score:
            best_score = s
            best = c
    return best


def _dedupe_tables(candidates: list[dict]) -> list[dict]:
    seen: set[str] = set()
    unique = []
    for c in sorted(candidates, key=lambda x: -_score_table(x.get("rows", []))):
        key = "|".join("|".join(r) for r in c.get("rows", []))
        if key in seen or not key:
            continue
        seen.add(key)
        unique.append(c)
    return unique


def extract_tables(pdf_path: str, pages: list[int] | None = None) -> list[dict[str, Any]]:
    doc = open_pdf_safe(pdf_path)
    total = doc.page_count
    doc.close()

    indices = normalize_indices(pages, total)
    all_tables: list[dict[str, Any]] = []

    for idx in indices:
        pnum = idx + 1
        candidates: list[dict] = []

        with pdfplumber.open(pdf_path) as pdf:
            if idx < len(pdf.pages):
                page = pdf.pages[idx]
                excel_rows = _table_excel_grid(page)
                if excel_rows:
                    candidates.append({"method": "excel_grid", "rows": excel_rows})
                fallback = _table_from_words(page)
                if fallback:
                    candidates.append({"method": "word_layout", "rows": fallback})

        for ti, rows in enumerate(_extract_pdfplumber_tables(pdf_path, idx)):
            candidates.append({"method": f"pdfplumber_{ti}", "rows": rows})

        for cr in _extract_camelot(pdf_path, pnum):
            candidates.append(cr)

        deduped = _dedupe_tables(candidates)
        best = _pick_best_table(deduped) or (deduped[0] if deduped else None)

        if best:
            norm = _normalize_table(best.get("rows", []), best.get("method", ""))
            all_tables.append(
                {
                    "page": pnum,
                    "table_index": 0,
                    "method": best.get("method", "unknown"),
                    "rows": norm["rows"],
                    "headers": norm.get("headers"),
                    "data_rows": norm.get("data_rows"),
                    "has_header": norm.get("has_header", False),
                    "row_count": norm["row_count"],
                    "col_count": norm["col_count"],
                }
            )
        elif deduped:
            for ti, rec in enumerate(deduped[:3]):
                norm = _normalize_table(rec.get("rows", []), rec.get("method", ""))
                all_tables.append(
                    {
                        "page": pnum,
                        "table_index": ti,
                        "method": rec.get("method", "unknown"),
                        "rows": norm["rows"],
                        "headers": norm.get("headers"),
                        "data_rows": norm.get("data_rows"),
                        "has_header": norm.get("has_header", False),
                        "row_count": norm["row_count"],
                        "col_count": norm["col_count"],
                    }
                )

    return all_tables
