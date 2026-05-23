const KEY = 'roster_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS = {
  systemAnnouncements: true,
  holidayAnnouncements: true,
  broadcastMessages: true,
  policyUpdates: true,
  maintenanceAlerts: true,
  leaveRequests: true,
  scheduleChanges: true,
  payrollUpdates: true,
  mentions: true,
  onboarding: true,
  taskReminders: true,
};

export function loadNotificationPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
