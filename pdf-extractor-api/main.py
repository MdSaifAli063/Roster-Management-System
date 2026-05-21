"""
FastAPI microservice for PDF extraction — no LLM.
Node backend calls PDF_API_URL (default http://127.0.0.1:8001).
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parent.parent / "pdf-extractor"
sys.path.insert(0, str(ROOT))

from extractor import run_extraction  # noqa: E402
from extractor.invoice_fields import extract_invoice_fields  # noqa: E402

app = FastAPI(title="RosterPro PDF Extractor API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "pdf-extractor-api"}


@app.post("/extract")
async def extract(
    file: UploadFile = File(...),
    pages: str = Form("all"),
    include_tables: bool = Form(True),
    include_ocr: bool = Form(True),
):
    suffix = Path(file.filename or "doc.pdf").suffix or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        data = run_extraction(
            tmp_path,
            pages=pages,
            include_tables=include_tables,
            include_ocr=include_ocr,
        )
        fields = extract_invoice_fields(data)
        return {**data, "invoice_fields": fields}
    finally:
        Path(tmp_path).unlink(missing_ok=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
