"""PDF extraction pipeline — pure Python, no LLM."""

from .detector import detect_pdf_type, PageType
from .text_extractor import extract_text
from .table_extractor import extract_tables
from .ocr_extractor import extract_ocr
from .utils import extract_metadata, write_output

__all__ = [
    "PageType",
    "detect_pdf_type",
    "extract_text",
    "extract_tables",
    "extract_ocr",
    "extract_metadata",
    "write_output",
    "run_extraction",
]


def run_extraction(pdf_path, pages=None, include_tables=True, include_ocr=True, dpi=200):
    """
    Full pipeline: metadata, per-page type detection, text/tables/OCR.
    Returns a dict ready for JSON serialization.
    """
    from .detector import analyze_pages
    from .utils import merge_page_results

    metadata = extract_metadata(pdf_path)
    total = metadata.get("page_count", 0)

    page_analysis = analyze_pages(pdf_path, pages=pages)
    text_pages = extract_text(pdf_path, pages=pages, page_types=page_analysis)
    tables = extract_tables(pdf_path, pages=pages) if include_tables else []
    ocr_pages = (
        extract_ocr(pdf_path, pages=pages, page_types=page_analysis, dpi=dpi)
        if include_ocr
        else []
    )

    return merge_page_results(
        pdf_path=pdf_path,
        metadata=metadata,
        page_analysis=page_analysis,
        text_pages=text_pages,
        tables=tables,
        ocr_pages=ocr_pages,
        total_pages=total,
    )
