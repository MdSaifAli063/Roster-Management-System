import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value = useMemo(
    () => ({
      toast,
      success: (m) => toast(m, 'success'),
      error: (m) => toast(m, 'error'),
      info: (m) => toast(m, 'info'),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto animate-scale-in glass-card flex items-start gap-3 px-4 py-3 shadow-xl',
                t.type === 'success' && 'border-l-2 border-l-emerald-500',
                t.type === 'error' && 'border-l-2 border-l-red-500',
                t.type === 'info' && 'border-l-2 border-l-blue-500'
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.type === 'success' && 'text-emerald-400', t.type === 'error' && 'text-red-400', t.type === 'info' && 'text-blue-400')} />
              <p className="flex-1 text-sm text-[var(--text-primary)]">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
