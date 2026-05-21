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
  Menu,
  X,
  CheckCircle2,
  Send,
  FileText,
  Wallet,
  UserCog,
  Clock,
  Briefcase,
  Pencil,
  Download,
  Globe,
  Lock,
  Mail,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { ThemeToggleButton } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

const employerFeatures = [
  { icon: Pencil, title: 'Create & publish roster', desc: 'Build from previous period or blank. Publish with email + Excel/PDF to every employee.', accent: 'from-blue-500/20 to-cyan-500/10' },
  { icon: Clock, title: '15-min slots & breaks', desc: '09:00 – 17:00 | 30m | 7.5h on every cell. Auto-calculated hours minus break.', accent: 'from-emerald-500/20 to-teal-500/10' },
  { icon: UserCog, title: 'Staff hub', desc: 'Searchable directory, profiles, leave balances, and four-week roster history.', accent: 'from-violet-500/20 to-purple-500/10' },
  { icon: Plane, title: 'Leave approvals', desc: 'Approve or reject in one click. Auto-approve toggle locks roster as Leave.', accent: 'from-amber-500/20 to-orange-500/10' },
  { icon: Globe, title: 'Holiday import', desc: 'Nager public holidays by country. Mark paid/unpaid. PH badges on the grid.', accent: 'from-red-500/20 to-rose-500/10' },
  { icon: BarChart3, title: 'HR reports', desc: 'Hours, wages, combined & comparison reports — export Excel or PDF.', accent: 'from-indigo-500/20 to-blue-500/10' },
];

const employeeFeatures = [
  { icon: Eye, title: 'My roster', desc: 'Read-only published schedule with Leave and PH badges.' },
  { icon: Plane, title: 'Apply leave', desc: 'Annual, sick, or unpaid — with balances and reason.' },
  { icon: CalendarCheck, title: 'Attendance', desc: 'Mark in/out on working days from phone or desktop.' },
];

const tools = [
  { icon: FileText, title: 'PDF Extractor', desc: 'Invoice OCR pipeline — review fields, push to finance.', color: 'text-cyan-400' },
  { icon: Wallet, title: 'Finance Organiser', desc: 'Track suppliers, GST, due dates, and spend by category.', color: 'text-emerald-400' },
  { icon: Building2, title: 'Onboarding wizard', desc: '5-step setup: business, hours, pay rules, staff, holidays.', color: 'text-violet-400' },
];

const stats = [
  { value: '2', label: 'Role experiences', sub: 'Employer & employee portals' },
  { value: '15m', label: 'Time precision', sub: 'Roster grid increments' },
  { value: '1-click', label: 'Publish roster', sub: 'Email + Excel + PDF' },
];

const steps = [
  { n: '01', title: 'Set up your business', desc: 'Onboarding captures locations, shifts, pay rules, and holidays.' },
  { n: '02', title: 'Plan & publish', desc: 'Create rosters, edit cells, publish — employees get their schedule instantly.' },
  { n: '03', title: 'Run HR operations', desc: 'Leave, attendance, reports, invoices — one platform.' },
];

const trustPoints = [
  'Role-guarded routes (employer vs employee)',
  'Published roster badge & locked leave cells',
  'SMTP roster delivery with attachments',
  'India-aware + global holiday API',
];

function NavLink({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
    >
      {children}
    </button>
  );
}

