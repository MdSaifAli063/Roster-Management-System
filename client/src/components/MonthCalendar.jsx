import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './ui/Button';
import { cn } from '../lib/utils';

const WEEKDAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const SIZE_CONFIG = {
  sm: {
    wrap: 'max-w-[252px]',
    cell: 'h-7 w-7 text-[10px]',
    gap: 'gap-0.5',
    header: 'text-sm',
    weekday: 'text-[9px] py-0.5',
    legend: 'text-[9px] gap-x-2',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    wrap: 'max-w-[300px]',
    cell: 'h-8 w-8 text-[11px]',
    gap: 'gap-1',
    header: 'text-sm',
    weekday: 'text-[10px] py-1',
    legend: 'text-[10px] gap-x-2.5',
    dot: 'h-2 w-2',
  },
  lg: {
    wrap: 'max-w-full',
    cell: 'h-9 w-9 sm:h-10 sm:w-10 text-xs',
    gap: 'gap-1.5',
    header: 'text-base',
    weekday: 'text-xs py-1',
    legend: 'text-xs gap-x-3',
    dot: 'h-2 w-2',
  },
};

function dayStyle(dayInfo, date, viewMonth) {
  if (!isSameMonth(date, viewMonth)) {
    return 'text-[var(--text-secondary)]/40';
  }
  const hasHoliday = dayInfo?.events?.some((e) => e.type === 'holiday');
  if (dayInfo?.isToday && hasHoliday) {
    return 'bg-red-500/20 font-semibold text-red-700 ring-2 ring-blue-500 dark:text-red-300';
  }
  if (dayInfo?.isToday) {
    return 'bg-blue-600 font-semibold text-white ring-2 ring-blue-400/50';
  }
  const isWeekend = dayInfo?.isWeekend;
  const roster = dayInfo?.events?.find((e) => e.type === 'roster');

  if (hasHoliday) {
    return 'bg-red-500/15 font-medium text-red-700 dark:text-red-300';
  }
  if (roster?.status === 'WO' || isWeekend) {
    return 'bg-amber-500/15 text-amber-800 dark:text-amber-200';
  }
  if (roster?.status === 'W') {
    return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200';
  }
  return 'text-[var(--text-primary)]';
}

export default function MonthCalendar({
  year,
  month,
  days = {},
  loading,
  onMonthChange,
  onSelectDate,
  selectedDate,
  compact = false,
  size: sizeProp,
}) {
  const size = sizeProp || (compact ? 'sm' : 'md');
  const cfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const viewMonth = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const prev = () => {
    const d = subMonths(viewMonth, 1);
    onMonthChange(d.getFullYear(), d.getMonth() + 1);
  };
  const next = () => {
    const d = addMonths(viewMonth, 1);
    onMonthChange(d.getFullYear(), d.getMonth() + 1);
  };

  return (
    <div className={cn('mx-auto w-full', cfg.wrap)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={prev} className="h-8 w-8 px-0" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className={cn('font-display text-center font-semibold text-[var(--text-primary)]', cfg.header)}>
          {format(viewMonth, 'MMMM yyyy')}
        </p>
        <Button type="button" variant="ghost" onClick={next} className="h-8 w-8 px-0" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className={cn('grid grid-cols-7 text-center', cfg.gap)}>
        {WEEKDAYS_FULL.map((d, i) => (
          <div key={`${d}-${i}`} className={cn('font-medium text-[var(--text-secondary)]', cfg.weekday)}>
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            <span className="hidden sm:inline">{size === 'sm' ? d.slice(0, 1) : d}</span>
          </div>
        ))}
        {loading
          ? Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <div className={cn('animate-pulse rounded bg-[var(--bg-elevated)]', cfg.cell)} />
              </div>
            ))
          : gridDays.map((date) => {
              const key = format(date, 'yyyy-MM-dd');
              const info = days[key];
              const selected = selectedDate && isSameDay(date, selectedDate);
              return (
                <div key={key} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onSelectDate?.(date, info)}
                    title={
                      info?.events?.map((e) => e.label).join(', ') ||
                      (info?.isWeekend ? 'Weekend' : '')
                    }
                    className={cn(
                      'flex items-center justify-center rounded font-medium transition hover:ring-1 hover:ring-blue-500/40',
                      cfg.cell,
                      dayStyle(info, date, viewMonth),
                      selected && 'ring-2 ring-blue-600 dark:ring-blue-400',
                      !onSelectDate && 'cursor-default'
                    )}
                  >
                    {format(date, 'd')}
                  </button>
                </div>
              );
            })}
      </div>

      <div className={cn('mt-2.5 flex flex-wrap justify-center text-[var(--text-secondary)]', cfg.legend)}>
        <span className="flex items-center gap-1">
          <span className={cn('rounded bg-red-400/60', cfg.dot)} /> Holiday
        </span>
        <span className="flex items-center gap-1">
          <span className={cn('rounded bg-amber-400/60', cfg.dot)} /> Off
        </span>
        <span className="flex items-center gap-1">
          <span className={cn('rounded bg-emerald-400/60', cfg.dot)} /> Work
        </span>
        <span className="flex items-center gap-1">
          <span className={cn('rounded bg-blue-600', cfg.dot)} /> Today
        </span>
      </div>
    </div>
  );
}
