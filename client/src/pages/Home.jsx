import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  Users,
  Plane,
  BarChart3,
  Building2,
  ArrowRight,
  Shield,
  Sparkles,
  Eye,
  CheckCircle2,
  Send,
  FileText,
  Wallet,
  UserCog,
  Clock,
  Pencil,
  Download,
  Globe,
  Lock,
  Mail,
  Zap,
  Target,
} from 'lucide-react';
import Button from '../components/ui/Button';
import LandingHeader from '../components/LandingHeader';
import { ThemeToggleButton } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

const employerFeatures = [
  { icon: Pencil, title: 'Create & publish roster', desc: 'Build from a previous period or blank. One-click publish with email, Excel, and PDF for every employee.', accent: 'from-blue-500/15 to-cyan-500/5' },
  { icon: Clock, title: '15-minute slots & breaks', desc: 'Precise cells like 09:00 – 17:00 | 30m | 7.5h. Hours auto-calculate after break deduction.', accent: 'from-emerald-500/15 to-teal-500/5' },
  { icon: UserCog, title: 'Staff hub', desc: 'Searchable directory, profiles, leave balances, and four-week roster history in one place.', accent: 'from-violet-500/15 to-purple-500/5' },
  { icon: Plane, title: 'Leave approvals', desc: 'Approve or reject in one click. Approved leave locks roster cells so HR stays accurate.', accent: 'from-amber-500/15 to-orange-500/5' },
  { icon: Globe, title: 'Holiday import', desc: 'Public holidays via Nager API by country. Mark paid or unpaid; PH badges appear on the grid.', accent: 'from-red-500/15 to-rose-500/5' },
  { icon: BarChart3, title: 'HR reports', desc: 'Hours, wages, combined, and period comparison — export to Excel or PDF for leadership.', accent: 'from-indigo-500/15 to-blue-500/5' },
];

const employeeFeatures = [
  { icon: Eye, title: 'My roster', desc: 'Read-only published schedule with leave and public holiday badges.' },
  { icon: Plane, title: 'Apply leave', desc: 'Annual, sick, or unpaid requests with balances and reason tracking.' },
  { icon: CalendarCheck, title: 'Attendance', desc: 'Mark in and out on working days from phone or desktop.' },
];

const tools = [
  { icon: FileText, title: 'PDF Extractor', desc: 'Invoice OCR pipeline — review fields and push to finance.', color: 'text-cyan-600 dark:text-cyan-400' },
  { icon: Wallet, title: 'Finance Organiser', desc: 'Suppliers, GST, due dates, and spend by category.', color: 'text-emerald-600 dark:text-emerald-400' },
  { icon: Building2, title: 'Onboarding wizard', desc: 'Five-step setup: business, hours, pay rules, staff, holidays.', color: 'text-violet-600 dark:text-violet-400' },
];

const stats = [
  { value: '2', label: 'Dedicated portals', sub: 'Employer & employee experiences', icon: Users },
  { value: '15m', label: 'Roster precision', sub: 'Quarter-hour scheduling grid', icon: Clock },
  { value: '1-click', label: 'Publish & notify', sub: 'Email + Excel + PDF delivery', icon: Send },
];

const steps = [
  { n: '01', title: 'Configure your business', desc: 'Onboarding captures locations, shifts, pay rules, and holiday calendars.' },
  { n: '02', title: 'Plan & publish rosters', desc: 'Create schedules, edit cells, publish — staff receive their official roster instantly.' },
  { n: '03', title: 'Run daily HR ops', desc: 'Leave, attendance, reports, and invoices in one professional workspace.' },
];

const trustColLeft = [
  'Role-based access for HR vs staff',
  'Published roster status on every period',
];

const trustColRight = [
  'Leave & PH locked on the grid',
  'SMTP delivery with attachments',
];

