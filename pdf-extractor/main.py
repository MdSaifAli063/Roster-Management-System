#!/usr/bin/env python3
"""CLI entry point for PDF extraction."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from extractor import run_extraction
from extractor.utils import (
    CorruptedPdfError,
    ExtractionError,
    PasswordProtectedError,
    open_pdf_safe,
    parse_page_spec,
    write_output,
)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Extract text, tables, and metadata from PDFs (no LLM).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --input report.pdf --output json
  python main.py --input scan.pdf --output all --pages 1-5
  python main.py --input doc.pdf --output txt --no-tables
        """,
    )
    p.add_argument("--input", "-i", required=True, help="Path to input PDF")
    p.add_argument(
        "--output",
        "-o",
        default="json",
        choices=["json", "txt", "csv", "all"],
        help="Output format (default: json)",
    )
    p.add_argument(
        "--out-path",
        default=None,
        help="Output file or directory (default: ./output/<pdf_stem>.<ext>)",
    )
    p.add_argument(
        "--pages",
        "-p",
        default="all",
        help='Pages to process: "all", "3", "1-5", "1,3,7-10" (1-based)',
    )
    p.add_argument("--no-tables", action="store_true", help="Skip table extraction")
    p.add_argument("--no-ocr", action="store_true", help="Skip OCR for scanned pages")
    p.add_argument("--dpi", type=int, default=200, help="OCR render DPI (default: 200)")
    p.add_argument("--quiet", "-q", action="store_true", help="Less console output")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    pdf_path = Path(args.input)

    if not pdf_path.is_file():
        print(f"Error: file not found: {pdf_path}", file=sys.stderr)
        return 1

    try:
        doc = open_pdf_safe(pdf_path)
        total = doc.page_count
        doc.close()

        page_indices = parse_page_spec(args.pages, total)

        if not args.quiet:
            print(f"Processing: {pdf_path.name} ({total} pages)")

        data = run_extraction(
            pdf_path,
            pages=page_indices,
            include_tables=not args.no_tables,
            include_ocr=not args.no_ocr,
            dpi=args.dpi,
        )

        out_base = Path(args.out_path) if args.out_path else Path("output") / pdf_path.stem
        written = write_output(data, args.output, out_base)

        if not args.quiet:
            s = data["summary"]
            print(f"PDF type: {data['pdf_type']}")
            print(
                f"Pages — text: {s['text_pages']}, scanned: {s['scanned_pages']}, "
                f"mixed: {s['mixed_pages']}, empty: {s['empty_pages']}"
            )
            print(f"Tables found: {s['table_count']}")
            for f in written:
                print(f"Wrote: {f.resolve()}")

        return 0

    except PasswordProtectedError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    except CorruptedPdfError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 3
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 4
    except ExtractionError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 5
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130
    except Exception as exc:
        print(f"Unexpected error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
