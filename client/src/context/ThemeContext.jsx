import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveTheme(mode) {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode === 'dark' ? 'dark' : 'light';
}

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  return 'light';
}

function applyResolved(mode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyResolved(theme);
    if (theme !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyResolved('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (mode) => {
    if (mode === 'dark' || mode === 'light' || mode === 'system') setThemeState(mode);
  };

  const resolved = resolveTheme(theme);
  const toggle = () => setThemeState((t) => (resolveTheme(t) === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolved,
        dark: resolved === 'dark',
        setTheme,
        toggle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
