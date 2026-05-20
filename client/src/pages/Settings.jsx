import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/PageHeader';
import { ThemeSelector } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/client';

export default function Settings() {
  const location = useLocation();
  const { theme } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAllNotifications } = useNotifications();
  const [emailStatus, setEmailStatus] = useState('checking…');
  const [clearingNotifs, setClearingNotifs] = useState(false);

  useEffect(() => {
    api.get('/health').then(() => setEmailStatus('Configure SMTP on server (see DEPLOY.md)')).catch(() => setEmailStatus('API unreachable'));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle="Appearance and notification preferences"
      />

      <Card title="Appearance">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Current theme:{' '}
          <span className="font-medium capitalize text-[var(--text-primary)]">{theme}</span>
        </p>
        <ThemeSelector />
      </Card>

      <Card title="Notifications">
        <p className="text-sm text-[var(--text-secondary)]">
          In-app alerts appear in the bell icon (leave, attendance, reassignments). Email alerts fire on the same events when SMTP is configured.
        </p>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          You have <span className="font-medium text-[var(--text-primary)]">{notifications.length}</span> saved
          {unreadCount > 0 && (
            <> (<span className="font-medium text-[var(--accent-primary)]">{unreadCount} unread</span>)</>
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
              variant="danger"
              disabled={clearingNotifs}
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
        <p className="mt-4 text-xs text-[var(--text-secondary)]">{emailStatus}</p>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Set{' '}
          <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[var(--text-primary)]">
            EMAIL_ENABLED=true
          </code>{' '}
          and SMTP vars on the server.
        </p>
      </Card>
    </div>
  );
}
