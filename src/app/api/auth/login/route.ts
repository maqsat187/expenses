import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, formatIdentity } from "@/lib/allowlist";
import { logVisit } from "@/lib/visitLog";

// Must run per request, not be prerendered — it reads the request body and
// the caller's IP, neither of which exist at build time.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const match = checkCredentials(surname, name, password);

  await logVisit(request, surname.trim(), name.trim(), match !== null);

  if (!match) {
    // Deliberately generic — doesn't say whether the name or the password
    // was wrong, so a failed guess reveals nothing about the allowlist.
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, displayName: formatIdentity(match) });
}
