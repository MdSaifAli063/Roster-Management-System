"""Text extraction via pdfplumber, pdfminer.six, and PyMuPDF fallback."""

from __future__ import annotations

from typing import Any

import fitz
import pdfplumber
from pdfminer.high_level import extract_text as pdfminer_extract_page
from pdfminer.layout import LAParams

from .detector import PageType
from .utils import normalize_indices, open_pdf_safe


def _extract_pdfplumber(page) -> str:
    try:
        # layout=True helps multi-column reading order
        text = page.extract_text(layout=True, x_tolerance=2, y_tolerance=2) or ""
        if not text.strip():
            text = page.extract_text() or ""
        return text.strip()
    except Exception:
        return ""


def _extract_pdfminer(pdf_path: str, page_index: int) -> str:
    """Low-level layout-aware extraction for a single page (1-based page number for pdfminer)."""
    try:
        laparams = LAParams(line_margin=0.15, word_margin=0.1, char_margin=2.0, boxes_flow=0.5)
        text = pdfminer_extract_page(
            pdf_path,
            page_numbers=[page_index],
            laparams=laparams,
        )
        return (text or "").strip()
    except Exception:
        return ""


def _extract_pymupdf(doc: fitz.Document, page_index: int) -> str:
    try:
        page = doc[page_index]
        # sort=True improves reading order on multi-column pages
        return (page.get_text("text", sort=True) or "").strip()
    except Exception:
        return ""


def extract_text_page(
    pdf_path: str,
    page_index: int,
    doc: fitz.Document | None = None,
) -> tuple[str, str]:
    """
    Extract text from one page (0-based index).
    Returns (text, source) where source is pdfplumber|pdfminer|pymupdf.
    """
    best = ""
    source = "none"

    with pdfplumber.open(pdf_path) as pdf:
        if page_index < len(pdf.pages):
            best = _extract_pdfplumber(pdf.pages[page_index])
            if best:
                source = "pdfplumber"

    if len(best) < 30:
        miner = _extract_pdfminer(pdf_path, page_index)
        if len(miner) > len(best):
            best = miner
            source = "pdfminer"

    own_doc = doc is None
    if own_doc:
        doc = open_pdf_safe(pdf_path)
    try:
        if len(best) < 30:
            fallback = _extract_pymupdf(doc, page_index)
            if len(fallback) > len(best):
                best = fallback
                source = "pymupdf"
    finally:
        if own_doc and doc:
            doc.close()

    return best, source


def extract_text(
    pdf_path: str,
    pages: list[int] | None = None,
    page_types: list[dict] | None = None,
) -> list[dict[str, Any]]:
    """
    Extract text page by page. Skips heavy OCR pages (handled by ocr_extractor).
    page_types: optional analysis from detector; scanned pages get minimal pass.
    """
    doc = open_pdf_safe(pdf_path)
    total = doc.page_count
    indices = normalize_indices(pages, total)

    type_map = {}
    if page_types:
        type_map = {p["page"]: p["type"] for p in page_types}

    results = []
    for idx in indices:
        pnum = idx + 1
        ptype = type_map.get(pnum, PageType.TEXT.value)

        if ptype == PageType.SCANNED.value:
            results.append({"page": pnum, "text": "", "source": "skipped_for_ocr"})
            continue

        text, source = extract_text_page(pdf_path, idx, doc=doc)
        results.append({"page": pnum, "text": text, "source": source})

    doc.close()
    return results
