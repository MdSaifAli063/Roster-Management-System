export const NOTIFICATION_TABS = [
  { id: 'all', label: 'All' },
  { id: 'mention', label: 'Mention' },
  { id: 'reminder', label: 'Reminder' },
];

const MENTION_TYPES = new Set(['LEAVE_APPROVED', 'LEAVE_REJECTED', 'ATTENDANCE_CONFIRM', 'REASSIGNMENT']);
const REMINDER_TYPES = new Set(['LEAVE_SUBMITTED', 'ATTENDANCE_MISMATCH', 'ATTENDANCE_MARK']);

export function getNotificationCategory(notification) {
  const fromPayload = notification?.payload?.category;
  if (fromPayload === 'mention' || fromPayload === 'reminder') return fromPayload;
  if (MENTION_TYPES.has(notification?.type)) return 'mention';
  if (REMINDER_TYPES.has(notification?.type)) return 'reminder';
  return 'all';
}

export function filterNotificationsByTab(notifications, tab) {
  if (tab === 'all') return notifications;
  return notifications.filter((n) => getNotificationCategory(n) === tab);
}

export function parseEmpName(notification) {
  const p = notification?.payload || {};
  if (p.empName) return p.empName;
  if (p.fromName && notification.type === 'REASSIGNMENT') return p.fromName;
  const m = notification?.message?.match(/^([^]+?) (has requested|requested)/);
  return m?.[1] || null;
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
