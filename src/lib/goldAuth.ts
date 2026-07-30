// Separate login for the Gold Coin section only — independent of the main
// app's Мика/Макс PIN login (src/lib/auth.ts). The current user here is a
// "Фамилия Имя" string, checked server-side on login against an allowlist +
// shared password (see /api/auth/login and src/lib/allowlist.ts, which
// never ships to the browser). Uses its own localStorage keys so a Gold
// Coin session and a main-app session don't overwrite each other.

const STORAGE_KEY = "gold:auth-user";
const ACTIVITY_KEY = "gold:auth-last-activity";

const listeners = new Set<() => void>();

// The one person allowed to see the Gold Coin visit history. Compared
// against the same formatted "Фамилия Имя" string login produces.
const ADMIN_USER = "Жайсанбаев Максат";

export function isAdmin(user: string | null): boolean {
  return user === ADMIN_USER;
}

export function getCurrentUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setCurrentUser(user: string): void {
  window.localStorage.setItem(STORAGE_KEY, user);
  touchActivity();
  notify();
}

export function clearCurrentUser(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(ACTIVITY_KEY);
  notify();
}

// Records "the user did something just now", in localStorage so it's shared
// across tabs and survives reloads (used by useGoldIdleLogout to auto sign
// out after a stretch of inactivity).
export function touchActivity(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
}

// Milliseconds since the last recorded activity. Treats "never recorded" as
// "just now" rather than "infinitely idle", so a first-ever login can't be
// immediately timed out.
export function getIdleMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ACTIVITY_KEY);
  const last = raw ? Number(raw) : Date.now();
  return Number.isFinite(last) ? Date.now() - last : 0;
}

// Lets useGoldCurrentUser() (useSyncExternalStore) re-render on login/logout.
export function subscribeCurrentUser(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify(): void {
  listeners.forEach((callback) => callback());
}
