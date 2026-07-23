"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, subscribeCurrentUser, type UserName } from "@/lib/auth";

// Redirects to /login when nobody is signed in. Returns null while the
// check is pending (so pages render nothing rather than a login flash) or
// once confirmed signed out.
//
// This deliberately does NOT trust useSyncExternalStore's first client
// snapshot for the redirect decision: on a full page reload, the redirect
// effect can fire on a transient pre-hydration value before the real
// localStorage read lands, sending a signed-in user back to /login even
// though their session is intact. Waiting for an explicit effect to run
// (which only ever happens client-side, after mount) before deciding
// "signed out" avoids that race.
export function useAuthGuard(): UserName | null {
  const router = useRouter();
  const [user, setUser] = useState<UserName | null>(null);
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
      router.replace("/login");
    }
  }, [checked, user, router]);

  return checked ? user : null;
}
