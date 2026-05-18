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
} from 'lucide-react';
import Button from '../components/ui/Button';
import { ThemeToggleButton } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

const features = [
  {
    icon: Calendar,
    title: 'Roster planning',
    desc: 'Build and manage weekly rosters by plant, shift, and employee with working days, weekly offs, and holidays.',
  },
  {
    icon: Eye,
    title: 'View roster',
    desc: 'Employees and managers see clear schedules — who works when, at a glance.',
  },
  {
    icon: CalendarCheck,
    title: 'Attendance',
    desc: 'Mark in and mark out, track daily punches, and compare planned vs actual attendance.',
  },
  {
    icon: Plane,
    title: 'Leave management',
    desc: 'Submit, approve, or reject leave requests with email and instant in-app alerts.',
  },
  {
    icon: Bell,
    title: 'Real-time notifications',
    desc: 'Stay updated on leave, reassignment, and attendance events as they happen.',
  },
  {
    icon: Sparkles,
    title: 'India holiday calendar',
    desc: 'Live public holidays and company holidays on a real calendar — never miss a festival or national day.',
  },
  {
    icon: Users,
    title: 'People & plants',
    desc: 'Employee master, plant locations, shifts, and shift patterns in one place.',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    desc: 'Attendance summaries and roster insights for HR and operations teams.',
  },
];

const highlights = [
  { label: 'Roles', value: 'Employee · HR · Training' },
  { label: 'Plants', value: 'Multi-location' },
  { label: 'Alerts', value: 'Live + email' },
];

export default function Home() {
  const { user } = useAuth();
  const appPath = user ? getHomePath() : '/login';
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const scrollTo = (id) => {
    closeMenu();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex min-w-0 shrink items-center gap-2" onClick={closeMenu}>
            <Calendar className="h-7 w-7 shrink-0 text-teal sm:h-8 sm:w-8" />
            <span className="truncate font-display text-lg font-semibold text-navy dark:text-white sm:text-xl">
              RosterPro
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex lg:gap-8 dark:text-slate-300">
            <button type="button" onClick={() => scrollTo('features')} className="transition hover:text-teal">
              Features
            </button>
            <button type="button" onClick={() => scrollTo('highlights')} className="transition hover:text-teal">
              Overview
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggleButton />
            <div className="hidden items-center gap-2 sm:flex">
              {user ? (
                <Button as={Link} to={appPath} variant="teal" className="min-h-10 whitespace-nowrap px-3 text-sm sm:px-4">
                  Open dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" className="min-h-10 px-3 text-sm">
                    Sign in
                  </Button>
                  <Button as={Link} to="/login" variant="teal" className="min-h-10 px-3 text-sm sm:px-4">
                    Get started
                  </Button>
                </>
              )}
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            'border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900',
            menuOpen ? 'block' : 'hidden'
          )}
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="rounded-lg px-3 py-3 text-left text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollTo('highlights')}
              className="rounded-lg px-3 py-3 text-left text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Overview
            </button>
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              {user ? (
                <Button as={Link} to={appPath} onClick={closeMenu} variant="teal" className="min-h-11 w-full">
                  Open dashboard
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" onClick={closeMenu} variant="secondary" className="min-h-11 w-full">
                    Sign in
                  </Button>
                  <Button as={Link} to={appPath} onClick={closeMenu} variant="teal" className="min-h-11 w-full">
                    Get started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="home" className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-dark px-4 py-12 text-white sm:px-6 sm:py-20 md:py-28">
          <div
            className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-teal/20 blur-3xl sm:h-96 sm:w-96"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl sm:h-80 sm:w-80"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl">
            <p className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-slate-200 sm:px-4 sm:text-sm">
              <Shield className="h-3.5 w-3.5 shrink-0 text-teal sm:h-4 sm:w-4" />
              <span>Workforce roster & attendance platform</span>
            </p>
            <h1 className="mt-5 font-display text-[1.75rem] font-bold leading-[1.15] tracking-tight sm:mt-6 sm:text-4xl sm:leading-tight md:text-5xl lg:text-6xl">
              Manage rosters, attendance & leave —{' '}
              <span className="text-teal">all in one place</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:mt-6 sm:text-lg">
              RosterPro helps teams plan shifts, track real attendance, handle leave, and stay aligned
              with live notifications and an India-aware holiday calendar.
            </p>
            <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap sm:mt-10 sm:gap-4">
              <Button
                as={Link}
                to={appPath}
                variant="teal"
                className="min-h-11 w-full gap-2 px-5 py-3 text-base sm:w-auto"
              >
                <span className="truncate">{user ? 'Go to dashboard' : 'Sign in to start'}</span>
                <ArrowRight className="h-5 w-5 shrink-0" />
              </Button>
              <Button
                type="button"
                onClick={() => scrollTo('features')}
                variant="secondary"
                className="min-h-11 w-full border-white/30 bg-white/10 px-5 py-3 text-base text-white hover:bg-white/20 sm:w-auto"
              >
                Explore features
              </Button>
            </div>
          </div>
        </section>

        <section
          id="highlights"
          className="scroll-mt-14 border-b border-slate-200 bg-white py-10 sm:scroll-mt-16 sm:py-12 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:gap-6 sm:px-6">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 text-center sm:px-6 sm:py-5 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{h.label}</p>
                <p className="mt-2 font-display text-base font-semibold text-navy sm:text-lg dark:text-white">
                  {h.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-14 py-12 sm:scroll-mt-16 sm:py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl md:text-4xl dark:text-white">
                Everything your team needs
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-400">
                From HR admins to frontline employees — one consistent experience with the same navy & teal
                theme you use every day.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal/40 hover:shadow-md sm:p-6 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal transition group-hover:bg-teal group-hover:text-white sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold text-navy sm:mt-4 sm:text-lg dark:text-white">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-stretch gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-navy/5 to-teal/5 px-5 py-6 sm:mt-16 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-6 sm:px-8 sm:py-10 dark:border-slate-800 dark:from-navy/20 dark:to-teal/10">
              <div className="flex items-center justify-center gap-3 text-slate-600 sm:justify-start dark:text-slate-300">
                <Building2 className="h-5 w-5 shrink-0 text-teal" />
                <span className="text-sm font-medium">Plant master</span>
              </div>
              <div className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-600" />
              <div className="flex items-center justify-center gap-3 text-slate-600 sm:justify-start dark:text-slate-300">
                <Clock className="h-5 w-5 shrink-0 text-teal" />
                <span className="text-sm font-medium">Shift patterns</span>
              </div>
              <div className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-600" />
              <div className="flex items-center justify-center gap-3 text-slate-600 sm:justify-start dark:text-slate-300">
                <CalendarCheck className="h-5 w-5 shrink-0 text-teal" />
                <span className="text-sm font-medium text-center sm:text-left">Actual vs planned roster</span>
              </div>
            </div>

            <div className="mt-10 px-2 text-center sm:mt-14">
              <Button
                as={Link}
                to={appPath}
                variant="teal"
                className="min-h-11 w-full max-w-md gap-2 px-6 py-3 text-base sm:w-auto sm:px-8"
              >
                <span className="line-clamp-2 sm:line-clamp-none">
                  {user ? 'Continue to your workspace' : 'Create account or sign in'}
                </span>
                <ArrowRight className="h-5 w-5 shrink-0" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs leading-relaxed text-slate-500 sm:text-sm dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} RosterPro — Roster, attendance & leave management.
      </footer>
    </div>
  );
}
