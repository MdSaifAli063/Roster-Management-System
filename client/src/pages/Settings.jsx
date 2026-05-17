import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import api from '../api/client';

export default function Settings() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const [emailStatus, setEmailStatus] = useState('checking…');

  useEffect(() => {
    api.get('/health').then(() => setEmailStatus('Configure SMTP on server (see DEPLOY.md)')).catch(() => setEmailStatus('API unreachable'));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy dark:text-white">Settings</h1>
      <Card title="Profile">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd>{user?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{user?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd>{user?.role}</dd></div>
        </dl>
      </Card>
      <Card title="Appearance">
        <p className="mb-3 text-sm text-slate-500">Theme: {dark ? 'Dark' : 'Light'}</p>
        <Button variant="secondary" onClick={toggle}>Toggle Dark Mode</Button>
      </Card>
      <Card title="Notifications">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Email alerts fire on leave requests, reassignments, and attendance mismatches.
        </p>
        <p className="mt-2 text-xs text-slate-500">{emailStatus}</p>
        <p className="mt-2 text-xs text-slate-500">
          Set <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">EMAIL_ENABLED=true</code> and SMTP vars on the server.
        </p>
      </Card>
    </div>
  );
}
