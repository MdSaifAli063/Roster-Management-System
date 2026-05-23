import { Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SidebarQuickSearch({ collapsed, onOpen, className }) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn('sidebar-icon-btn mx-auto flex h-10 w-10 items-center justify-center rounded-xl', className)}
        aria-label="Quick search"
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition',
        'border-slate-200/80 bg-white/60 text-slate-500 hover:border-blue-300 hover:bg-white hover:text-slate-700',
        'dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-blue-500/40',
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">Search anything here…</span>
      <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-slate-600">
        ⌘K
      </kbd>
    </button>
  );
}
