// Server-only. Thin wrapper around the Telegram Bot API for sending
// automated alerts (currently just the XAU/USD move alert — see
// src/app/api/alerts/xau-move/route.ts). Needs two environment variables
// in Vercel: Telegramtoken (the bot's token, already set) and
// TELEGRAM_XAU_CHAT_ID (the target group's numeric chat id — Telegram has
// no public lookup for a private group's invite link, see the route file
// for how to find it once).
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.Telegramtoken;
  const chatId = process.env.TELEGRAM_XAU_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Telegramtoken или TELEGRAM_XAU_CHAT_ID не заданы в переменных окружения.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram API вернул HTTP ${response.status}: ${body}`);
  }
}
