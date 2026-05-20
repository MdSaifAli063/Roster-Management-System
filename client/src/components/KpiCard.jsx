import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useCountUp } from '../hooks/useCountUp';

function MiniSparkline({ color = '#3B82F6' }) {
  const points = '0,20 8,12 16,16 24,8 32,10 40,4';
  return (
    <svg viewBox="0 0 40 24" className="h-8 w-16 opacity-60" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KpiCard({ label, value, icon: Icon, to, accent = 'blue', loading }) {
  const colors = {
    blue: { border: 'border-l-blue-500', spark: '#3B82F6', icon: 'text-blue-400 bg-blue-500/10' },
    green: { border: 'border-l-emerald-500', spark: '#10B981', icon: 'text-emerald-400 bg-emerald-500/10' },
    amber: { border: 'border-l-amber-500', spark: '#F59E0B', icon: 'text-amber-400 bg-amber-500/10' },
    red: { border: 'border-l-red-500', spark: '#EF4444', icon: 'text-red-400 bg-red-500/10' },
  };
  const c = colors[accent] || colors.blue;
  const count = useCountUp(value, 800, !loading);

  const inner = (
    <div className={cn('glass-card group h-full border-l-[3px] p-4 transition-all duration-200 hover:shadow-[0_0_24px_rgba(59,130,246,0.12)] sm:p-5', c.border)}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('rounded-lg p-2.5', c.icon)}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <MiniSparkline color={c.spark} />
      </div>
      {loading ? (
        <div className="mt-3 h-9 w-16 skeleton" />
      ) : (
        <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{count}</p>
      )}
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p>
    </div>
  );

  if (to) return <Link to={to} className="block min-w-0">{inner}</Link>;
  return inner;
}
