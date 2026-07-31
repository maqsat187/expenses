import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/goldAuth";
import { savePurchase, PEOPLE, type Person } from "@/lib/goldPurchaseLimits";

// Adding a purchase is restricted to Жайсанбаев Максат only — same trust
// model as the rest of this app's Gold Coin auth: the caller's claimed
// identity is trusted (they already passed the login), just checked
// server-side against the one allowed name.
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPerson(value: string): value is Person {
  return (PEOPLE as string[]).includes(value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const person = typeof body?.person === "string" ? body.person : "";
  const purchaseDate = typeof body?.purchaseDate === "string" ? body.purchaseDate : "";
  const quantity = typeof body?.quantity === "number" ? body.quantity : NaN;

  if (!isAdmin(`${surname} ${name}`)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (
    !isPerson(person) ||
    !DATE_PATTERN.test(purchaseDate) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return NextResponse.json({ ok: false, message: "Некорректные данные." }, { status: 400 });
  }

  try {
    await savePurchase(person, purchaseDate, quantity, `${surname} ${name}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
