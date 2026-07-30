import { NextRequest, NextResponse } from "next/server";
import { logVisit } from "@/lib/visitLog";

// Logging only — the expense tracker's PIN check itself stays client-side
// (unchanged; see src/lib/auth.ts), since it was never meant to be a real
// security boundary. This just records the attempt so it shows up
// alongside Gold Coin's login history for Жайсанбаев Максат.
export const dynamic = "force-dynamic";

const KNOWN_USERS = new Set(["Мика", "Макс"]);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const user = typeof body?.user === "string" ? body.user : "";
  const success = body?.success === true;

  if (!KNOWN_USERS.has(user)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await logVisit(request, "expenses", "", user, success);
  return NextResponse.json({ ok: true });
}
