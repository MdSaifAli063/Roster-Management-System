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
} from 'lucide-react';
import Button from '../components/ui/Button';
import { ThemeToggleButton } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Calendar className="h-8 w-8 text-teal" />
            <span className="font-display text-xl font-semibold text-navy dark:text-white">RosterPro</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <a href="#features" className="transition hover:text-teal">Features</a>
            <a href="#highlights" className="transition hover:text-teal">Overview</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            {user ? (
              <Link to={appPath}>
                <Button variant="teal">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/login">
                  <Button variant="teal">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="home" className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-dark px-4 py-20 text-white sm:px-6 sm:py-28">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-slate-200">
              <Shield className="h-4 w-4 text-teal" />
              Workforce roster & attendance platform
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Manage rosters, attendance & leave —{' '}
              <span className="text-teal">all in one place</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              RosterPro helps teams plan shifts, track real attendance, handle leave, and stay aligned
              with live notifications and an India-aware holiday calendar.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to={appPath}>
                <Button variant="teal" className="gap-2 px-6 py-3 text-base">
                  {user ? 'Go to dashboard' : 'Sign in to start'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  variant="secondary"
                  className="border-white/30 bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20"
                >
                  Explore features
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section id="highlights" className="border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
            {highlights.map((h) => (
              <div
                key={h.label}
                className="rounded-xl border border-slate-100 bg-slate-50 px-6 py-5 text-center dark:border-slate-800 dark:bg-slate-800/50"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{h.label}</p>
                <p className="mt-2 font-display text-lg font-semibold text-navy dark:text-white">{h.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold text-navy dark:text-white sm:text-4xl">
                Everything your team needs
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
                From HR admins to frontline employees — one consistent experience with the same navy & teal theme you use every day.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal transition group-hover:bg-teal group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-navy dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
                </article>
              ))}
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-navy/5 to-teal/5 px-8 py-10 dark:border-slate-800 dark:from-navy/20 dark:to-teal/10">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Building2 className="h-5 w-5 text-teal" />
                <span className="text-sm font-medium">Plant master</span>
              </div>
              <div className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-600" />
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <Clock className="h-5 w-5 text-teal" />
                <span className="text-sm font-medium">Shift patterns</span>
              </div>
              <div className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-600" />
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <CalendarCheck className="h-5 w-5 text-teal" />
                <span className="text-sm font-medium">Actual vs planned roster</span>
              </div>
            </div>

            <div className="mt-14 text-center">
              <Link to={appPath}>
                <Button variant="teal" className="gap-2 px-8 py-3 text-base">
                  {user ? 'Continue to your workspace' : 'Create account or sign in'}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} RosterPro — Roster, attendance & leave management.
      </footer>
    </div>
  );
}
