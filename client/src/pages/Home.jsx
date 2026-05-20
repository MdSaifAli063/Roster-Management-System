import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarCheck,
  Users,
  Plane,
  Bell,
  BarChart3,
  Building2,
  Clock,
  ArrowRight,
  Shield,
  Sparkles,
  Eye,
  Menu,
  X,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { ThemeToggleButton } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

const features = [
  { icon: Calendar, title: 'Roster planning', desc: 'Build weekly rosters by plant, shift, and employee — working days, weekly offs, and holidays.' },
  { icon: Eye, title: 'View roster', desc: 'Employees and managers see clear schedules — who works when, at a glance.' },
  { icon: CalendarCheck, title: 'Attendance', desc: 'Mark in/out, track punches, and compare planned vs actual attendance.' },
  { icon: Plane, title: 'Leave management', desc: 'Submit, approve, or reject leave with email and instant in-app alerts.' },
  { icon: Bell, title: 'Notifications', desc: 'Stay updated on leave, reassignment, and attendance events in real time.' },
  { icon: Sparkles, title: 'Holiday calendar', desc: 'Live public holidays and company holidays — India-aware calendar built in.' },
  { icon: Users, title: 'People & plants', desc: 'Employee master, plant locations, shifts, and shift patterns in one place.' },
  { icon: BarChart3, title: 'Reports', desc: 'Attendance summaries and roster insights for HR and operations teams.' },
];

const stats = [
  { value: '3', label: 'User roles', sub: 'Employee · HR · Training' },
  { value: '∞', label: 'Plants', sub: 'Multi-location support' },
  { value: 'Live', label: 'Alerts', sub: 'In-app + email' },
];

const perks = [
  'Plant master & shift patterns',
  'Actual vs planned roster',
  'PDF roster extraction',
  'Role-based access control',
];

