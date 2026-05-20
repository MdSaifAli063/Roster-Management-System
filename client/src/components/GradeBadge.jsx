import { cn } from '../lib/utils';

const GRADE_COLORS = {
  G1: 'bg-purple-500/20 text-purple-300 ring-purple-500/30',
  G2: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  G3: 'bg-teal-500/20 text-teal-300 ring-teal-500/30',
  G4: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
};

export default function GradeBadge({ grade }) {
  if (!grade) return <span className="text-[var(--text-secondary)]">—</span>;
  const key = String(grade).toUpperCase();
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', GRADE_COLORS[key] || 'bg-slate-500/20 text-slate-300 ring-slate-500/30')}>
      {grade}
    </span>
  );
}
