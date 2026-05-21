import { cn } from '../lib/utils';
import { formatCellLabel } from '../lib/rosterTime';

export default function ShiftBadge({ status, shiftStart, shiftEnd, break_minutes, total_hours, cell, className }) {
  const c = cell || { status, shift_start: shiftStart, shift_end: shiftEnd, break_minutes, total_hours };
  if (c.status === 'LEAVE') {
    return (
      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30', className)}>
        Leave
      </span>
    );
  }
  if (c.status === 'WO') {
    return (
      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30', className)}>
        WO
      </span>
    );
  }
  if (c.status === 'H' || c.status === 'PH') {
    return (
      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-300 ring-1 ring-red-500/30', className)}>
        PH
      </span>
    );
  }
  const label = formatCellLabel(c) || 'W';
  return (
    <span className={cn('inline-block max-w-[140px] truncate rounded px-1 py-0.5 font-mono text-[8px] font-medium leading-tight bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 sm:text-[9px]', className)} title={label}>
      {label}
    </span>
  );
}
