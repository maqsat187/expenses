"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearCurrentUser, getIdleMs, touchActivity } from "@/lib/goldAuth";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 15_000;
const TOUCH_THROTTLE_MS = 10_000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

// Signs out of the Gold Coin section after IDLE_TIMEOUT_MS with no
// mouse/keyboard/touch/scroll activity. Mirrors useIdleLogout, but against
// goldAuth's own storage so it doesn't interact with the main app's session.
export function useGoldIdleLogout(user: string | null): void {
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (getIdleMs() >= IDLE_TIMEOUT_MS) {
      clearCurrentUser();
      router.replace("/gold/login");
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
        router.replace("/gold/login");
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