const valueProps = [
  { icon: Target, title: 'Built for HR teams', text: 'Clear workflows employers expect — not a generic calendar tool.' },
  { icon: Shield, title: 'Audit-ready rosters', text: 'Published badges, exports, and locked leave cells keep records clean.' },
  { icon: Zap, title: 'Fast to deploy', text: 'Guided onboarding gets your first roster live in days, not months.' },
];

function SectionIntro({ eyebrow, title, description, className }) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      {eyebrow && <p className="landing-eyebrow">{eyebrow}</p>}
      <h2 className={cn('landing-section-title mt-2 text-2xl sm:text-3xl lg:text-4xl', eyebrow && 'mt-2')}>
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base lg:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

function HeroMockup() {
  const days = ['Mon', 'Tue', 'Wed'];
  const rows = [
    {
      name: 'Sarah K.',
      cells: ['09:00 – 17:00 | 30m | 7.5h', 'Leave', 'PH'],
      styles: [
        'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
        'bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30',
        'bg-orange-500/12 text-orange-800 ring-orange-500/25 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/30',
      ],
    },
    {
      name: 'James M.',
      cells: ['09:00 – 18:00 | 45m | 8.25h', 'WO', '09:00 – 18:00 | 45m | 8.25h'],
      styles: [
        'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
        'bg-amber-500/12 text-amber-800 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
        'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
      ],
    },
  ];

  return (
    <div className="landing-hero-mockup relative w-full min-[1024px]:max-w-[30rem] min-[1024px]:shrink-0">
      <div className="landing-hero-scene relative w-full py-2 min-[1024px]:py-6">
        <div
          className="landing-glow-orb pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-cyan-500/12 to-violet-500/15 blur-3xl dark:from-blue-500/25 dark:to-violet-500/20"
          aria-hidden
        />
        <div
          className="landing-orbit-ring pointer-events-none absolute -inset-4 z-0 rounded-[1.85rem]"
          aria-hidden
        />

        <div className="landing-perspective relative z-10">
          <div className="landing-3d-panel landing-hero-3d landing-float landing-mockup-shell relative">
            <div className="landing-mockup-panel overflow-hidden rounded-2xl">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent dark:via-blue-400/35"
                aria-hidden
              />

              <div className="landing-mockup-toolbar flex items-center justify-between gap-2 border-b border-[var(--border)] bg-gradient-to-b from-slate-50 to-white px-4 py-3 dark:from-[var(--bg-elevated)] dark:to-[var(--bg-secondary)] sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex shrink-0 gap-1.5 rounded-md bg-black/[0.04] px-1.5 py-1 dark:bg-white/[0.06]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="truncate font-mono text-[10px] font-medium text-[var(--text-secondary)] sm:text-xs">
                    View Roster · Published
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Published
                </span>
              </div>

              <div className="landing-mockup-body bg-white dark:bg-[var(--bg-secondary)]">
              <div className="grid grid-cols-[minmax(76px,1fr)_repeat(3,minmax(68px,1fr))] border-b border-[var(--border)] bg-slate-50/80 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] dark:bg-[var(--bg-elevated)] lg:grid-cols-[minmax(80px,1fr)_repeat(3,minmax(72px,1fr))] lg:text-[11px]">
                <div className="px-2 py-2.5 text-left">Employee</div>
                {days.map((d) => (
                  <div key={d} className="px-1 py-2.5">
                    {d}
                  </div>
                ))}
              </div>
              {rows.map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[minmax(76px,1fr)_repeat(3,minmax(68px,1fr))] items-center border-b border-[var(--border)] last:border-b-0 lg:grid-cols-[minmax(80px,1fr)_repeat(3,minmax(72px,1fr))]"
                >
                  <div className="px-2 py-2.5">
                    <p className="text-xs font-medium text-[var(--text-primary)]">{row.name}</p>
                  </div>
                  {row.cells.map((c, i) => (
                    <div key={i} className="p-1.5">
                      <div
                        className={cn(
                          'rounded-md px-1 py-2 text-center font-mono text-[7px] leading-tight shadow-sm ring-1 lg:px-1.5 lg:py-2.5 lg:text-[9px]',
                          row.styles[i]
                        )}
                      >
                        {c}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-slate-50/60 px-4 py-3 dark:bg-[var(--bg-elevated)] sm:px-5">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-300">
                    <Send className="h-3 w-3" /> Email sent
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-secondary)] px-2 py-1 text-[10px] text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                    <Download className="h-3 w-3" /> .xlsx + .pdf
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">May 2026</span>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-float-card landing-float-card--leave pointer-events-none absolute -right-2 top-2 z-20 hidden w-[8.75rem] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_12px_32px_-6px_rgba(59,130,246,0.2),0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-[var(--border)] dark:bg-[var(--bg-elevated)]/95 min-[1024px]:block min-[1024px]:-right-7 min-[1024px]:top-4">
          <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">Leave approved</p>
          <p className="mt-1 text-[9px] leading-snug text-[var(--text-secondary)]">3 days locked on roster</p>
        </div>
        <div className="landing-float-card landing-float-card--hours pointer-events-none absolute -left-2 bottom-6 z-20 hidden w-[7.75rem] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_12px_32px_-6px_rgba(16,185,129,0.18),0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-[var(--border)] dark:bg-[var(--bg-elevated)]/95 min-[1024px]:block min-[1024px]:-left-7 min-[1024px]:bottom-10">
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Hours report</p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--text-primary)]">1,248h</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const appPath = user ? getHomePath(user.role) : '/login?mode=signup';

  useEffect(() => {
    document.title = 'RosterPro — Workforce Roster, Leave & HR Operations';
  }, []);

  const navIds = [
    { id: 'platform', label: 'Platform' },
    { id: 'roles', label: 'Roles' },
    { id: 'features', label: 'Features' },
    { id: 'tools', label: 'Tools' },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mesh-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <LandingHeader active="home" />

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="landing-hero-section relative overflow-hidden lg:overflow-visible">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(165deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)' }}
          />
          <div className="pointer-events-none absolute -right-32 top-0 h-[28rem] w-[28rem] rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/25" aria-hidden />
          <div className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/20" aria-hidden />

          <div className="landing-container relative py-12 sm:py-16 min-[1024px]:py-14">
            <div className="flex flex-col gap-10 min-[1024px]:grid min-[1024px]:grid-cols-[minmax(0,520px)_minmax(0,1fr)] min-[1024px]:items-center min-[1024px]:gap-10 xl:grid-cols-[minmax(0,540px)_minmax(0,1fr)] xl:gap-14">
              <div className="w-full text-left min-[1024px]:max-w-[520px]">
                <div
                  className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold sm:text-sm"
                  style={{
                    background: 'var(--hero-badge-bg)',
                    borderColor: 'var(--hero-badge-border)',
                    color: 'var(--hero-badge-text)',
                  }}
                >
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>Workforce roster platform for HR &amp; operations</span>
                </div>

                <h1 className="mt-6 font-display text-[1.85rem] font-extrabold leading-[1.12] tracking-tight sm:text-4xl min-[1024px]:text-[2.5rem] min-[1024px]:leading-[1.1] xl:text-[2.625rem]">
                  <span className="block" style={{ color: 'var(--hero-text)' }}>
                    Plan rosters.
                  </span>
                  <span className="mt-1 block text-blue-600 dark:text-blue-400">
                    Publish with confidence.
                  </span>
                </h1>

                <p
                  className="mt-5 max-w-xl text-base leading-relaxed min-[1024px]:max-w-[28rem] min-[1024px]:text-[1.0625rem] min-[1024px]:leading-[1.65]"
                  style={{ color: 'var(--hero-muted)' }}
                >
                  One platform for shift planning, leave, holidays, attendance, and HR reports — with separate
                  employer and employee portals your team will actually use.
                </p>

                <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-start">
                  <Button as={Link} to={appPath} variant="primary" className="min-h-11 gap-2 px-7 text-[0.9375rem] btn-glow sm:w-auto min-[1024px]:min-h-11">
                    {user ? 'Go to workspace' : 'Get started'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => scrollTo('platform')}
                    variant="outline"
                    className="min-h-11 border-[var(--border)] bg-white px-7 text-[0.9375rem] sm:w-auto dark:bg-[var(--bg-secondary)]/60"
                  >
                    See the platform
                  </Button>
                </div>

                <div className="mt-8 grid max-w-md grid-cols-1 gap-4 min-[1024px]:max-w-[26rem] min-[1024px]:grid-cols-2 min-[1024px]:gap-x-6 min-[1024px]:gap-y-3">
                  <ul className="space-y-3">
                    {trustColLeft.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-left text-xs sm:text-sm" style={{ color: 'var(--hero-muted)' }}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3">
                    {trustColRight.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-left text-xs sm:text-sm" style={{ color: 'var(--hero-muted)' }}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mx-auto w-full max-w-md min-[1024px]:mx-0 min-[1024px]:max-w-none min-[1024px]:justify-self-end min-[1024px]:pl-4">
                <HeroMockup />
              </div>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3 lg:mt-20">
              {valueProps.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/80 p-4 backdrop-blur-sm dark:bg-[var(--bg-secondary)]/50 sm:p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-display text-sm font-bold text-[var(--text-primary)] sm:text-base">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="platform" className="landing-section-alt scroll-mt-24 border-y border-[var(--border)] py-12 sm:py-16 lg:py-20">
          <div className="landing-container">
            <SectionIntro
              eyebrow="At a glance"
              title="Numbers HR leaders care about"
              description="Precision scheduling, dual portals, and professional publish workflows — out of the box."
              className="mb-10 lg:mb-12"
            />
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-8">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="landing-card-3d glass-card flex flex-col items-center p-6 text-center sm:p-8 lg:items-start lg:text-left stagger-row"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-3xl font-extrabold text-[var(--accent-primary)] lg:text-4xl">{s.value}</p>
                  <p className="mt-1 font-semibold text-[var(--text-primary)]">{s.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual roles */}
        <section id="roles" className="scroll-mt-24 py-14 sm:py-20 lg:py-24">
          <div className="landing-container">
            <SectionIntro
              eyebrow="Two experiences, one platform"
              title="Employer power. Employee clarity."
              description="Separate navigation, permissions, and views — HR sees the full picture; staff see only their schedule and requests."
              className="mb-10 lg:mb-14"
            />

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <article className="landing-card-3d glass-card flex h-full flex-col overflow-hidden">
                <div className="border-b border-[var(--border)] bg-gradient-to-r from-blue-600/10 to-cyan-500/5 px-6 py-5 dark:from-blue-600/20 dark:to-cyan-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold lg:text-xl">Employer portal</h3>
                      <p className="text-xs text-[var(--text-secondary)] sm:text-sm">HR · Admin · Operations</p>
                    </div>
                  </div>
                </div>
                <ul className="flex flex-1 flex-col justify-center gap-2.5 p-6 text-sm sm:grid sm:grid-cols-2 sm:gap-3 lg:p-8">
                  {['Create Roster', 'View & Publish', 'Staff directory', 'Leave approvals', 'Holidays', 'Reports', 'PDF Extractor', 'Finance', 'Settings'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="text-[var(--text-primary)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="landing-card-3d glass-card flex h-full flex-col overflow-hidden">
                <div className="border-b border-[var(--border)] bg-gradient-to-r from-emerald-600/10 to-teal-500/5 px-6 py-5 dark:from-emerald-600/20 dark:to-teal-500/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold lg:text-xl">Employee portal</h3>
                      <p className="text-xs text-[var(--text-secondary)] sm:text-sm">Frontline · Field · Office</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4 p-6 lg:p-8">
                  {employeeFeatures.map(({ icon: Icon, title, desc }) => (
                    <li key={title} className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="landing-section-alt border-y border-[var(--border)] py-14 sm:py-20 lg:py-24">
          <div className="landing-container">
            <SectionIntro
              eyebrow="Implementation"
              title="Live in days, not months"
              description="A guided path from business setup to published rosters and daily HR operations."
              className="mb-10 lg:mb-14"
            />
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {steps.map((step, i) => (
                <div
                  key={step.n}
                  className="landing-card-3d glass-card relative p-6 sm:p-8 stagger-row"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="font-display text-4xl font-extrabold text-blue-600/15 dark:text-blue-400/20 lg:text-5xl">
                    {step.n}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-semibold lg:text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 py-14 sm:py-20 lg:py-24">
          <div className="landing-container">
            <SectionIntro
              eyebrow="Core capabilities"
              title="Everything HR asked for — in one place"
              description="Rostering, leave, holidays, and reporting designed for workforce teams — not bolted onto a generic tool."
              className="mb-10 lg:mb-14"
            />

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {employerFeatures.map(({ icon: Icon, title, desc, accent }, i) => (
                <article
                  key={title}
                  className={cn(
                    'landing-card-3d glass-card group flex flex-col overflow-hidden p-6 sm:p-7 stagger-row',
                    `bg-gradient-to-br ${accent}`
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] text-blue-600 shadow-sm ring-1 ring-[var(--border)] transition-transform duration-300 group-hover:scale-105 dark:text-blue-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Tools + CTA */}
        <section id="tools" className="landing-section-alt scroll-mt-24 border-t border-[var(--border)] py-14 sm:py-20 lg:py-24">
          <div className="landing-container">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionIntro
                eyebrow="Beyond rostering"
                title="Operations toolkit included"
                description="Invoice extraction and finance tracking for teams that want roster and back-office in one stack."
                className="mb-0 lg:mx-0 lg:max-w-xl lg:text-left"
              />
              <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                  <Lock className="h-3.5 w-3.5 shrink-0" /> Deterministic PDF parsing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> Inbound invoice email
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12 lg:gap-6">
              {tools.map(({ icon: Icon, title, desc, color }, i) => (
                <div key={title} className="landing-card-3d glass-card p-6 sm:p-7 stagger-row" style={{ animationDelay: `${i * 80}ms` }}>
                  <Icon className={cn('h-8 w-8', color)} />
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
                </div>
              ))}
            </div>

            <div className="landing-card-3d mt-12 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-blue-600/8 via-[var(--bg-secondary)] to-cyan-500/8 p-8 text-center sm:p-10 lg:mt-16 lg:p-14 dark:from-blue-600/15 dark:to-cyan-500/10">
              <Sparkles className="mx-auto h-8 w-8 text-[var(--accent-primary)]" />
              <h3 className="mt-4 font-display text-xl font-bold sm:text-2xl lg:text-3xl">
                Ready to impress your HR team?
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                Published roster badges, locked leave cells, professional exports, and a polished employee experience —
                the details that prove you chose the right system.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Button as={Link} to={appPath} variant="primary" className="min-h-12 gap-2 px-8 btn-glow">
                  {user ? 'Continue to workspace' : 'Start your workspace'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button as={Link} to="/login" variant="outline" className="min-h-12 border-[var(--border)] px-8">
                  Sign in
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-secondary)] py-10">
        <div className="landing-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold">RosterPro</span>
              <p className="text-xs text-[var(--text-secondary)]">Roster · Leave · Attendance · Finance</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-[var(--text-secondary)] sm:justify-end">
            {navIds.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => scrollTo(id)} className="hover:text-[var(--accent-primary)]">
                {label}
              </button>
            ))}
            <Link to="/pricing" className="hover:text-[var(--accent-primary)]">
              Pricing
            </Link>
            <Link to="/login" className="hover:text-[var(--accent-primary)]">
              Sign in
            </Link>
          </nav>
          <p className="text-center text-xs text-[var(--text-secondary)] sm:col-span-full sm:text-left lg:text-right">
            © {new Date().getFullYear()} RosterPro. Workforce management for modern HR teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
