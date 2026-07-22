"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { UserName } from "@/lib/auth";

// Redirects to /login when nobody is signed in. Returns null while
// unauthenticated (or not yet resolved on the client).
export function useAuthGuard(): UserName | null {
  const router = useRouter();
  const user = useCurrentUser();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  return user;
}
