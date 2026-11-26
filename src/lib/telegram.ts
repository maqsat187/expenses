// Server-only. Thin wrapper around the Telegram Bot API for sending
// automated alerts (the XAU/USD move alert and the scheduled price
// broadcast, see src/app/api/alerts/) and replies to the /price command
// (src/app/api/telegram/webhook/route.ts). Needs Telegramtoken (the bot's
// token) in Vercel; TELEGRAM_XAU_CHAT_ID (the group's numeric chat id) is
// only needed when chatId isn't passed explicitly.
export async function sendTelegramMessage(text: string, chatId?: string | number): Promise<void> {
  const token = process.env.Telegramtoken;
  const targetChatId = chatId ?? process.env.TELEGRAM_XAU_CHAT_ID;
  if (!token || !targetChatId) {
    throw new Error("Telegramtoken или TELEGRAM_XAU_CHAT_ID не заданы в переменных окружения.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: targetChatId, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram API вернул HTTP ${response.status}: ${body}`);
  }
}
