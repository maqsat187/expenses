"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, subscribeCurrentUser } from "@/lib/goldAuth";
import { useGoldIdleLogout } from "@/lib/useGoldIdleLogout";

// Redirects to /gold/login when nobody is signed in to the Gold Coin
// section. Mirrors useAuthGuard, but checks goldAuth's own session instead
// of the main app's — logging into one doesn't log into the other.
//
// Same hydration-race precaution as useAuthGuard: the redirect decision
// waits for an explicit post-mount effect rather than trusting
// useSyncExternalStore's first client snapshot.
export function useGoldAuthGuard(): string | null {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const sync = () => {
      setUser(getCurrentUser());
      setChecked(true);
    };
    sync();
    return subscribeCurrentUser(sync);
  }, []);

  useEffect(() => {
    if (checked && !user) {
      router.replace("/gold/login");
    }
  }, [checked, user, router]);

  useGoldIdleLogout(checked ? user : null);

  return checked ? user : null;
}
