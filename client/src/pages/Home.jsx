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
} from 'lucide-react';
import Button from '../components/ui/Button';
import LandingHeader from '../components/LandingHeader';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

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

function MiniDashboard() {
  return (
    <div className="landing-mockup-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500">Dashboard</span>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">Live</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        {[
          { label: 'Attendance', val: '89%', color: 'text-blue-600' },
          { label: 'On roster', val: '126', color: 'text-slate-900 dark:text-white' },
          { label: 'Leave pending', val: '8', color: 'text-amber-600' },
          { label: 'Published', val: 'Week 20', color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-[10px] text-slate-500">{s.label}</p>
            <p className={cn('font-display text-lg font-bold', s.color)}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-4 flex h-16 items-end gap-1 rounded-lg bg-slate-50 px-2 pb-2 dark:bg-slate-800/50">
        {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-blue-500/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function MiniRoster() {
  const days = ['Mon', 'Tue', 'Wed'];
  return (
    <div className="landing-mockup-card overflow-hidden text-[10px]">
      <div className="border-b border-slate-100 px-3 py-2 font-semibold text-slate-600 dark:border-slate-800">View Schedule</div>
      <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 text-center text-[9px] font-semibold uppercase text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="p-2 text-left">Staff</div>
        {days.map((d) => (
          <div key={d} className="p-2">{d}</div>
        ))}
      </div>
      {['Sarah K.', 'James M.'].map((name, ri) => (
        <div key={name} className="grid grid-cols-4 border-b border-slate-50 last:border-0 dark:border-slate-800">
          <div className="p-2 font-medium text-slate-700 dark:text-slate-200">{name}</div>
          {ri === 0
            ? ['bg-emerald-100 text-emerald-800', 'bg-violet-100 text-violet-800', 'bg-orange-100 text-orange-800'].map((c, i) => (
                <div key={i} className="p-1">
                  <span className={cn('block rounded px-1 py-1.5 text-center font-mono text-[8px]', c)}>{i === 0 ? '9–5' : i === 1 ? 'Leave' : 'PH'}</span>
                </div>
              ))
            : ['bg-emerald-100 text-emerald-800', 'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-800'].map((c, i) => (
                <div key={i} className="p-1">
                  <span className={cn('block rounded px-1 py-1.5 text-center font-mono text-[8px]', c)}>{i === 1 ? 'WO' : '9–6'}</span>
                </div>
              ))}
        </div>
      ))}
    </div>
  );
}

function MiniMobile() {
  return (
    <div className="landing-mockup-card w-[9.5rem] overflow-hidden">
      <div className="bg-blue-600 px-3 py-2 text-center text-[10px] font-semibold text-white">My Attendance</div>
      <div className="space-y-2 p-3">
        <div className="rounded-lg bg-emerald-50 p-2 text-center dark:bg-emerald-500/10">
          <p className="text-[9px] text-slate-500">Checked in</p>
          <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">07:32 AM</p>
        </div>
        <button type="button" className="w-full rounded-lg bg-blue-600 py-1.5 text-[10px] font-semibold text-white">Mark out</button>
      </div>
    </div>
  );
}

function HeroCollage() {
  return (
    <div className="landing-collage w-full">
      <div className="landing-collage-main landing-float">
        <MiniDashboard />
      </div>
      <div className="landing-collage-float landing-float-card--leave right-0 top-0 hidden w-[11rem] p-3 lg:block lg:-right-4 lg:top-2">
        <MiniRoster />
      </div>
      <div className="landing-collage-float landing-float-card--hours bottom-4 left-0 hidden lg:block lg:-left-6 lg:bottom-8">
        <MiniMobile />
      </div>
    </div>
  );
}

function SplitSection({ id, reverse, eyebrow, title, description, linkLabel, linkTo, onLinkClick, visual }) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-16 sm:py-20 lg:py-28', id && '')}>
      <div className="landing-container">
        <div className={cn('grid items-center gap-10 lg:grid-cols-2 lg:gap-16', reverse && 'lg:[&>*:first-child]:order-2')}>
          <div className={cn('max-w-xl', reverse ? 'lg:justify-self-end' : '')}>
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
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-white text-slate-900 dark:bg-[var(--bg-primary)] dark:text-[var(--text-primary)]">
      <LandingHeader active="home" />

      <main className="flex-1">
        {/* Hero */}
        <section className="landing-hero-airtable relative overflow-hidden">
          <div className="landing-container py-14 sm:py-16 lg:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10 xl:gap-16">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                  <Sparkles className="h-4 w-4" />
                  See what&apos;s new in RosterPro
                </div>

                <h1 className="mt-6 font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                  Roster management.
                  <span className="mt-1 block text-blue-600 dark:text-blue-400">Redefined.</span>
                </h1>

                <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
                  Manage your entire workforce — scheduling, leave, attendance, and HR reports — on one intuitive
                  platform built for employers and employees.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button as={Link} to={appPath} variant="primary" className="min-h-12 rounded-lg px-8 text-base font-semibold">
                    {user ? 'Go to workspace' : 'Sign up for free'}
                  </Button>
                  <Button as={Link} to="/pricing" variant="outline" className="min-h-12 rounded-lg border-slate-300 px-8 text-base dark:border-slate-600">
                    Contact sales
                  </Button>
                </div>

                <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                  {['Dual employer & employee portals', 'Publish rosters in one click', 'Leave locked on the grid', 'Professional exports'].map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <HeroCollage />
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="landing-logo-cloud py-10 sm:py-12">
          <div className="landing-container text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Built for shift-based teams</p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 dark:text-slate-400">
              RosterPro fits any operation that plans rosters, tracks leave, and marks attendance — not generic desk jobs.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {INDUSTRIES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <Icon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Platform power */}
        <SplitSection
          id="platform"
          eyebrow="The platform"
          title="Operationalize your workforce data on one connected system"
          description="RosterPro unifies shift planning, leave workflows, attendance punches, and HR reporting — so HR teams stop juggling spreadsheets, email threads, and disconnected tools."
          linkLabel="Explore the platform"
          onLinkClick={() => scrollTo('features')}
          visual={
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-violet-500/10 blur-2xl" aria-hidden />
              <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-slate-900 dark:text-white">Connected HR stack</p>
                    <p className="text-sm text-slate-500">Roster → Leave → Attendance → Reports</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {['Create & publish weekly rosters', 'Approve leave with roster lock', 'Track attendance vs plan', 'Export leadership-ready reports'].map((step, i) => (
                    <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{i + 1}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{step}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        {/* Ease of use */}
        <SplitSection
          reverse
          eyebrow="Scheduling"
          title="Simple to build. Intuitive to use."
          description="HR managers create rosters from a timeline editor with 15-minute slots, break rules, and one-click publish. Employees see a clean read-only schedule — no training manual required."
          linkLabel="Explore the scheduler"
          linkTo={appPath}
          visual={
            <div className="mx-auto w-full max-w-lg">
              <MiniRoster />
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <Send className="h-3.5 w-3.5" /> Email + PDF on publish
                </span>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">15-min grid</span>
              </div>
            </div>
          }
        />

        {/* Solutions — dual portals */}
        <section id="roles" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-20 lg:py-24">
          <div className="landing-container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="landing-eyebrow">Solutions</p>
              <h2 className="landing-split-title mt-2">Two portals. One source of truth.</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Separate navigation and permissions — HR sees everything; staff see only what they need.</p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">Employer portal</h3>
                <p className="mt-1 text-sm text-slate-500">HR · Admin · Operations</p>
                <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {['Create & publish rosters', 'Staff directory & leave', 'Attendance overview', 'Reports & exports'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">Employee portal</h3>
                <p className="mt-1 text-sm text-slate-500">Frontline · Field · Office</p>
                <ul className="mt-5 space-y-3">
                  {employeeFeatures.map(({ icon: Icon, title, desc }) => (
                    <li key={title} className="flex gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
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

        {/* Features grid */}
        <section id="features" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
          <div className="landing-container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="landing-eyebrow">Features</p>
              <h2 className="landing-split-title mt-2">Everything HR asked for</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Rostering, leave, holidays, and reporting — not bolted onto a generic calendar.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {employerFeatures.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Flexibility + CTA */}
        <section id="tools" className="scroll-mt-24 border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40 sm:py-20">
          <div className="landing-container">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <h2 className="landing-split-title">No matter your workflow, RosterPro adapts to how your team works.</h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400">From five-person field crews to multi-site operations — configure sites, shifts, holidays, and pay rules during onboarding.</p>
              </div>
              <div>
                <h2 className="landing-split-title">Start with rostering. Grow into full HR operations.</h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400">Add PDF invoice extraction and finance tracking when you need back-office tools in the same stack.</p>
              </div>
            </div>

            <div className="mt-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-12 text-center text-white sm:px-12 sm:py-14">
              <h3 className="font-display text-2xl font-bold sm:text-3xl">Ready to transform your workforce operations?</h3>
              <p className="mx-auto mt-3 max-w-xl text-blue-100">Join teams using RosterPro for published rosters, locked leave cells, and a polished employee experience.</p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <Button as={Link} to={appPath} className="min-h-12 rounded-lg bg-white px-8 text-base font-semibold text-blue-700 hover:bg-blue-50">
                  {user ? 'Continue to workspace' : 'Sign up for free'}
                </Button>
                <Button as={Link} to="/login" variant="outline" className="min-h-12 rounded-lg border-white/40 bg-transparent px-8 text-base text-white hover:bg-white/10">
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-[var(--bg-secondary)]">
        <div className="landing-container flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo variant="full" size="lg" />
            <p className="mt-3 max-w-xs text-sm text-slate-500">Workforce roster, leave, and attendance for modern HR teams.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
            <button type="button" onClick={() => scrollTo('platform')} className="hover:text-blue-600">Platform</button>
            <button type="button" onClick={() => scrollTo('features')} className="hover:text-blue-600">Features</button>
            <Link to="/pricing" className="hover:text-blue-600">Pricing</Link>
            <Link to="/login" className="hover:text-blue-600">Sign in</Link>
          </nav>
        </div>
        <p className="landing-container mt-8 text-xs text-slate-400">© {new Date().getFullYear()} RosterPro. All rights reserved.</p>
      </footer>
    </div>
  );
}
