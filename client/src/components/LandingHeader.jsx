import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import Logo from './Logo';
import { ThemeToggleButton } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';

const NAV_LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'features', label: 'Features' },
  { id: 'roles', label: 'Solutions' },
  { id: 'tools', label: 'Resources' },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingHeader({ active = 'home' }) {
  const { user } = useAuth();
  const appPath = user ? getHomePath(user.role) : '/login?mode=signup';
  const signInPath = '/login';
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = active === 'home';

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const goSection = (id) => {
    closeMenu();
    if (isHome) scrollToSection(id);
    else window.location.href = `/#${id}`;
  };

  return (
    <>
      <div className="landing-announcement">
        <Link to="/pricing" className="landing-announcement-link">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>New: Professional trial with full roster, leave &amp; attendance tools</span>
          <span className="font-semibold underline-offset-2 hover:underline">See plans →</span>
        </Link>
      </div>

      <header className="landing-header sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-xl">
        <div className="landing-container flex h-16 items-center justify-between gap-3 lg:h-[4.5rem]">
          <Logo linkTo="/" onClick={closeMenu} variant="full" size="md" />

          <nav className="hidden items-center gap-1 text-sm font-medium lg:flex">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => goSection(id)}
                className="inline-flex items-center gap-0.5 rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                {label}
                {(id === 'features' || id === 'tools') && <ChevronDown className="h-3.5 w-3.5 opacity-50" />}
              </button>
            ))}
            {active !== 'pricing' && (
              <Link
                to="/pricing"
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Pricing
              </Link>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggleButton className="hidden sm:flex" />
            <div className="hidden items-center gap-2 md:flex">
              {!user && (
                <Button as={Link} to={signInPath} variant="ghost" className="min-h-10 px-3 font-medium">
                  Sign in
                </Button>
              )}
              <Button as={Link} to={appPath} variant="primary" className="min-h-10 rounded-lg px-5 font-semibold">
                {user ? 'Open workspace' : 'Sign up for free'}
              </Button>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[var(--border)] bg-white px-4 py-4 dark:bg-[var(--bg-secondary)] lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goSection(id)}
                  className="rounded-lg px-3 py-3 text-left font-medium hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  {label}
                </button>
              ))}
              {active !== 'pricing' && (
                <Link to="/pricing" onClick={closeMenu} className="rounded-lg px-3 py-3 font-medium hover:bg-slate-50 dark:hover:bg-white/5">
                  Pricing
                </Link>
              )}
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
                {!user && (
                  <Button as={Link} to={signInPath} onClick={closeMenu} variant="outline" className="min-h-11 w-full">
                    Sign in
                  </Button>
                )}
                <Button as={Link} to={appPath} onClick={closeMenu} variant="primary" className="min-h-11 w-full">
                  {user ? 'Open workspace' : 'Sign up for free'}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