export default function Home() {
  const { user } = useAuth();
  const appPath = user ? getHomePath() : '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'RosterPro — Roster, Attendance & Leave';
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const scrollTo = (id) => {
    closeMenu();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mesh-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={closeMenu}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-500/25">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="truncate font-display text-lg font-bold text-[var(--text-primary)] sm:text-xl">
              RosterPro
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {['features', 'highlights'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
              >
                {id === 'features' ? 'Features' : 'Overview'}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggleButton />
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <Button as={Link} to={appPath} variant="primary" className="min-h-10 px-4">
                  Open dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" className="min-h-10 px-3">
                    Sign in
                  </Button>
                  <Button as={Link} to="/login" variant="primary" className="min-h-10 px-4 btn-glow">
                    Get started
                  </Button>
                </>
              )}
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4 md:hidden animate-fade-up">
            <nav className="flex flex-col gap-1">
              {['features', 'highlights'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="rounded-lg px-3 py-3 text-left text-base font-medium text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"
                >
                  {id === 'features' ? 'Features' : 'Overview'}
                </button>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                {user ? (
                  <Button as={Link} to={appPath} onClick={closeMenu} variant="primary" className="min-h-11 w-full">
                    Open dashboard
                  </Button>
                ) : (
                  <>
                    <Button as={Link} to="/login" onClick={closeMenu} variant="outline" className="min-h-11 w-full">
                      Sign in
                    </Button>
                    <Button as={Link} to="/login" onClick={closeMenu} variant="primary" className="min-h-11 w-full btn-glow">
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          {/* Adaptive gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)',
            }}
          />
          {/* Glow orbs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/30" aria-hidden />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/20" aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/5 blur-3xl" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 md:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
              {/* Badge */}
              <div
                className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium sm:text-sm"
                style={{
                  background: 'var(--hero-badge-bg)',
                  borderColor: 'var(--hero-badge-border)',
                  color: 'var(--hero-badge-text)',
                }}
              >
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span>Workforce roster &amp; attendance platform</span>
              </div>

              {/* Headline */}
              <h1
                className="mt-6 font-display text-[1.875rem] font-extrabold leading-[1.12] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
                style={{ color: 'var(--hero-text)' }}
              >
                Manage rosters, attendance &amp; leave —{' '}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
                  all in one place
                </span>
              </h1>

              <p
                className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:mt-6 sm:text-lg md:text-xl"
                style={{ color: 'var(--hero-muted)' }}
              >
                RosterPro helps teams plan shifts, track real attendance, handle leave, and stay aligned
                with live notifications and an India-aware holiday calendar.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Button
                  as={Link}
                  to={appPath}
                  variant="primary"
                  className="min-h-12 w-full gap-2 px-6 text-base btn-glow sm:w-auto"
                >
                  {user ? 'Go to dashboard' : 'Sign in to start'}
                  <ArrowRight className="h-5 w-5 shrink-0" />
                </Button>
                <Button
                  type="button"
                  onClick={() => scrollTo('features')}
                  variant="outline"
                  className="min-h-12 w-full px-6 text-base sm:w-auto"
                >
                  Explore features
                </Button>
              </div>

              {/* Trust row */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm" style={{ color: 'var(--hero-muted)' }}>
                {['No credit card required', 'Role-based access', 'India holiday calendar'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero preview card — desktop only */}
            <div className="mx-auto mt-14 hidden max-w-4xl lg:block animate-fade-up">
              <div className="glass-card overflow-hidden shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5">
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-[var(--text-secondary)]">rosterpro.app/dashboard</span>
                </div>
                <div className="grid grid-cols-4 gap-3 p-4">
                  {[
                    { label: 'Employees', val: '248', color: 'border-l-blue-500' },
                    { label: 'On Roster', val: '186', color: 'border-l-emerald-500' },
                    { label: 'On Leave', val: '12', color: 'border-l-amber-500' },
                    { label: 'Holidays', val: '3', color: 'border-l-red-500' },
                  ].map((k) => (
                    <div key={k.label} className={cn('rounded-lg border border-[var(--border)] border-l-[3px] bg-[var(--bg-secondary)] p-3', k.color)}>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{k.label}</p>
                      <p className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">{k.val}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--border)] p-4">
                  <div className="flex gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                      <div
                        key={d}
                        className={cn(
                          'flex-1 rounded-md py-2 text-center text-[10px] font-medium',
                          i >= 5 ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section
          id="highlights"
          className="scroll-mt-16 border-y border-[var(--border)] bg-[var(--bg-secondary)] py-10 sm:py-12"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:gap-6 sm:px-6">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="glass-card p-6 text-center stagger-row"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="font-display text-3xl font-extrabold text-[var(--accent-primary)]">{s.value}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{s.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="scroll-mt-16 py-14 sm:py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">Features</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)] sm:text-3xl md:text-4xl">
                Everything your team needs
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                From HR admins to frontline employees — one consistent, professional experience across every device.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <article
                  key={title}
                  className="group glass-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/10 stagger-row sm:p-6"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{desc}</p>
                </article>
              ))}
            </div>

            {/* Perks bar */}
            <div className="mt-12 glass-card p-6 sm:mt-16 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-between">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
                  <span className="font-display font-semibold">Also included</span>
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {perks.map((p) => (
                    <span key={p} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {p}
                    </span>
                  ))}
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Building2 className="h-4 w-4 text-[var(--accent-primary)]" />
                    Plant master
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Clock className="h-4 w-4 text-[var(--accent-primary)]" />
                    Shift patterns
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CalendarCheck className="h-4 w-4 text-[var(--accent-primary)]" />
                    Actual vs planned
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center sm:mt-16">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                Ready to streamline your workforce?
              </h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                Sign in with your account or create one in seconds.
              </p>
              <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Button
                  as={Link}
                  to={appPath}
                  variant="primary"
                  className="min-h-12 w-full gap-2 px-8 text-base btn-glow sm:w-auto"
                >
                  {user ? 'Continue to workspace' : 'Create account or sign in'}
                  <ArrowRight className="h-5 w-5 shrink-0" />
                </Button>
              </div>
              <p className="mt-4 font-mono text-xs text-[var(--text-secondary)]">
                Demo: admin@roster.com / admin123
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-semibold text-[var(--text-primary)]">RosterPro</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
            © {new Date().getFullYear()} RosterPro — Roster, attendance &amp; leave management.
          </p>
        </div>
      </footer>
    </div>
  );
}
