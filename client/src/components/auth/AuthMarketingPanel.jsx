import { useEffect, useState } from 'react';
import { CalendarDays, Users, Palmtree, BarChart3, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

const SLIDES = [
  {
    title: 'Your all-in-one roster solution',
    subtitle:
      'From shift planning to attendance and leave — one dashboard built for modern HR teams.',
    cards: 'roster',
  },
  {
    title: 'Schedule smarter, not harder',
    subtitle:
      'Create rosters, track hours, and keep every team aligned with real-time updates.',
    cards: 'schedule',
  },
  {
    title: 'Insights that drive decisions',
    subtitle:
      'Reports, finance tools, and holiday planning — run operations with confidence.',
    cards: 'insights',
  },
];

const STAGE_CLASS = 'relative mx-auto h-[240px] w-full max-w-[440px]';

function MiniCard({ className, children }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/30 bg-white p-4 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.45)]',
        className
      )}
    >
      {children}
    </div>
  );
}

function RosterPreview() {
  return (
    <div className={STAGE_CLASS}>
      <MiniCard className="absolute left-0 top-3 z-10 w-[62%] -rotate-3">
        <p className="text-xs font-semibold text-slate-500">Today&apos;s roster</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-800">
          <li className="flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="truncate">Morning shift — 8 staff</span>
          </li>
          <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">Leave requests (2)</span>
          </li>
        </ul>
      </MiniCard>
      <MiniCard className="absolute bottom-2 right-0 w-[54%] rotate-2">
        <p className="text-xs font-semibold text-slate-500">Attendance today</p>
        <p className="mt-2 text-3xl font-bold text-blue-600">94%</p>
        <p className="text-xs text-slate-500">On-time check-ins</p>
      </MiniCard>
    </div>
  );
}

function SchedulePreview() {
  return (
    <div className={STAGE_CLASS}>
      <MiniCard className="absolute right-0 top-2 z-10 w-[46%] rotate-2">
        <p className="text-xs font-semibold text-slate-500">Leave balance</p>
        <p className="mt-2 text-2xl font-bold text-emerald-600">12 days</p>
        <p className="text-xs text-slate-500">Avg. per employee</p>
      </MiniCard>
      <MiniCard className="absolute bottom-0 left-0 w-[72%] -rotate-1">
        <p className="text-xs font-semibold text-slate-500">Weekly hours</p>
        <div className="mt-4 flex h-[72px] items-end gap-1.5">
          {[48, 72, 58, 88, 76, 52, 38].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-sky-400"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </MiniCard>
    </div>
  );
}

function InsightsPreview() {
  return (
    <div className={cn(STAGE_CLASS, 'grid grid-cols-2 gap-3 content-center')}>
      <MiniCard>
        <Users className="h-5 w-5 text-blue-600" />
        <p className="mt-2 text-xs text-slate-500">Active staff</p>
        <p className="text-2xl font-bold text-slate-900">128</p>
      </MiniCard>
      <MiniCard>
        <Palmtree className="h-5 w-5 text-amber-500" />
        <p className="mt-2 text-xs text-slate-500">Pending leave</p>
        <p className="text-2xl font-bold text-slate-900">7</p>
      </MiniCard>
      <MiniCard className="col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Roster compliance</p>
            <p className="text-3xl font-bold text-blue-600">91%</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <BarChart3 className="h-7 w-7 text-blue-500" />
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

const CARD_MAP = {
  roster: RosterPreview,
  schedule: SchedulePreview,
  insights: InsightsPreview,
};

export default function AuthMarketingPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];
  const Cards = CARD_MAP[slide.cards];

  return (
    <div className="relative hidden h-dvh max-h-dvh min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 lg:flex">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(255,255,255,0.2),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_85%,rgba(6,182,212,0.4),transparent_50%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-10 py-10 xl:px-14 xl:py-12">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <Cards />
        </div>

        <div className="mt-auto max-w-lg shrink-0 pb-2">
          <h2 className="font-display text-2xl font-bold leading-tight text-white xl:text-3xl">
            {slide.title}
          </h2>
          <p className="mt-3 min-h-[2.75rem] text-sm leading-relaxed text-blue-50/90 xl:text-base">
            {slide.subtitle}
          </p>
          <div className="mt-5 flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
