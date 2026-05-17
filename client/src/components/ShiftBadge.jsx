import { cn, formatTime } from '../lib/utils';

export default function ShiftBadge({ status, shiftStart, shiftEnd, className }) {
  if (status === 'WO') {
    return (
      <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', className)}>
        WO
      </span>
    );
  }
  if (status === 'H') {
    return (
      <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', className)}>
        H
      </span>
    );
  }
  const label = shiftStart && shiftEnd ? `${formatTime(shiftStart)}–${formatTime(shiftEnd)}` : 'W';
  return (
    <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', className)}>
      {label}
    </span>
  );
}
