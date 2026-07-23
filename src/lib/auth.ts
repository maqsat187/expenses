// NOTE: this app is a static site — everything here, including the PINs,
// ships in the public JS bundle. This gate keeps casual visitors out; it is
// not real security. Don't put anything sensitive behind it.

export type UserName = "Мика" | "Макс";

export const USERS: UserName[] = ["Мика", "Макс"];

const PINS: Record<UserName, string> = {
  Мика: "2889",
  Макс: "1239",
};

const STORAGE_KEY = "expenses:auth-user";
const ACTIVITY_KEY = "expenses:auth-last-activity";

const listeners = new Set<() => void>();

export function checkPin(user: UserName, pin: string): boolean {
  return PINS[user] === pin;
}

export function getCurrentUser(): UserName | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return isUserName(value) ? value : null;
}

export function setCurrentUser(user: UserName): void {
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
// across tabs and survives reloads (used by useIdleLogout to auto sign out
// after a stretch of inactivity).
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

// Lets useCurrentUser() (useSyncExternalStore) re-render on login/logout.
export function subscribeCurrentUser(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify(): void {
  listeners.forEach((callback) => callback());
}

function isUserName(value: string | null): value is UserName {
  return value === "Мика" || value === "Макс";
}
