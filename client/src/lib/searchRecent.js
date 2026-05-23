const STORAGE_KEY = 'rosterpro_recent_searches';
const MAX = 8;

export function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed || trimmed.length < 2) return loadRecentSearches();
  const prev = loadRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...prev].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeRecentSearch(query) {
  const next = loadRecentSearches().filter((s) => s !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}
