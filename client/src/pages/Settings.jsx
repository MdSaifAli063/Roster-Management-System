import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ThemeSelector } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/client';

export default function Settings() {
  const { theme } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAllNotifications } = useNotifications();
  const [emailStatus, setEmailStatus] = useState('checking…');
  const [clearingNotifs, setClearingNotifs] = useState(false);

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
          In-app alerts appear in the bell icon (leave, attendance, reassignments). Email alerts fire on the same events when SMTP is configured.
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          You have <span className="font-medium text-navy dark:text-white">{notifications.length}</span> saved
          {unreadCount > 0 && (
            <> (<span className="font-medium text-teal">{unreadCount} unread</span>)</>
          )}
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button type="button" variant="secondary" onClick={() => markAllRead()}>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              disabled={clearingNotifs}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={async () => {
                setClearingNotifs(true);
                try {
                  await clearAllNotifications();
                } finally {
                  setClearingNotifs(false);
                }
              }}
            >
              {clearingNotifs ? 'Clearing…' : 'Clear all notifications'}
            </Button>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{emailStatus}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Set <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">EMAIL_ENABLED=true</code> and SMTP vars on the server.
        </p>
      </Card>
    </div>
  );
}
