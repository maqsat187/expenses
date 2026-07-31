import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/goldAuth";
import { listPurchases } from "@/lib/goldPurchaseLimits";

// POST rather than GET so the caller's identity can be checked the same
// way /api/auth/visits does — there's no session/cookie to read it from
// otherwise. Restricted to Жайсанбаев Максат only.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";

  if (!isAdmin(`${surname} ${name}`)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const purchases = await listPurchases();
    return NextResponse.json({ ok: true, purchases });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
