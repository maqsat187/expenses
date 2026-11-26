// Telegram calls this on every message in a chat the bot is in, once the
// webhook is registered (setWebhook with this route's URL). Replies with
// the current forecast gold price when the message is the /price command
// -- everything else is ignored. Always answers 200 quickly; Telegram
// retries on anything else, which would resend the same update.
//
// Verified via the secret_token Telegram echoes back in the
// X-Telegram-Bot-Api-Secret-Token header (set when registering the
// webhook) -- without it, anyone who finds this URL could trigger replies.
import { NextRequest, NextResponse } from "next/server";
import { buildForecastPriceMessage } from "@/lib/goldForecastPrice";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: { chat?: { id: number }; text?: string };
};

function isPriceCommand(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized === "price" || /^\/price(@\w+)?$/.test(normalized);
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text;

  if (chatId && text && isPriceCommand(text)) {
    try {
      const message = await buildForecastPriceMessage();
      await sendTelegramMessage(message, chatId);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await sendTelegramMessage(`Не получилось посчитать цену: ${reason}`, chatId).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
