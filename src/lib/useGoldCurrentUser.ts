"use client";

import { useSyncExternalStore } from "react";
import { getCurrentUser, subscribeCurrentUser } from "@/lib/goldAuth";

// Server/first-hydration snapshot is always null (no localStorage on the
// server); React reconciles to the real client value right after hydration
// with no manual effect or hydration-mismatch risk. Non-redirecting,
// unlike useGoldAuthGuard — for places (like AppHeader) that just need to
// read the Gold Coin identity without forcing a login.
export function useGoldCurrentUser(): string | null {
  return useSyncExternalStore(subscribeCurrentUser, getCurrentUser, () => null);
}
