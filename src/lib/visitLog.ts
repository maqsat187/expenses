// Server-only. Records login attempts (successful or not) to the Supabase
// "visits" table, and reads them back for the admin history view.
//
// A browser has no way to learn its own MAC address — no web API has ever
// exposed it, on any browser, for privacy reasons enforced at the OS level.
// IP address is the closest real equivalent, and unlike a client-side "what
// is my IP" call, reading it from request headers here can't be spoofed by
// editing page JS.
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export type VisitRecord = {
  id: number;
  created_at: string;
  surname: string;
  name: string;
  success: boolean;
  ip: string | null;
  user_agent: string | null;
};

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

// Best-effort: a logging failure should never block or fail the login
// attempt itself, so errors are swallowed here rather than thrown.
export async function logVisit(
  request: NextRequest,
  surname: string,
  name: string,
  success: boolean,
): Promise<void> {
  try {
    await supabase.from("visits").insert({
      surname,
      name,
      success,
      ip: clientIp(request),
      user_agent: request.headers.get("user-agent"),
    });
  } catch {
    // Ignored — see comment above.
  }
}

const VISITS_LIMIT = 500;

export async function listVisits(): Promise<VisitRecord[]> {
  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(VISITS_LIMIT);
  if (error) throw new Error(error.message);
  return data as VisitRecord[];
}
