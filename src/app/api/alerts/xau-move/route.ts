// Checked by Vercel Cron every 15 minutes (see vercel.json): if XAU/USD has
// moved MOVE_THRESHOLD_PERCENT since the last alert, posts about it to the
// Telegram group (src/lib/telegram.ts) and remembers the new price as the
// baseline for the next check (src/lib/xauAlertState.ts) — so a sustained
// move keeps alerting every extra 2% rather than only once per day.
//
// The very first run ever (no stored state yet) just records the current
// price as the baseline instead of alerting — there's nothing to compare
// against yet.
//
// Protected by CRON_SECRET: Vercel automatically sends it as a Bearer
// token on cron-triggered requests once that env var is set
// (https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs).
import { NextRequest, NextResponse } from "next/server";
import { fetchGoldSpot } from "@/lib/marketSources";
import { loadXauAlertState, saveXauAlertState } from "@/lib/xauAlertState";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const MOVE_THRESHOLD_PERCENT = 2;

function formatAlmaty(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { price } = await fetchGoldSpot();
    const state = await loadXauAlertState();

    if (!state) {
      await saveXauAlertState(price);
      return NextResponse.json({ status: "seeded", price });
    }

    const changePercent = ((price - state.lastAlertPrice) / state.lastAlertPrice) * 100;

    if (Math.abs(changePercent) < MOVE_THRESHOLD_PERCENT) {
      return NextResponse.json({ status: "no-move", price, changePercent });
    }

    const sign = changePercent > 0 ? "+" : "";
    const direction = changePercent > 0 ? "📈 выросла" : "📉 упала";
    const text =
      `${direction} на ${sign}${changePercent.toFixed(2)}% — XAU/USD\n` +
      `Было: $${state.lastAlertPrice.toFixed(2)} (${formatAlmaty(new Date(state.lastAlertAt))})\n` +
      `Сейчас: $${price.toFixed(2)} (${formatAlmaty(new Date())})`;

    await sendTelegramMessage(text);
    await saveXauAlertState(price);

    return NextResponse.json({ status: "alerted", price, changePercent });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
