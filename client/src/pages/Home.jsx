import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Users,
  Plane,
  BarChart3,
  ArrowRight,
  Sparkles,
  Eye,
  CheckCircle2,
  Send,
  Pencil,
  Clock,
  LayoutDashboard,
  ChevronRight,
  Stethoscope,
  ShoppingBag,
  UtensilsCrossed,
  HardHat,
  Shield,
  Truck,
  Zap,
} from 'lucide-react';
import Button from '../components/ui/Button';
import LandingHeader from '../components/LandingHeader';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

const HERO_STATS = [
  { value: '2', label: 'Dedicated portals', sub: 'Employer & employee' },
  { value: '15m', label: 'Scheduling grid', sub: 'Quarter-hour precision' },
  { value: '1-click', label: 'Roster publish', sub: 'Email, Excel & PDF' },
];

const STEPS = [
  { n: '01', title: 'Set up your business', desc: 'Sites, shifts, holidays, and pay rules in a guided onboarding flow.' },
  { n: '02', title: 'Plan & publish', desc: 'Build rosters on a timeline editor and notify every employee instantly.' },
  { n: '03', title: 'Run daily HR ops', desc: 'Leave, attendance, reports, and finance — all in one workspace.' },
];

const INDUSTRIES = [
  { icon: Stethoscope, label: 'Healthcare & aged care' },
  { icon: UtensilsCrossed, label: 'Hospitality & venues' },
  { icon: ShoppingBag, label: 'Retail & stores' },
  { icon: HardHat, label: 'Construction & trades' },
  { icon: Shield, label: 'Security & guarding' },
  { icon: Truck, label: 'Field & mobile teams' },
];

const employerFeatures = [
  { icon: Pencil, title: 'Create & publish roster', desc: 'Build from a previous period or blank. One-click publish with email, Excel, and PDF.' },
  { icon: Clock, title: '15-minute precision', desc: 'Shift cells with breaks and auto-calculated hours — built for real workforce rules.' },
  { icon: Plane, title: 'Leave approvals', desc: 'Approve or reject in one click. Approved leave locks roster cells automatically.' },
  { icon: BarChart3, title: 'HR reports', desc: 'Hours, wages, comparisons, and attendance summaries — export to Excel or PDF.' },
  { icon: CalendarCheck, title: 'Attendance tracking', desc: 'Employer overview with rates, log hours, and roster comparison.' },
  { icon: Users, title: 'Staff directory', desc: 'Searchable profiles, leave balances, and roster history in one hub.' },
];

const employeeFeatures = [
  { icon: Eye, title: 'My roster', desc: 'Read-only published schedule with leave and holiday badges.' },
  { icon: Plane, title: 'Apply leave', desc: 'Annual, sick, or unpaid requests with balance tracking.' },
  { icon: CalendarCheck, title: 'Mark attendance', desc: 'Punch in and out from phone or desktop on working days.' },
];

function WindowChrome({ title }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/90 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/80">
      <div className="landing-window-dots flex gap-1.5">
        <span className="bg-[#ff5f57]" />
        <span className="bg-[#febc2e]" />
        <span className="bg-[#28c840]" />
      </div>
      <span className="truncate text-[11px] font-medium text-slate-500">{title}</span>
    </div>
  );
}

