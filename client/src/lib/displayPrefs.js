const KEY = 'roster_display_prefs';

export const DEFAULT_DISPLAY_PREFS = {
  timeFormat: '12h',
  dateFormat: 'DMY',
};

export function loadDisplayPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_PREFS };
    return { ...DEFAULT_DISPLAY_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DISPLAY_PREFS };
  }
}

export function saveDisplayPrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
