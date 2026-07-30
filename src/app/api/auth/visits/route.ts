import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, formatIdentity } from "@/lib/allowlist";
import { listVisits } from "@/lib/visitLog";

// Requires the caller's own credentials (surname, name, password) on every
// request rather than trusting whatever name the client claims to be logged
// in as — the same "not real security, just a casual gate" trust model as
// the rest of this app's auth, but re-checking the password here means a
// page reachable in the browser can't hand out visit history (IPs
// included) just because localStorage says "Жайсанбаев Максат".
export const dynamic = "force-dynamic";

const ADMIN = { surname: "Жайсанбаев", name: "Максат" };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const match = checkCredentials(surname, name, password);
  if (!match || formatIdentity(match) !== formatIdentity(ADMIN)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const visits = await listVisits();
    return NextResponse.json({ ok: true, visits });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
