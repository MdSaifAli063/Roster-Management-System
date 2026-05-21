import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/PageHeader';
import { ThemeSelector } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isEmployer } from '../lib/auth';
import { Toggle } from '../components/ui/Input';

export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();
  const { notifications, unreadCount, markAllRead, clearAllNotifications } = useNotifications();
  const [emailStatus, setEmailStatus] = useState('checking…');
  const [clearingNotifs, setClearingNotifs] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    api.get('/health').then(() => setEmailStatus('Configure SMTP on server (see DEPLOY.md)')).catch(() => setEmailStatus('API unreachable'));
    if (isEmployer(user?.role)) {
      api.get('/settings').then((r) => setAutoApprove(!!r.data.auto_approve_leave)).catch(() => setAutoApprove(false));
    }
  }, [user?.role]);

  const saveAutoApprove = async (val) => {
    setAutoApprove(val);
    await api.patch('/settings', { auto_approve_leave: val });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle={
          isEmployer(user?.role)
            ? 'Appearance, leave rules, and notifications'
            : 'Theme and notification preferences'
        }
      />

      <Card title="Appearance">
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Current theme:{' '}
          <span className="font-medium capitalize text-[var(--text-primary)]">{theme}</span>
        </p>
        <ThemeSelector />
      </Card>

      {isEmployer(user?.role) && (
        <Card title="Leave management">
          <Toggle
            label="Auto-approve leave requests"
            checked={autoApprove}
            onChange={saveAutoApprove}
          />
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            When enabled, new leave requests are approved automatically and roster cells are marked as Leave.
          </p>
        </Card>
      )}

      <Card title="Notifications">
        <p className="text-sm text-[var(--text-secondary)]">
          {isEmployer(user?.role)
            ? 'In-app alerts appear in the bell icon (leave, attendance, reassignments). Email alerts fire when SMTP is configured.'
            : 'You receive alerts when your leave is approved or rejected, and when your roster is published.'}
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
