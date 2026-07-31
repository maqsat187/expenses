import { NextRequest, NextResponse } from "next/server";
import { GOLD_COIN_GRAMS } from "@/lib/goldHistory";
import { canEditGoldPrice } from "@/lib/goldAuth";
import { saveGoldPriceOverride } from "@/lib/nbkGoldOverride";

// Same trust model as the rest of this app's Gold Coin auth: the caller's
// claimed identity is trusted (they already passed the Фамилия/Имя/пароль
// login to get here), just restricted server-side to the two names allowed
// to enter a price by hand.
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const coinPrice = typeof body?.coinPrice === "number" ? body.coinPrice : NaN;

  const identity = `${surname} ${name}`;
  if (!canEditGoldPrice(identity)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  if (!DATE_PATTERN.test(date) || !Number.isFinite(coinPrice) || coinPrice <= 0) {
    return NextResponse.json({ ok: false, message: "Некорректные данные." }, { status: 400 });
  }

  try {
    await saveGoldPriceOverride(date, coinPrice / GOLD_COIN_GRAMS, identity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