function HeroMockup() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const cells = [
    '09:00 – 17:00 | 30m | 7.5h',
    'Leave',
    '09:00 – 17:00 | None | 8h',
    'PH',
    '09:00 – 14:00 | 15m | 4.75h',
  ];
  const cellStyles = [
    'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    'bg-violet-500/15 text-violet-300 ring-violet-500/30',
    'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    'bg-red-500/15 text-red-300 ring-red-500/30',
    'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  ];

  return (
    <div className="landing-perspective mx-auto mt-12 max-w-4xl px-2 sm:mt-16 lg:mt-20">
      <div className="relative">
        <div
          className="landing-glow-orb pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-r from-blue-500/20 via-cyan-500/15 to-violet-500/20 blur-2xl"
          aria-hidden
        />
        <div className="landing-orbit-ring pointer-events-none absolute -inset-4 rounded-[2rem] border border-dashed border-blue-500/20 opacity-60" aria-hidden />

        <div className="landing-3d-panel landing-float glass-card relative overflow-hidden shadow-2xl shadow-blue-500/20">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <span className="font-mono text-[10px] text-[var(--text-secondary)] sm:text-xs">View Roster · Published</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
              PUBLISHED
            </span>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">This week</p>
              {['Sarah K.', 'James M.', 'Priya R.'].map((name, i) => (
                <div
                  key={name}
                  className={cn(
                    'rounded-lg border border-[var(--border)] px-2 py-2 text-xs',
                    i === 0 && 'border-blue-500/40 bg-blue-500/10'
                  )}
                >
                  <p className="font-medium text-[var(--text-primary)]">{name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">EMP00{i + 1}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="grid min-w-[280px] grid-cols-[minmax(64px,1fr)_repeat(4,minmax(44px,1fr))] border-b border-[var(--border)] bg-[var(--bg-elevated)] text-center text-[10px] font-semibold text-[var(--text-secondary)]">
                <div className="p-2 text-left">Employee</div>
                {days.map((d) => (
                  <div key={d} className="p-2">{d}</div>
                ))}
              </div>
              <div className="grid min-w-[280px] grid-cols-[minmax(64px,1fr)_repeat(4,minmax(44px,1fr))] items-center gap-1 p-2">
                <div className="text-xs font-medium text-[var(--text-primary)]">Sarah K.</div>
                {cells.map((c, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded px-1 py-1.5 text-center font-mono text-[7px] leading-tight ring-1 sm:text-[8px]',
                      cellStyles[i]
                    )}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--bg-elevated)]/80 px-4 py-3">
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/15 px-2 py-1 text-[10px] text-blue-300">
                <Send className="h-3 w-3" /> Email sent
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-secondary)] px-2 py-1 text-[10px] text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                <Download className="h-3 w-3" /> .xlsx + .pdf
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--text-secondary)]">May 2026</span>
          </div>
        </div>

        <div className="landing-float-delayed absolute -right-2 top-8 hidden w-36 rounded-xl border border-[var(--border)] bg-[var(--glass-bg)] p-3 shadow-xl backdrop-blur-md sm:block lg:-right-8">
          <p className="text-[10px] font-semibold text-violet-300">Leave approved</p>
          <p className="mt-1 text-[9px] text-[var(--text-secondary)]">3 days → roster locked</p>
        </div>
        <div className="landing-float absolute -left-2 bottom-12 hidden w-32 rounded-xl border border-[var(--border)] bg-[var(--glass-bg)] p-3 shadow-xl backdrop-blur-md sm:block lg:-left-6">
          <p className="text-[10px] font-semibold text-emerald-300">Hours report</p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--text-primary)]">1,248h</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const appPath = user ? getHomePath(user.role) : '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'RosterPro — Workforce Roster, Leave & HR Operations';
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const scrollTo = (id) => {
    closeMenu();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navIds = [
    { id: 'platform', label: 'Platform' },
    { id: 'roles', label: 'Roles' },
    { id: 'features', label: 'Features' },
    { id: 'tools', label: 'Tools' },
  ];

  return (
    <div className="mesh-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={closeMenu}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="truncate font-display text-lg font-bold sm:text-xl">RosterPro</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            {navIds.map(({ id, label }) => (
              <NavLink key={id} onClick={() => scrollTo(id)}>{label}</NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggleButton />
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <Button as={Link} to={appPath} variant="primary" className="min-h-10 px-4 btn-glow">
                  Open workspace
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" className="min-h-10 px-3">Sign in</Button>
                  <Button as={Link} to="/login" variant="primary" className="min-h-10 px-4 btn-glow">
                    Start free
                  </Button>
                </>
              )}
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[var(--glass-hover)] md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4 md:hidden animate-fade-up">
            <nav className="flex flex-col gap-1">
              {navIds.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="rounded-lg px-3 py-3 text-left font-medium hover:bg-[var(--glass-hover)]"
                >
                  {label}
                </button>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                {user ? (
                  <Button as={Link} to={appPath} onClick={closeMenu} variant="primary" className="min-h-11 w-full">
                    Open workspace
                  </Button>
                ) : (
                  <>
                    <Button as={Link} to="/login" onClick={closeMenu} variant="outline" className="min-h-11 w-full">Sign in</Button>
                    <Button as={Link} to="/login" onClick={closeMenu} variant="primary" className="min-h-11 w-full btn-glow">Start free</Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, var(--hero-from) 0%, var(--hero-via) 45%, var(--hero-to) 100%)' }}
          />
          <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
              <div
                className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium sm:text-sm"
                style={{
                  background: 'var(--hero-badge-bg)',
                  borderColor: 'var(--hero-badge-border)',
                  color: 'var(--hero-badge-text)',
                }}
              >
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span>Built for HR, operations &amp; frontline teams</span>
              </div>

              <h1
                className="mt-6 font-display text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem]"
                style={{ color: 'var(--hero-text)' }}
              >
                The complete{' '}
                <span className="landing-gradient-text">workforce roster</span>
                {' '}platform HR teams trust
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg md:text-xl" style={{ color: 'var(--hero-muted)' }}>
                Plan shifts with 15-minute precision, publish rosters by email, approve leave, import holidays,
                and run hours &amp; wages reports — plus invoice PDF extraction and finance tracking.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Button as={Link} to={appPath} variant="primary" className="min-h-12 gap-2 px-8 text-base btn-glow sm:w-auto">
                  {user ? 'Go to workspace' : 'Get started — it\'s free'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button type="button" onClick={() => scrollTo('platform')} variant="outline" className="min-h-12 px-8 text-base sm:w-auto">
                  See how it works
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs sm:text-sm" style={{ color: 'var(--hero-muted)' }}>
                {trustPoints.map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <HeroMockup />
          </div>
        </section>

        {/* Stats */}
        <section id="platform" className="scroll-mt-20 border-y border-[var(--border)] bg-[var(--bg-secondary)] py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="landing-card-3d glass-card p-6 text-center stagger-row"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <p className="font-display text-3xl font-extrabold text-[var(--accent-primary)] md:text-4xl">{s.value}</p>
                  <p className="mt-1 font-semibold text-[var(--text-primary)]">{s.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual roles */}
        <section id="roles" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">Two experiences, one platform</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-4xl">
                Employer power. Employee clarity.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
                Separate sidebars, routes, and permissions — so HR sees everything and staff see only what they need.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="landing-card-3d glass-card overflow-hidden">
                <div className="border-b border-[var(--border)] bg-gradient-to-r from-blue-600/15 to-cyan-500/10 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/40">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">Employer portal</h3>
                      <p className="text-xs text-[var(--text-secondary)]">HR · Admin · Operations</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3 p-6 text-sm">
                  {['Create Roster', 'View & Publish Roster', 'Staff', 'Leave Approvals', 'Holidays', 'Reports', 'PDF Extractor', 'Finance', 'Settings'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                      <span className="text-[var(--text-primary)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="landing-card-3d glass-card overflow-hidden">
                <div className="border-b border-[var(--border)] bg-gradient-to-r from-emerald-600/15 to-teal-500/10 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/40">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">Employee portal</h3>
                      <p className="text-xs text-[var(--text-secondary)]">Frontline · Field · Office</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-4 p-6">
                  {employeeFeatures.map(({ icon: Icon, title, desc }) => (
                    <li key={title} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-secondary)] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">How teams get live in days</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.n} className="landing-card-3d glass-card relative p-6 stagger-row" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="font-display text-4xl font-extrabold text-blue-500/20 dark:text-blue-400/25">{step.n}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Employer features grid */}
        <section id="features" className="scroll-mt-20 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">Core capabilities</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl md:text-4xl">
                Everything HR asked for — delivered
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employerFeatures.map(({ icon: Icon, title, desc, accent }, i) => (
                <article
                  key={title}
                  className={cn('landing-card-3d glass-card group overflow-hidden p-6 stagger-row', `bg-gradient-to-br ${accent}`)}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] text-blue-600 shadow-md transition-transform duration-300 group-hover:scale-110 dark:text-blue-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Tools strip */}
        <section id="tools" className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--bg-secondary)] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">Beyond rostering</p>
                <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Operations toolkit</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1">
                  <Lock className="h-3 w-3" /> No LLM on PDFs
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1">
                  <Mail className="h-3 w-3" /> Inbound invoice email
                </span>
              </div>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {tools.map(({ icon: Icon, title, desc, color }, i) => (
                <div key={title} className="landing-card-3d glass-card p-6 stagger-row" style={{ animationDelay: `${i * 80}ms` }}>
                  <Icon className={cn('h-8 w-8', color)} />
                  <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 landing-card-3d rounded-2xl border border-[var(--border)] bg-gradient-to-r from-blue-600/10 via-transparent to-cyan-500/10 p-8 text-center sm:p-12">
              <Sparkles className="mx-auto h-8 w-8 text-[var(--accent-primary)]" />
              <h3 className="mt-4 font-display text-xl font-bold sm:text-2xl">
                Impress your HR team on day one
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)] sm:text-base">
                Guided onboarding, published roster badges, leave locked on the grid, and professional exports —
                the details that show you chose the right system.
              </p>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
                <Button as={Link} to={appPath} variant="primary" className="min-h-12 gap-2 px-8 btn-glow">
                  {user ? 'Continue to workspace' : 'Start your workspace'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button as={Link} to="/login" variant="outline" className="min-h-12 px-8">
                  View demo login
                </Button>
              </div>
              <p className="mt-5 font-mono text-xs text-[var(--text-secondary)]">
                Demo employer: admin@roster.com · admin123
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-display font-semibold">RosterPro</span>
              <p className="text-xs text-[var(--text-secondary)]">Roster · Leave · Attendance · Finance</p>
            </div>
          </div>
          <p className="text-center text-xs text-[var(--text-secondary)] sm:text-right">
            © {new Date().getFullYear()} RosterPro. Workforce management for modern HR.
          </p>
        </div>
      </footer>
    </div>
  );
}
