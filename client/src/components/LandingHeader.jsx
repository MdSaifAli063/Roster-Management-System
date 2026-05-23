import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Button from './ui/Button';
import Logo from './Logo';
import { ThemeToggleButton } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getHomePath } from '../lib/auth';
import { cn } from '../lib/utils';

const SECTION_LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'roles', label: 'Roles' },
  { id: 'features', label: 'Features' },
  { id: 'tools', label: 'Tools' },
];

function SectionNavButton({ id, label, onNavigate, className }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      className={cn(
        'rounded-md px-1 py-0.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]',
        className
      )}
    >
      {label}
    </button>
  );
}

/** Shared marketing header — same logo/branding as Home */
export default function LandingHeader({ active = 'home' }) {
  const { user } = useAuth();
  const appPath = user ? getHomePath(user.role) : '/login';
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
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header className="landing-header sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-xl">
      <div className="landing-container flex h-16 items-center justify-between gap-3 sm:h-[4.75rem]">
        <Logo linkTo="/" onClick={closeMenu} variant="full" size="md" />

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {SECTION_LINKS.map(({ id, label }) => (
            <SectionNavButton key={id} id={id} label={label} onNavigate={goSection} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggleButton />
          <div className="hidden items-center gap-2 sm:flex">
            {active !== 'pricing' && (
              <Button as={Link} to="/pricing" variant="ghost" className="min-h-10 px-3">
                Pricing
              </Button>
            )}
            {user ? (
              <Button as={Link} to={appPath} variant="primary" className="min-h-10 px-4 btn-glow">
                Open workspace
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" className="min-h-10 px-3">
                  Sign in
                </Button>
                <Button as={Link} to="/login" variant="primary" className="min-h-10 px-4 btn-glow">
                  Start
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
            {SECTION_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => goSection(id)}
                className="rounded-lg px-3 py-3 text-left font-medium hover:bg-[var(--glass-hover)]"
              >
                {label}
              </button>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-4">
              {active !== 'pricing' && (
                <Button as={Link} to="/pricing" onClick={closeMenu} variant="outline" className="min-h-11 w-full">
                  Pricing
                </Button>
              )}
              {user ? (
                <Button as={Link} to={appPath} onClick={closeMenu} variant="primary" className="min-h-11 w-full">
                  Open workspace
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/login" onClick={closeMenu} variant="outline" className="min-h-11 w-full">
                    Sign in
                  </Button>
                  <Button as={Link} to="/login" onClick={closeMenu} variant="primary" className="min-h-11 w-full btn-glow">
                    Start
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
