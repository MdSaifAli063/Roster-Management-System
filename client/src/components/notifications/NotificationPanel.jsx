import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { isEmployer } from '../../lib/auth';
import { NOTIFICATION_TABS, filterNotificationsByTab } from '../../lib/notifications';
import NotificationItem from './NotificationItem';

export default function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onRefresh,
  listMaxH,
}) {
  const [tab, setTab] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();
  const employer = isEmployer(user?.role);

  const filtered = useMemo(
    () => filterNotificationsByTab(notifications, tab),
    [notifications, tab]
  );

  const newCount = filtered.filter((n) => !n.is_read).length;

  const handleOpen = (n) => {
    onClose();
    if (n.link) navigate(n.link);
  };

  return (
    <div className="flex max-h-[min(85vh,640px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Notification</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {NOTIFICATION_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-center text-xs font-semibold transition sm:text-sm',
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500">
            {newCount > 0 ? `New notification${newCount > 1 ? 's' : ''}` : 'Notifications'}
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ maxHeight: listMaxH }}>
        {filtered.length === 0 ? (
          <li className="px-4 py-12 text-center text-sm text-slate-500">
            {tab === 'all' ? 'No notifications yet' : `No ${tab} notifications`}
          </li>
        ) : (
          filtered.map((n) => (
            <li key={n.id}>
              <NotificationItem
                notification={n}
                isEmployer={employer}
                onOpen={handleOpen}
                onMarkRead={onMarkRead}
                onActionDone={onRefresh}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
