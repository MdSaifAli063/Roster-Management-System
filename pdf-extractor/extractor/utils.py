"""Helpers, metadata, and output formatters."""

from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF


class ExtractionError(Exception):
    """Base extraction error."""


class PasswordProtectedError(ExtractionError):
    """PDF requires a password."""


class CorruptedPdfError(ExtractionError):
    """PDF cannot be opened or parsed."""


def open_pdf_safe(path: str | Path) -> fitz.Document:
    """Open PDF with PyMuPDF; map common errors to typed exceptions."""
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {path}")

    try:
        doc = fitz.open(path)
    except Exception as exc:
        raise CorruptedPdfError(f"Cannot open PDF: {exc}") from exc

    if doc.is_encrypted:
        if not doc.authenticate(""):
            doc.close()
            raise PasswordProtectedError(
                "PDF is password-protected. Provide password support or decrypt first."
            )
    return doc


def parse_page_spec(spec: str | None, total_pages: int) -> list[int] | None:
    """
    Parse 'all', '1', '1-3', '1,3,5-7' into 0-based page indices.
    Returns None meaning all pages.
    """
    if spec is None or spec.strip().lower() in ("all", "*"):
        return None

    indices: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_s, end_s = part.split("-", 1)
            start = int(start_s) - 1
            end = int(end_s) - 1
            if start < 0 or end >= total_pages or start > end:
                raise ValueError(f"Invalid page range: {part} (total {total_pages})")
            indices.update(range(start, end + 1))
        else:
            idx = int(part) - 1
            if idx < 0 or idx >= total_pages:
                raise ValueError(f"Invalid page: {part} (total {total_pages})")
            indices.add(idx)

    return sorted(indices)


def normalize_indices(pages: list[int] | None, total: int) -> list[int]:
    if pages is None:
        return list(range(total))
    return [p for p in pages if 0 <= p < total]


def extract_metadata(pdf_path: str | Path) -> dict[str, Any]:
    path = Path(pdf_path)
    stat = path.stat()
    doc = open_pdf_safe(path)
    try:
        meta = doc.metadata or {}
        return {
            "file_name": path.name,
            "file_path": str(path.resolve()),
            "file_size_bytes": stat.st_size,
            "file_size_human": _human_size(stat.st_size),
            "page_count": doc.page_count,
            "title": meta.get("title") or "",
            "author": meta.get("author") or "",
            "subject": meta.get("subject") or "",
            "creator": meta.get("creator") or "",
            "producer": meta.get("producer") or "",
            "creation_date": meta.get("creationDate") or "",
            "mod_date": meta.get("modDate") or "",
            "extracted_at": datetime.now(timezone.utc).isoformat(),
        }
    finally:
        doc.close()


def _human_size(num: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} TB"


def tables_to_dataframes(table_records: list[dict]) -> list[Any]:
    import pandas as pd

    frames = []
    for rec in table_records:
        rows = rec.get("rows") or []
        if not rows:
            continue
        header = rows[0]
        body = rows[1:] if len(rows) > 1 else []
        if body:
            df = pd.DataFrame(body, columns=header)
        else:
            df = pd.DataFrame([header])
        frames.append(df)
    return frames


def table_records_to_dicts(table_records: list[dict]) -> list[dict]:
    """Convert table rows to list-of-dicts using first row as header."""
    out = []
    for rec in table_records:
        rows = rec.get("rows") or []
        if len(rows) < 2:
            continue
        headers = [
            str(h).strip() if str(h).strip() else f"col_{i}"
            for i, h in enumerate(rows[0])
        ]
        for row in rows[1:]:
            padded = list(row) + [""] * max(0, len(headers) - len(row))
            row_dict = {
                "page": rec["page"],
                "table_index": rec["table_index"],
                "method": rec.get("method", ""),
            }
            for i, h in enumerate(headers):
                row_dict[h] = padded[i] if i < len(padded) else ""
            out.append(row_dict)
    return out


