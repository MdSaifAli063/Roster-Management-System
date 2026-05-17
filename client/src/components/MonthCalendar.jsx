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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayStyle(dayInfo, date, viewMonth) {
  if (!isSameMonth(date, viewMonth)) {
    return 'text-slate-300 dark:text-slate-600';
  }
  const hasHoliday = dayInfo?.events?.some((e) => e.type === 'holiday');
  if (dayInfo?.isToday && hasHoliday) {
    return 'bg-red-100 font-semibold text-red-800 ring-2 ring-teal dark:bg-red-950/60 dark:text-red-300';
  }
  if (dayInfo?.isToday) {
    return 'bg-teal font-semibold text-white ring-2 ring-teal/40';
  }
  const isWeekend = dayInfo?.isWeekend;
  const roster = dayInfo?.events?.find((e) => e.type === 'roster');

  if (hasHoliday) {
    return 'bg-red-100 font-medium text-red-800 dark:bg-red-950/60 dark:text-red-300';
  }
  if (roster?.status === 'WO' || isWeekend) {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200';
  }
  if (roster?.status === 'W') {
    return 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200';
  }
  return 'text-slate-700 dark:text-slate-300';
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
}) {
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
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={prev} aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-display text-center font-semibold text-navy dark:text-slate-100">
          {format(viewMonth, 'MMMM yyyy')}
        </p>
        <Button type="button" variant="ghost" onClick={next} aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 font-medium text-slate-400">
            {compact ? d[0] : d}
          </div>
        ))}
        {loading
          ? Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            ))
          : gridDays.map((date) => {
              const key = format(date, 'yyyy-MM-dd');
              const info = days[key];
              const selected = selectedDate && isSameDay(date, selectedDate);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDate?.(date, info)}
                  title={
                    info?.events?.map((e) => e.label).join(', ') ||
                    (info?.isWeekend ? 'Weekend' : '')
                  }
                  className={cn(
                    'aspect-square rounded text-xs transition hover:ring-1 hover:ring-teal/50',
                    dayStyle(info, date, viewMonth),
                    selected && 'ring-2 ring-navy dark:ring-teal',
                    !onSelectDate && 'cursor-default'
                  )}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-red-200 dark:bg-red-900" /> Holiday
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-amber-200 dark:bg-amber-900" /> Off / Weekend
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-emerald-100 dark:bg-emerald-900" /> Working
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-teal" /> Today
        </span>
      </div>
    </div>
  );
}
