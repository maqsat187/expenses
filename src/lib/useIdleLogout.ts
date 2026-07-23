"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  clearCurrentUser,
  getIdleMs,
  touchActivity,
  type UserName,
} from "@/lib/auth";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 15_000;
const TOUCH_THROTTLE_MS = 10_000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

// Signs out after IDLE_TIMEOUT_MS with no mouse/keyboard/touch/scroll
// activity. Activity is recorded in localStorage, so it's shared across
// tabs and checked immediately on mount — returning after being away
// longer than the timeout (including with the tab/browser closed) signs
// out right away instead of granting a fresh window just for reopening it.
export function useIdleLogout(user: UserName | null): void {
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (getIdleMs() >= IDLE_TIMEOUT_MS) {
      clearCurrentUser();
      router.replace("/login");
      return;
    }
    touchActivity();

    let lastTouch = Date.now();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastTouch < TOUCH_THROTTLE_MS) return;
      lastTouch = now;
      touchActivity();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const interval = setInterval(() => {
      if (getIdleMs() >= IDLE_TIMEOUT_MS) {
        clearCurrentUser();
        router.replace("/login");
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [user, router]);
}