def merge_page_results(
    pdf_path,
    metadata,
    page_analysis,
    text_pages,
    tables,
    ocr_pages,
    total_pages,
) -> dict[str, Any]:
    text_by_page = {p["page"]: p for p in text_pages}
    ocr_by_page = {p["page"]: p for p in ocr_pages}

    pages_out = []
    for i in range(total_pages):
        analysis = next((a for a in page_analysis if a["page"] == i + 1), {})
        ptype = analysis.get("type", "unknown")
        text_entry = text_by_page.get(i + 1, {})
        ocr_entry = ocr_by_page.get(i + 1, {})

        content = text_entry.get("text", "")
        source = text_entry.get("source", "")
        if ptype in ("scanned", "mixed") and ocr_entry.get("text"):
            if not content.strip():
                content = ocr_entry["text"]
                source = "ocr"
            elif len(content.strip()) < 30:
                content = f"{content}\n\n[OCR]\n{ocr_entry['text']}"
                source = f"{source}+ocr"

        pages_out.append(
            {
                "page": i + 1,
                "type": ptype,
                "char_count": analysis.get("char_count", len(content)),
                "text": content,
                "source": source or "none",
                "empty": not content.strip(),
            }
        )

    pdf_type = _overall_type(page_analysis)

    return {
        "pdf_path": str(pdf_path),
        "pdf_type": pdf_type,
        "metadata": metadata,
        "pages": pages_out,
        "tables": tables,
        "summary": {
            "total_pages": total_pages,
            "text_pages": sum(1 for p in page_analysis if p["type"] == "text"),
            "scanned_pages": sum(1 for p in page_analysis if p["type"] == "scanned"),
            "mixed_pages": sum(1 for p in page_analysis if p["type"] == "mixed"),
            "empty_pages": sum(1 for p in pages_out if p["empty"]),
            "table_count": len(tables),
        },
    }


def _overall_type(page_analysis: list[dict]) -> str:
    types = {p["type"] for p in page_analysis}
    if types == {"text"}:
        return "text"
    if types == {"scanned"}:
        return "scanned"
    return "mixed"


def write_output(data: dict, output_format: str, output_path: str | Path) -> list[Path]:
    """
    Write extraction result. Returns list of files written.
    output_format: json | txt | csv | all
    """
    output_path = Path(output_path)
    written: list[Path] = []

    fmt = output_format.lower()
    if fmt in ("json", "all"):
        p = _resolve_path(output_path, "json")
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        written.append(p)

    if fmt in ("txt", "all"):
        p = _resolve_path(output_path, "txt")
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("w", encoding="utf-8") as f:
            for page in data.get("pages", []):
                f.write(f"\n{'=' * 60}\n")
                f.write(f"Page {page['page']} ({page['type']})\n")
                f.write(f"{'=' * 60}\n\n")
                f.write(page.get("text", ""))
                f.write("\n")
        written.append(p)

    if fmt in ("csv", "all"):
        tables = data.get("tables") or []
        if tables:
            p = _resolve_path(output_path, "csv")
            p.parent.mkdir(parents=True, exist_ok=True)
            dict_rows = table_records_to_dicts(tables)
            if dict_rows:
                fieldnames: list[str] = []
                for row in dict_rows:
                    for k in row:
                        if k not in fieldnames:
                            fieldnames.append(k)
                with p.open("w", encoding="utf-8", newline="") as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                    writer.writeheader()
                    writer.writerows(dict_rows)
                written.append(p)
            else:
                # write raw rows if no header row pattern
                p = _resolve_path(output_path, "csv")
                with p.open("w", encoding="utf-8", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(["page", "table_index", "method", "row_index", "cells"])
                    for t in tables:
                        for ri, row in enumerate(t.get("rows") or []):
                            writer.writerow(
                                [t["page"], t["table_index"], t.get("method", ""), ri, "|".join(map(str, row))]
                            )
                written.append(p)

    return written


def _resolve_path(path: Path, ext: str) -> Path:
    if path.suffix.lower() == f".{ext}":
        return path
    if path.suffix:
        return path.with_suffix(f".{ext}")
    return Path(str(path) + f".{ext}")
