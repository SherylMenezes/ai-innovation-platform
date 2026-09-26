// Per-browser stale-while-revalidate cache: a page renders its last
// response instantly, then swaps in the fresh one when it arrives. Storage
// can be unavailable (private mode, blocked site data), so every access is
// guarded and a miss just means "render the loading state as before".
const PREFIX = "cache.";

export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked — caching is best-effort.
  }
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked — nothing was cached.
  }
}
