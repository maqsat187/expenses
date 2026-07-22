"use client";

import { useSyncExternalStore } from "react";
import { getCurrentUser, subscribeCurrentUser, type UserName } from "@/lib/auth";

// Server/first-hydration snapshot is always null (no localStorage on the
// server); React reconciles to the real client value right after hydration
// with no manual effect or hydration-mismatch risk.
export function useCurrentUser(): UserName | null {
  return useSyncExternalStore(subscribeCurrentUser, getCurrentUser, () => null);
}
