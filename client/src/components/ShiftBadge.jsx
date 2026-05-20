import { cn, formatTime } from '../lib/utils';

export default function ShiftBadge({ status, shiftStart, shiftEnd, className }) {
  if (status === 'WO') {
    return (
      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30', className)}>
        WO
      </span>
    );
  }
  if (status === 'H') {
    return (
      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-300 ring-1 ring-red-500/30', className)}>
        H
      </span>
    );
  }
  const label = shiftStart && shiftEnd ? `${formatTime(shiftStart)}–${formatTime(shiftEnd)}` : 'W';
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] font-medium bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30', className)}>
      {label}
    </span>
  );
}
