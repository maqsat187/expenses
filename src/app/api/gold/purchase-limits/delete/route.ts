import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/goldAuth";
import { deletePurchase } from "@/lib/goldPurchaseLimits";

// Removes a manually entered purchase record entirely — e.g. it was added
// by mistake. Restricted to Жайсанбаев Максат only, same as adding/editing.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const id = typeof body?.id === "number" ? body.id : NaN;

  if (!isAdmin(`${surname} ${name}`)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (!Number.isInteger(id)) {
    return NextResponse.json({ ok: false, message: "Некорректные данные." }, { status: 400 });
  }

  try {
    await deletePurchase(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
