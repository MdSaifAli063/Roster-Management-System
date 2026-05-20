"""Create a minimal test PDF using PyMuPDF (no extra deps)."""

import sys
from pathlib import Path

import fitz


def create_sample(path: Path) -> None:
    doc = fitz.open()
    p1 = doc.new_page()
    p1.insert_text((72, 72), "RosterPro PDF Extractor Test", fontsize=14)
    p1.insert_text((72, 110), "Page 1: text-based content for extraction pipeline.")
    p1.insert_text((72, 140), "Column A    Column B    Column C")
    p1.insert_text((72, 160), "Value 1     Value 2     Value 3")

    p2 = doc.new_page()
    p2.insert_text((72, 72), "Page 2: second page with more text.", fontsize=12)

    doc.save(path)
    doc.close()
    print(f"Created {path}")


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "samples/test_sample.pdf")
    out.parent.mkdir(parents=True, exist_ok=True)
    create_sample(out)
