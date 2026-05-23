import { useEffect, useRef, useState } from 'react';
import { format, parseISO, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

function toISO(d) {
  return format(d, 'yyyy-MM-dd');
}

function weekBounds(anchor = new Date()) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  return { from: toISO(start), to: toISO(end) };
}

const PRESETS = [
  { id: 'this-week', label: 'This week', getRange: () => weekBounds(new Date()) },
  { id: 'last-week', label: 'Last week', getRange: () => weekBounds(subWeeks(new Date(), 1)) },
];

export function formatRangeLabel(from, to) {
  const a = parseISO(from);
  const b = parseISO(to);
  if (format(a, 'yyyy') === format(b, 'yyyy')) {
    if (format(a, 'MMMM') === format(b, 'MMMM')) {
      return `${format(a, 'MMMM d')} – ${format(b, 'd, yyyy')}`;
    }
    return `${format(a, 'MMMM d')} – ${format(b, 'MMMM d, yyyy')}`;
  }
  return `${format(a, 'MMM d, yyyy')} – ${format(b, 'MMM d, yyyy')}`;
}

export default function DashboardDateRangePicker({ from, to, onChange, className }) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const ref = useRef(null);

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
  }, [from, to]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const apply = (nextFrom, nextTo) => {
    onChange(nextFrom, nextTo);
    setOpen(false);
  };

  const applyCustom = () => {
    if (!draftFrom || !draftTo || draftFrom > draftTo) return;
    const start = parseISO(draftFrom);
    const end = parseISO(draftTo);
    const days = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
    if (days > 14) return;
    apply(draftFrom, draftTo);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:shadow',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
        )}
      >
        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="max-w-[200px] truncate sm:max-w-none">{formatRangeLabel(from, to)}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,320px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick range</p>
          <div className="mt-2 flex flex-col gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10"
                onClick={() => {
                  const r = p.getRange();
                  apply(r.from, r.to);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Custom (max 14 days)</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">
              From
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <label className="text-xs text-slate-500">
              To
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={applyCustom}
            className="mt-3 w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply range
          </button>
        </div>
      )}
    </div>
  );
}

export { weekBounds };
