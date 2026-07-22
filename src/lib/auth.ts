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
  notify();
}

export function clearCurrentUser(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
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
