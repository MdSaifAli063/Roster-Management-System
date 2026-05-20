import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

export default function PdfExtract() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('all');
  const [includeOcr, setIncludeOcr] = useState(false);
  const [includeTables, setIncludeTables] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [engine, setEngine] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/pdf-extract/status')
      .then((res) => setEngine(res.data))
      .catch(() => setEngine({ ok: false }));
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError('');
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type === 'application/pdf' || f?.name?.toLowerCase().endsWith('.pdf')) {
      setFile(f);
      setError('');
      setResult(null);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const extract = async () => {
    if (!file) {
      setError('Choose a PDF file first');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    const form = new FormData();
    form.append('file', file);
    form.append('pages', pages);
    form.append('includeTables', String(includeTables));
    form.append('includeOcr', String(includeOcr));

    try {
      const { data } = await api.post('/pdf-extract/extract', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace(/\.pdf$/i, '') || 'extracted'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy dark:text-white">PDF Extractor</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Extract text, tables, and metadata from PDF files — offline, no AI.
        </p>
      </div>

      {engine && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm',
            engine.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
          )}
        >
          {engine.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {engine.ok
            ? `Engine ready (${engine.version || engine.python})`
            : 'Python extractor not available on server. Install pdf-extractor dependencies (see README).'}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upload PDF">
          <div
            className={cn(
              'flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition',
              file
                ? 'border-teal bg-teal/5 dark:border-teal/50'
                : 'border-slate-200 hover:border-teal/50 dark:border-slate-700'
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <Upload className="mb-2 h-8 w-8 text-teal" />
            {file ? (
              <>
                <p className="font-medium text-navy dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700 dark:text-slate-200">Drop PDF here or click to browse</p>
                <p className="text-xs text-slate-500">Max 50 MB</p>
              </>
            )}
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFileChange} />
          </div>

          <div className="mt-4 space-y-3">
            <Input
              label="Pages"
              placeholder="all, 1-5, 1,3,7"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={includeTables} onChange={(e) => setIncludeTables(e.target.checked)} />
              Extract tables
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={includeOcr} onChange={(e) => setIncludeOcr(e.target.checked)} />
              OCR for scanned pages (requires Tesseract)
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <Button
            variant="teal"
            className="mt-4 w-full gap-2 sm:w-auto"
            onClick={extract}
            disabled={loading || !file || !engine?.ok}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? 'Extracting…' : 'Extract data'}
          </Button>
        </Card>

        <Card title="About">
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Text via pdfplumber, pdfminer, PyMuPDF</li>
            <li>Tables via pdfplumber + camelot</li>
            <li>Auto-detects text vs scanned pages</li>
            <li>Output: JSON with pages, tables, metadata</li>
            <li>No LLM — fully offline Python libraries</li>
          </ul>
        </Card>
      </div>

      {result && (
        <>
          <Card title="Summary">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-slate-500">PDF type</p>
                <p className="font-semibold capitalize text-navy dark:text-white">{result.pdf_type}</p>
              </div>
              <div>
                <p className="text-slate-500">Pages</p>
                <p className="font-semibold text-navy dark:text-white">{result.summary?.total_pages}</p>
              </div>
              <div>
                <p className="text-slate-500">Tables</p>
                <p className="font-semibold text-navy dark:text-white">{result.summary?.table_count}</p>
              </div>
              <div>
                <p className="text-slate-500">Title</p>
                <p className="truncate font-semibold text-navy dark:text-white">
                  {result.metadata?.title || '—'}
                </p>
              </div>
            </div>
            <Button variant="secondary" className="mt-4 gap-2" onClick={downloadJson}>
              <Download className="h-4 w-4" /> Download JSON
            </Button>
          </Card>

          <Card title="Extracted text (preview)">
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {(result.pages || []).map((p) => (
                <div key={p.page} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                  <p className="mb-1 text-xs font-medium text-teal">
                    Page {p.page} · {p.type} · {p.source}
                  </p>
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">
                    {p.text?.slice(0, 2000) || '(empty)'}
                    {p.text?.length > 2000 ? '…' : ''}
                  </pre>
                </div>
              ))}
            </div>
          </Card>

          {(result.tables || []).length > 0 && (
            <Card title={`Tables (${result.tables.length})`}>
              <div className="space-y-6 overflow-x-auto">
                {result.tables.map((t, i) => (
                  <div key={`${t.page}-${t.table_index}-${i}`}>
                    <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Page {t.page} · table {t.table_index + 1} · {t.method}
                    </p>
                    <table className="min-w-full border text-xs">
                      <tbody>
                        {(t.rows || []).map((row, ri) => (
                          <tr key={ri} className={ri === 0 ? 'bg-slate-50 font-medium dark:bg-slate-800' : 'border-t dark:border-slate-800'}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="border px-2 py-1 dark:border-slate-700">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
