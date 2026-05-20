"""OCR pipeline for scanned/image-based PDF pages using pdf2image + pytesseract."""

from __future__ import annotations

import io
from typing import Any

import fitz
from PIL import Image

from .detector import PageType, pages_needing_ocr
from .utils import normalize_indices, open_pdf_safe

try:
    import pytesseract

    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    from pdf2image import convert_from_path

    HAS_PDF2IMAGE = True
except ImportError:
    HAS_PDF2IMAGE = False


def _ocr_image_pil(img: Image.Image, lang: str = "eng") -> str:
    if not HAS_TESSERACT:
        return ""
    try:
        return pytesseract.image_to_string(img, lang=lang).strip()
    except Exception as exc:
        if "tesseract" in str(exc).lower():
            raise RuntimeError(
                "Tesseract OCR is not installed. Install from https://github.com/tesseract-ocr/tesseract"
            ) from exc
        return ""


def _render_page_pymupdf(doc: fitz.Document, page_index: int, dpi: int = 200) -> Image.Image:
    """Render page to PIL Image via PyMuPDF (no poppler required)."""
    page = doc[page_index]
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png")))


def _ocr_page_pdf2image(pdf_path: str, page_index: int, dpi: int = 200) -> str:
    if not HAS_PDF2IMAGE:
        return ""
    try:
        images = convert_from_path(
            pdf_path,
            dpi=dpi,
            first_page=page_index + 1,
            last_page=page_index + 1,
        )
        if images:
            return _ocr_image_pil(images[0])
    except Exception as exc:
        if "poppler" in str(exc).lower() or "Unable to get page count" in str(exc):
            return ""
        raise
    return ""


def ocr_page(pdf_path: str, page_index: int, doc: fitz.Document | None = None, dpi: int = 200) -> str:
    """OCR a single page. Prefers PyMuPDF render; falls back to pdf2image."""
    own_doc = doc is None
    if own_doc:
        doc = open_pdf_safe(pdf_path)

    try:
        img = _render_page_pymupdf(doc, page_index, dpi=dpi)
        text = _ocr_image_pil(img)
        if text:
            return text
        return _ocr_page_pdf2image(pdf_path, page_index, dpi=dpi)
    finally:
        if own_doc and doc:
            doc.close()


def extract_ocr(
    pdf_path: str,
    pages: list[int] | None = None,
    page_types: list[dict] | None = None,
    dpi: int = 200,
    lang: str = "eng",
) -> list[dict[str, Any]]:
    """
    OCR pages that need it (scanned/mixed/empty) or explicit page list.
    Processes one page at a time to limit memory on large PDFs.
    """
    if not HAS_TESSERACT:
        return []

    doc = open_pdf_safe(pdf_path)
    total = doc.page_count

    if page_types:
        ocr_page_nums = set(pages_needing_ocr(page_types))
        indices = [p - 1 for p in sorted(ocr_page_nums)]
    elif pages is None:
        indices = list(range(total))
    else:
        indices = normalize_indices(pages, total)

    results = []
    for idx in indices:
        try:
            img = _render_page_pymupdf(doc, idx, dpi=dpi)
            text = pytesseract.image_to_string(img, lang=lang).strip() if HAS_TESSERACT else ""
            if not text:
                text = _ocr_page_pdf2image(pdf_path, idx, dpi=dpi)
            results.append(
                {
                    "page": idx + 1,
                    "text": text,
                    "source": "tesseract",
                    "dpi": dpi,
                }
            )
        except RuntimeError:
            raise
        except Exception:
            results.append({"page": idx + 1, "text": "", "source": "ocr_failed", "dpi": dpi})

    doc.close()
    return results
