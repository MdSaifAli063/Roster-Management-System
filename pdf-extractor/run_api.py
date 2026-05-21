#!/usr/bin/env python3
"""API runner — outputs JSON to stdout for Node.js integration."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from extractor import run_extraction  # noqa: E402
from extractor.invoice_fields import extract_invoice_fields  # noqa: E402
from extractor.utils import open_pdf_safe, parse_page_spec  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--pages", default="all")
    parser.add_argument("--no-tables", action="store_true")
    parser.add_argument("--no-ocr", action="store_true")
    parser.add_argument("--dpi", type=int, default=200)
    args = parser.parse_args()

    pdf_path = Path(args.input)
    if not pdf_path.is_file():
        print(json.dumps({"error": f"File not found: {pdf_path}"}), file=sys.stderr)
        return 1

    try:
        doc = open_pdf_safe(pdf_path)
        total = doc.page_count
        doc.close()
        page_indices = parse_page_spec(args.pages, total)

        data = run_extraction(
            str(pdf_path),
            pages=page_indices,
            include_tables=not args.no_tables,
            include_ocr=not args.no_ocr,
            dpi=args.dpi,
        )
        data["invoice_fields"] = extract_invoice_fields(data)
        json.dump(data, sys.stdout, ensure_ascii=False, default=str)
        return 0
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
