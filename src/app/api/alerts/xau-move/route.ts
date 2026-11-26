// Checked every 15 minutes by an external scheduler (a cron-job.org job;
// GitHub Actions' schedule trigger never fired for this repo, and Vercel
// Cron on the Hobby plan only allows once a day): if the forecast gold price -- the same tenge figure as the first box on
// the Gold Coin page, goldSpot converted through the live KASE rate, see
// getForecastPrice() -- has moved MOVE_THRESHOLD_PERCENT since the last
// alert, posts about it to the Telegram group (src/lib/telegram.ts) and
// remembers the new price as the baseline for the next check
// (src/lib/xauAlertState.ts) -- so a sustained move keeps alerting every
// extra MOVE_THRESHOLD_PERCENT rather than only once. Tracking this combined tenge price
// rather than the raw USD gold spot means a move in either the gold price
// or the USD/KZT rate (or both together) can trigger it.
//
// The very first run ever (no stored state yet) just records the current
// price as the baseline instead of alerting -- there's nothing to compare
// against yet.
//
// Protected by CRON_SECRET, checked the same way as xau-price/route.ts.
import { NextRequest, NextResponse } from "next/server";
import { getForecastPrice } from "@/lib/goldForecastPrice";
import { loadXauAlertState, saveXauAlertState } from "@/lib/xauAlertState";
import { sendTelegramMessage } from "@/lib/telegram";
import { formatMoneyPrecise, formatSignedPercentPrecise } from "@/lib/format";

export const dynamic = "force-dynamic";

const MOVE_THRESHOLD_PERCENT = 1;

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

// Logged so scheduled calls show up in Vercel's runtime logs -- a "no-move"
// check otherwise leaves no trace anywhere.
function respond(body: Record<string, unknown>, status = 200) {
  console.log("xau-move", JSON.stringify(body));
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return respond({ error: "unauthorized" }, 401);
  }

  try {
    const price = await getForecastPrice();
    const state = await loadXauAlertState();

    if (!state) {
      await saveXauAlertState(price);
      return respond({ status: "seeded", price });
    }

    const changePercent = ((price - state.lastAlertPrice) / state.lastAlertPrice) * 100;

    if (Math.abs(changePercent) < MOVE_THRESHOLD_PERCENT) {
      return respond({ status: "no-move", price, changePercent });
    }

    const direction = changePercent > 0 ? "📈 выросла" : "📉 упала";
    const text =
      `${direction} на ${formatSignedPercentPrecise(changePercent)} — прогнозная цена золота (Gold Coin)\n` +
      `Было: ${formatMoneyPrecise(state.lastAlertPrice)} (${formatAlmaty(new Date(state.lastAlertAt))})\n` +
      `Сейчас: ${formatMoneyPrecise(price)} (${formatAlmaty(new Date())})`;

    await sendTelegramMessage(text);
    await saveXauAlertState(price);

    return respond({ status: "alerted", price, changePercent });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return respond({ error: message }, 500);
  }
}
