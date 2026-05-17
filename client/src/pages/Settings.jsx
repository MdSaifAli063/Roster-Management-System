import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { ThemeSelector } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';

export default function Settings() {
  const { theme } = useTheme();
  const [emailStatus, setEmailStatus] = useState('checking…');

  useEffect(() => {
    api.get('/health').then(() => setEmailStatus('Configure SMTP on server (see DEPLOY.md)')).catch(() => setEmailStatus('API unreachable'));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Appearance and notifications</p>
      </div>

      <Card title="Appearance">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Current theme: <span className="font-medium capitalize text-slate-900 dark:text-slate-100">{theme}</span>
        </p>
        <ThemeSelector />
      </Card>

      <Card title="Notifications">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Email alerts fire on leave requests, reassignments, and attendance mismatches.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{emailStatus}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Set <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">EMAIL_ENABLED=true</code> and SMTP vars on the server.
        </p>
      </Card>
    </div>
  );
}
