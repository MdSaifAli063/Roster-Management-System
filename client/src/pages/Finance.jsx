import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import api from '../api/client';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { cn } from '../lib/utils';
import PlanGate from '../components/PlanGate';
import { useToast } from '../context/ToastContext';

const STATUS_STYLES = {
  PAID: 'bg-emerald-500/20 text-emerald-300',
  UNPAID: 'bg-amber-500/20 text-amber-300',
  OVERDUE: 'bg-red-500/20 text-red-300',
};

export default function Finance() {
  const navigate = useNavigate();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ category: '', status: '', supplier: '' });
  const [expanded, setExpanded] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    try {
      const [inv, rep] = await Promise.all([
        api.get('/finance/invoices', { params: filters }),
        api.get('/finance/reports/summary'),
      ]);
      setInvoices(inv.data || []);
      setSummary(rep.data || null);
    } catch {
      setInvoices([]);
      setSummary({ paid_by_month: [], due_by_month: [], by_category: [] });
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeInvoice = async (inv) => {
    const label = inv.supplier || inv.invoice_number || `#${inv.id}`;
    if (!window.confirm(`Delete invoice "${label}"? This cannot be undone.`)) return;

    setDeletingId(inv.id);
    try {
      await api.delete(`/finance/invoices/${inv.id}`);
      if (expanded === inv.id) setExpanded(null);
      toast?.success?.('Invoice deleted');
      await load();
    } catch (err) {
      toast?.error?.(err.response?.data?.error || 'Could not delete invoice');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PlanGate feature="finance">
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Finance Organiser</h1>
        <Button variant="secondary" onClick={() => navigate('/pdf-extractor')}>Extract invoice PDF</Button>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Categories">
            <ul className="text-sm">
              {(summary.by_category || []).map((c) => (
                <li key={c.category} className="flex justify-between py-1">
                  <span>{c.category}</span>
                  <span className="font-mono">${Number(c.total).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Salary feed (Roster Pro)">
            <p className="text-sm text-[var(--text-secondary)]">Wired for next phase — roster wages will flow here.</p>
          </Card>
        </div>
      )}

      <Card title="Invoice tracker">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <Input label="Supplier" value={filters.supplier} onChange={(e) => setFilters({ ...filters, supplier: e.target.value })} />
          <Select label="Status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
          </Select>
          <Select label="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All</option>
            <option value="Electricity">Electricity</option>
            <option value="Wages">Wages</option>
            <option value="Rent">Rent</option>
            <option value="Equipment">Equipment</option>
          </Select>
          <Button className="self-end" variant="primary" onClick={load}>Filter</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th></th>
                <th>Supplier</th>
                <th>Invoice #</th>
                <th>Due</th>
                <th>Total</th>
                <th>Status</th>
                <th className="w-12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <Fragment key={inv.id}>
                  <tr className="border-b border-[var(--border)] hover:bg-white/[0.02]">
                    <td>
                      <button type="button" className="text-xs text-[var(--accent-primary)]" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                        {expanded === inv.id ? '−' : '+'}
                      </button>
                    </td>
                    <td className="py-2">{inv.supplier}</td>
                    <td className="font-mono text-xs">{inv.invoice_number}</td>
                    <td>{inv.due_date?.slice?.(0, 10) || inv.due_date}</td>
                    <td className="font-mono">${Number(inv.total_inc_gst || 0).toFixed(2)}</td>
                    <td>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_STYLES[inv.display_status] || STATUS_STYLES.UNPAID)}>
                        {inv.display_status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        title="Delete invoice"
                        disabled={deletingId === inv.id}
                        onClick={() => removeInvoice(inv)}
                        className="rounded p-1.5 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {expanded === inv.id && (
                    <tr key={`${inv.id}-lines`}>
                      <td colSpan={7} className="bg-[var(--bg-elevated)] px-4 py-2 text-xs">
                        <pre className="whitespace-pre-wrap">{(inv.line_items || []).map((l) => JSON.stringify(l)).join('\n') || 'No line items'}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
    </PlanGate>
  );
}