function MiniDashboard() {
  return (
    <div className="landing-mockup-card overflow-hidden">
      <WindowChrome title="RosterPro — Dashboard" />
      <div className="grid grid-cols-2 gap-2.5 p-4">
        {[
          { label: 'Attendance', val: '89%', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'On roster', val: '126', color: 'text-slate-900 dark:text-white', bg: 'bg-slate-50 dark:bg-slate-800/50' },
          { label: 'Leave pending', val: '8', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Published', val: 'Week 20', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-3', s.bg)}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={cn('mt-0.5 font-display text-xl font-bold', s.color)}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 flex h-[4.5rem] items-end gap-1.5 rounded-xl bg-gradient-to-t from-blue-50 to-slate-50 px-2 pb-2 pt-4 dark:from-blue-950/30 dark:to-slate-800/50">
        {[35, 55, 45, 70, 60, 85, 72].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-blue-400 to-blue-300"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniRoster({ large }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu'];
  return (
    <div className={cn('landing-mockup-card overflow-hidden text-[10px]', large && 'text-[11px]')}>
      <WindowChrome title="View Schedule · Published" />
      <div className="grid grid-cols-[minmax(4rem,1fr)_repeat(4,minmax(2.5rem,1fr))] border-b border-slate-100 bg-slate-50 text-center text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="p-2 text-left">Staff</div>
        {days.map((d) => (
          <div key={d} className="p-2">{d}</div>
        ))}
      </div>
      {['Sarah K.', 'James M.', 'Aisha R.'].slice(0, large ? 3 : 2).map((name, ri) => (
        <div key={name} className="grid grid-cols-[minmax(4rem,1fr)_repeat(4,minmax(2.5rem,1fr))] border-b border-slate-50 last:border-0 dark:border-slate-800">
          <div className="p-2 font-medium text-slate-700 dark:text-slate-200">{name}</div>
          {(ri === 0
            ? ['9–5', 'Leave', 'PH', '9–5']
            : ri === 1
              ? ['9–6', 'WO', '9–6', '9–6']
              : ['PH', '9–5', '9–5', 'Leave']
          ).map((cell, i) => {
            const styles =
              cell === 'Leave' ? 'bg-violet-100 text-violet-800' :
              cell === 'PH' ? 'bg-orange-100 text-orange-800' :
              cell === 'WO' ? 'bg-amber-100 text-amber-800' :
              'bg-emerald-100 text-emerald-800';
            return (
              <div key={i} className="p-1">
                <span className={cn('block rounded-md px-1 py-1.5 text-center font-mono text-[8px] font-medium', styles, large && 'text-[9px]')}>{cell}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HeroCollage() {
  return (
    <div className="landing-collage w-full">
      <div className="landing-hero-glow absolute -right-8 top-1/4 h-48 w-48 bg-blue-400/30 lg:h-64 lg:w-64" aria-hidden />
      <div className="landing-hero-glow absolute bottom-0 left-0 h-40 w-40 bg-cyan-400/20" aria-hidden />
      <div className="landing-collage-main landing-float-soft">
        <MiniDashboard />
      </div>
      <div className="landing-collage-float landing-float-soft-delay right-0 top-0 hidden w-[12.5rem] lg:block lg:-right-6 lg:top-4">
        <MiniRoster />
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, className }) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      {eyebrow && <p className="landing-eyebrow">{eyebrow}</p>}
      <h2 className="landing-split-title mt-2">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:text-lg">{description}</p>}
    </div>
  );
}

function SplitSection({ id, reverse, eyebrow, title, description, linkLabel, linkTo, onLinkClick, visual }) {
  return (
    <section id={id} className="scroll-mt-24 py-16 sm:py-20 lg:py-28">
      <div className="landing-container">
        <div className={cn('grid items-center gap-10 lg:grid-cols-2 lg:gap-16', reverse && 'lg:[&>*:first-child]:order-2')}>
          <div className={cn('max-w-xl', reverse && 'lg:justify-self-end')}>
            {eyebrow && <p className="landing-eyebrow">{eyebrow}</p>}
            <h2 className="landing-split-title mt-3">{title}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:text-lg">{description}</p>
            {linkLabel && (
              linkTo ? (
                <Link to={linkTo} className="landing-link-arrow mt-6">
                  {linkLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button type="button" onClick={onLinkClick} className="landing-link-arrow mt-6">
                  {linkLabel} <ArrowRight className="h-4 w-4" />
                </button>
              )
            )}
          </div>
          <div className="min-w-0">{visual}</div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const appPath = user ? getHomePath(user.role) : '/login?mode=signup';

  useEffect(() => {
    document.title = 'RosterPro — Workforce Roster, Leave & HR Operations';
    const hash = window.location.hash?.replace(/^#/, '');
    if (hash) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="landing-page flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden text-slate-900 dark:text-[var(--text-primary)]">
      <LandingHeader active="home" />

      <main className="flex-1">
        {/* Hero */}
        <section className="landing-hero-airtable relative overflow-hidden">
          <div className="landing-hero-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="landing-container relative py-16 sm:py-20 lg:py-24">
            <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-12 xl:gap-20">
              <div className="max-w-xl animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm backdrop-blur dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Workforce platform for modern HR teams
                </div>

                <h1 className="mt-6 font-display text-[2.125rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                  Roster management.
                  <span className="mt-2 block landing-gradient-text">Redefined.</span>
                </h1>

                <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
                  Plan shifts, approve leave, track attendance, and export HR reports — with separate employer and
                  employee portals your whole team will love.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button as={Link} to={appPath} variant="primary" className="landing-btn-primary min-h-12 rounded-xl px-8 text-base font-semibold">
                    {user ? 'Go to workspace' : 'Sign up for free'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button as={Link} to="/pricing" variant="outline" className="min-h-12 rounded-xl border-slate-300 bg-white/80 px-8 text-base backdrop-blur dark:border-slate-600 dark:bg-slate-900/50">
                    View pricing
                  </Button>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {HERO_STATS.map((s) => (
                    <div key={s.label} className="landing-stat-chip px-4 py-3 text-center sm:text-left">
                      <p className="font-display text-2xl font-extrabold text-blue-500 dark:text-blue-400">{s.value}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">{s.label}</p>
                      <p className="text-[10px] text-slate-500">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              <HeroCollage />
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="landing-logo-cloud py-12 sm:py-14">
          <div className="landing-container text-center">
            <SectionHeader
              eyebrow="Industries"
              title="Built for shift-based teams"
              description="Any operation that plans rosters, tracks leave, and marks attendance — not generic desk jobs."
              className="mb-10"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              {INDUSTRIES.map(({ icon: Icon, label }) => (
                <span key={label} className="landing-industry-pill inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950/50 sm:py-20">
          <div className="landing-container">
            <SectionHeader eyebrow="How it works" title="Live in days, not months" className="mb-12" />
            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step) => (
                <article key={step.n} className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 sm:p-8">
                  <p className="landing-step-num">{step.n}</p>
                  <h3 className="mt-2 font-display text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SplitSection
          id="platform"
          eyebrow="The platform"
          title="Operationalize your workforce on one connected system"
          description="RosterPro unifies shift planning, leave workflows, attendance punches, and HR reporting — so HR teams stop juggling spreadsheets and disconnected tools."
          linkLabel="Explore features"
          onLinkClick={() => scrollTo('features')}
          visual={
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-violet-500/10 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 text-white dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display font-bold">Connected HR stack</p>
                      <p className="text-sm text-blue-100">Roster → Leave → Attendance → Reports</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5 p-5">
                  {['Create & publish weekly rosters', 'Approve leave with roster lock', 'Track attendance vs plan', 'Export leadership-ready reports'].map((step, i) => (
                    <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-500/30">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/30">{i + 1}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{step}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        <SplitSection
          reverse
          eyebrow="Scheduling"
          title="Simple to build. Intuitive to use."
          description="HR managers create rosters from a timeline editor with 15-minute slots, break rules, and one-click publish. Employees see a clean read-only schedule — no training manual required."
          linkLabel="Explore the scheduler"
          linkTo={appPath}
          visual={
            <div className="mx-auto w-full max-w-lg">
              <MiniRoster large />
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/25">
                  <Send className="h-3.5 w-3.5" /> Email + PDF on publish
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">15-min grid</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">Leave & PH badges</span>
              </div>
            </div>
          }
        />

        <section id="roles" className="scroll-mt-24 bg-gradient-to-b from-slate-50 to-white py-16 dark:from-slate-900/40 dark:to-[var(--bg-primary)] sm:py-20 lg:py-24">
          <div className="landing-container">
            <SectionHeader
              eyebrow="Solutions"
              title="Two portals. One source of truth."
              description="Separate navigation and permissions — HR sees everything; staff see only what they need."
              className="mb-12"
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="landing-portal-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8" style={{ '--portal-accent': '#2563eb' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">Employer portal</h3>
                <p className="mt-1 text-sm text-slate-500">HR · Admin · Operations</p>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {['Create & publish rosters', 'Staff directory & leave', 'Attendance overview', 'Reports & exports'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="landing-portal-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8" style={{ '--portal-accent': '#059669' }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">Employee portal</h3>
                <p className="mt-1 text-sm text-slate-500">Frontline · Field · Office</p>
                <ul className="mt-6 space-y-3">
                  {employeeFeatures.map(({ icon: Icon, title, desc }) => (
                    <li key={title} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
          <div className="landing-container">
            <SectionHeader
              eyebrow="Features"
              title="Everything HR asked for"
              description="Rostering, leave, holidays, and reporting — purpose-built for workforce teams."
              className="mb-12"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {employerFeatures.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="landing-feature-card group rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 transition group-hover:from-blue-600 group-hover:to-cyan-500 group-hover:text-white dark:from-blue-500/15 dark:to-cyan-500/10 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-24 border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-20">
          <div className="landing-container">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <Zap className="h-8 w-8 text-blue-600" />
                <h2 className="landing-split-title mt-4 text-2xl">Adapt to how your team works</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400">From five-person field crews to multi-site operations — configure sites, shifts, holidays, and pay rules during onboarding.</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <BarChart3 className="h-8 w-8 text-cyan-600" />
                <h2 className="landing-split-title mt-4 text-2xl">Grow into full HR operations</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400">Add PDF invoice extraction and finance tracking when you need back-office tools in the same stack.</p>
              </article>
            </div>

            <div className="landing-cta-panel relative mt-14 overflow-hidden rounded-3xl px-8 py-14 text-center sm:px-12 sm:py-16">
              <div className="relative z-10">
                <h3 className="font-display text-2xl font-bold text-white sm:text-4xl">Ready to transform workforce operations?</h3>
                <p className="mx-auto mt-4 max-w-xl text-base text-blue-100">Published rosters, locked leave cells, attendance insights, and a polished employee experience — start free today.</p>
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                  <Button as={Link} to={appPath} className="min-h-12 rounded-xl bg-white px-8 text-base font-semibold text-blue-600 shadow-xl hover:bg-blue-50">
                    {user ? 'Continue to workspace' : 'Sign up for free'}
                  </Button>
                  <Button as={Link} to="/login" variant="outline" className="min-h-12 rounded-xl border-white/50 bg-white/10 px-8 text-base text-white backdrop-blur hover:bg-white/20">
                    Sign in
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-[var(--bg-secondary)]">
        <div className="landing-container grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <Logo variant="full" size="lg" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              RosterPro helps HR teams plan shifts, manage leave, track attendance, and export reports — with dedicated employer and employee experiences.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product</p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600 dark:text-slate-400">
              <button type="button" onClick={() => scrollTo('platform')} className="text-left hover:text-blue-600">Platform</button>
              <button type="button" onClick={() => scrollTo('features')} className="text-left hover:text-blue-600">Features</button>
              <button type="button" onClick={() => scrollTo('roles')} className="text-left hover:text-blue-600">Solutions</button>
              <Link to="/pricing" className="hover:text-blue-600">Pricing</Link>
            </nav>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Get started</p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm text-slate-600 dark:text-slate-400">
              <Link to={appPath} className="hover:text-blue-600">{user ? 'Open workspace' : 'Sign up free'}</Link>
              <Link to="/login" className="hover:text-blue-600">Sign in</Link>
              <Link to="/help" className="hover:text-blue-600">Help center</Link>
            </nav>
          </div>
        </div>
        <p className="landing-container mt-10 border-t border-slate-100 pt-8 text-xs text-slate-400 dark:border-slate-800">
          © {new Date().getFullYear()} RosterPro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
