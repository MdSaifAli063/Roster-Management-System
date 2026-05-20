"""Detect text-based vs scanned/image-based PDF pages."""

from __future__ import annotations

from enum import Enum
from typing import Any

import pdfplumber

from .utils import normalize_indices, open_pdf_safe, parse_page_spec


class PageType(str, Enum):
    TEXT = "text"
    SCANNED = "scanned"
    MIXED = "mixed"
    EMPTY = "empty"


# Chars per page below this with high image coverage → likely scanned
MIN_TEXT_CHARS = 25
# Some text but mostly images
MIXED_TEXT_CHARS = 100


def _page_char_count_pdfplumber(page) -> int:
    try:
        text = page.extract_text() or ""
        return len(text.strip())
    except Exception:
        return 0


def _page_image_coverage(page) -> float:
    """Rough ratio of page area covered by images (0..1)."""
    try:
        w, h = page.width, page.height
        if not w or not h:
            return 0.0
        area = w * h
        img_area = 0.0
        for im in page.images:
            img_area += im.get("width", 0) * im.get("height", 0)
        return min(1.0, img_area / area) if area else 0.0
    except Exception:
        return 0.0


def classify_page(char_count: int, image_coverage: float) -> PageType:
    if char_count == 0 and image_coverage < 0.05:
        return PageType.EMPTY
    if char_count >= MIXED_TEXT_CHARS or (char_count >= MIN_TEXT_CHARS and image_coverage < 0.2):
        return PageType.TEXT
    if char_count < MIN_TEXT_CHARS and image_coverage > 0.15:
        return PageType.SCANNED
    if char_count < MIN_TEXT_CHARS:
        return PageType.SCANNED
    if image_coverage > 0.25 and char_count < MIXED_TEXT_CHARS:
        return PageType.MIXED
    return PageType.TEXT


def analyze_pages(pdf_path: str, pages: list[int] | None = None) -> list[dict[str, Any]]:
    """Analyze each page; returns list of {page, type, char_count, image_coverage}."""
    doc = open_pdf_safe(pdf_path)
    total = doc.page_count
    doc.close()

    indices = normalize_indices(pages, total)
    results = []

    with pdfplumber.open(pdf_path) as pdf:
        for idx in indices:
            page = pdf.pages[idx]
            chars = _page_char_count_pdfplumber(page)
            coverage = _page_image_coverage(page)
            ptype = classify_page(chars, coverage)
            results.append(
                {
                    "page": idx + 1,
                    "type": ptype.value,
                    "char_count": chars,
                    "image_coverage": round(coverage, 3),
                }
            )
    return results


def detect_pdf_type(pdf_path: str, sample_pages: int = 5) -> str:
    """
    Overall PDF type: text | scanned | mixed.
    Samples up to `sample_pages` spread across the document.
    """
    doc = open_pdf_safe(pdf_path)
    total = doc.page_count
    doc.close()

    if total == 0:
        return "empty"

    if total <= sample_pages:
        indices = list(range(total))
    else:
        step = max(1, total // sample_pages)
        indices = list(range(0, total, step))[:sample_pages]

    analysis = analyze_pages(pdf_path, pages=indices)
    types = {a["type"] for a in analysis}

    if types <= {"text", "empty"}:
        return "text"
    if types <= {"scanned", "empty"}:
        return "scanned"
    return "mixed"


def pages_needing_ocr(page_analysis: list[dict]) -> list[int]:
    """Return 1-based page numbers that should use OCR."""
    return [
        p["page"]
        for p in page_analysis
        if p["type"] in (PageType.SCANNED.value, PageType.MIXED.value, PageType.EMPTY.value)
    ]
