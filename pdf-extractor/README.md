# PDF Text & Data Extractor

Pure Python PDF extraction — **no LLM, no AI libraries**. Works fully offline.

## Features

- **Auto-detection** — routes text-based vs scanned pages
- **Text** — pdfplumber → pdfminer.six → PyMuPDF fallback; multi-column layout support
- **Tables** — pdfplumber + camelot (lattice & stream)
- **OCR** — pytesseract + PyMuPDF/pdf2image rendering for scanned pages
- **Metadata** — title, author, dates, page count, file size
- **Output** — JSON, TXT, CSV (tables)
- **CLI** — page ranges, error handling for encrypted/corrupt/mixed PDFs

## Requirements

- Python 3.9+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) (optional, for scanned PDFs)
- [Poppler](https://poppler.freedesktop.org/) (optional fallback for pdf2image; PyMuPDF used by default)

### Windows

```powershell
# Tesseract (for OCR)
winget install UB-Mannheim.TesseractOCR

# Poppler (optional)
winget install oschwartz10612.Poppler
```

## Install

```powershell
cd pdf-extractor
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

```powershell
# JSON output (default)
python main.py --input sample.pdf --output json

# All formats
python main.py --input sample.pdf --output all

# Specific pages (1-based)
python main.py --input sample.pdf --output txt --pages 1-10

# Skip OCR or tables
python main.py --input sample.pdf --output json --no-ocr
python main.py --input sample.pdf --output csv --no-tables

# Alias entry point
python extract.py --input file.pdf --output json --pages all
```

Output defaults to `./output/<pdf_name>.<ext>`.

## Integrated with RosterPro website

Staff users can open **PDF Extract** in the sidebar (`/pdf-extract`).

- Upload PDF → API runs `pdf-extractor/run_api.py` on the server
- Results shown in the UI + download JSON
- **Local dev:** `pip install -r pdf-extractor/requirements.txt` in `pdf-extractor/.venv` (auto-detected)
- **Docker / Cloud Run:** Dockerfile installs Python + dependencies

API endpoints (staff, JWT required):

- `GET /api/pdf-extract/status`
- `POST /api/pdf-extract/extract` (multipart `file`, optional `pages`, `includeOcr`, `includeTables`)

---

```
pdf-extractor/
├── extractor/
│   ├── detector.py
│   ├── text_extractor.py
│   ├── table_extractor.py
│   ├── ocr_extractor.py
│   └── utils.py
├── main.py
├── extract.py
├── requirements.txt
└── README.md
```

## JSON output shape

```json
{
  "pdf_type": "text|scanned|mixed",
  "metadata": { "title": "...", "page_count": 10, ... },
  "pages": [{ "page": 1, "type": "text", "text": "...", "source": "pdfplumber" }],
  "tables": [{ "page": 2, "table_index": 0, "method": "camelot_lattice", "rows": [[...]] }],
  "summary": { "table_count": 1, ... }
}
```

## Constraints

- Zero LLM usage
- Offline-only library calls
- Page-by-page processing (200+ pages without loading all images at once)
- Password-protected PDFs raise a clear error (decrypt first)

## Library roles

| Library | Role |
|---------|------|
| pdfplumber | Primary text + table extraction |
| pdfminer.six | Layout-aware text fallback |
| PyMuPDF | Text fallback, page render for OCR |
| camelot-py | Bordered (lattice) & borderless (stream) tables |
| pytesseract + Pillow | OCR on scanned pages |
