import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export function ThemeToggleButton({ className }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--text-primary)] focus-ring',
        className
      )}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export function ThemeSelector({ className }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-sm font-medium transition-all duration-200',
            theme === id
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-blue-500/40'
          )}
        >
          <Icon className="h-6 w-6" />
          {label}
        </button>
      ))}
    </div>
  );
}
