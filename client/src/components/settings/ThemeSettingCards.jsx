import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

const OPTIONS = [
  { id: 'light', label: 'Light Mode', icon: Sun },
  { id: 'dark', label: 'Dark Mode', icon: Moon },
  { id: 'system', label: 'System Default', icon: Laptop },
];

function MiniPreview({ variant }) {
  const isDark = variant === 'dark';
  return (
    <div
      className={cn(
        'mt-3 rounded-lg border p-2',
        isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
      )}
    >
      <div className={cn('mb-2 h-2 w-8 rounded', isDark ? 'bg-slate-600' : 'bg-slate-200')} />
      <div className="flex gap-1">
        <div className={cn('h-8 flex-1 rounded', isDark ? 'bg-slate-700' : 'bg-white')} />
        <div className={cn('h-8 w-6 rounded', isDark ? 'bg-slate-600' : 'bg-slate-100')} />
      </div>
    </div>
  );
}

export default function ThemeSettingCards() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={cn(
            'rounded-2xl border-2 p-5 text-left transition',
            theme === id
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
              : 'border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-500/40'
          )}
        >
          <Icon className={cn('h-6 w-6', theme === id ? 'text-blue-600' : 'text-slate-400')} />
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
          <MiniPreview variant={id === 'system' ? 'light' : id} />
        </button>
      ))}
    </div>
  );
}
