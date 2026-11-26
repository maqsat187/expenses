// Called by GitHub Actions on a fixed schedule -- 10:50, 11:50, 12:50,
// 13:50, 14:50 Almaty, Mon-Fri -- to post the current "forecast by
// current data" gold price to the Telegram group
// (.github/workflows/xau-price-broadcast.yml). The workflow's cron
// day-of-week already skips weekends; this also skips Kazakhstan public
// holidays (and re-checks weekends, as a safety net for a manual
// workflow_dispatch run) so a holiday never gets a broadcast.
//
// Protected by CRON_SECRET the same way as xau-move/route.ts.
import { NextRequest, NextResponse } from "next/server";
import { almatyNow, isWeekendOrHoliday } from "@/lib/goldHistory";
import { buildForecastPriceMessage } from "@/lib/goldForecastPrice";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (isWeekendOrHoliday(almatyNow())) {
    return NextResponse.json({ status: "skipped-non-business-day" });
  }

  try {
    const text = await buildForecastPriceMessage();
    await sendTelegramMessage(text);
    return NextResponse.json({ status: "sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
