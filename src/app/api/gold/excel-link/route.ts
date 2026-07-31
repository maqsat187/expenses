import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/goldAuth";
import { GOLD_EXCEL_URL } from "@/lib/goldExcelLink";

// POST rather than GET so the caller's identity can be checked — there's
// no session/cookie to read it from otherwise. Restricted to Жайсанбаев
// Максат only.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";

  if (!isAdmin(`${surname} ${name}`)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  return NextResponse.json({ ok: true, url: GOLD_EXCEL_URL });
}
