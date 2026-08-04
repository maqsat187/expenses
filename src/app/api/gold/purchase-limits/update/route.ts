import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/goldAuth";
import { updatePurchaseQuantity } from "@/lib/goldPurchaseLimits";

// Corrects the recorded quantity on an existing purchase entry — e.g. the
// number actually bought turned out different from what was first typed
// in. Restricted to Жайсанбаев Максат only, same as adding entries.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const id = typeof body?.id === "number" ? body.id : NaN;
  const quantity = typeof body?.quantity === "number" ? body.quantity : NaN;

  if (!isAdmin(`${surname} ${name}`)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json({ ok: false, message: "Некорректные данные." }, { status: 400 });
  }

  try {
    await updatePurchaseQuantity(id, quantity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
