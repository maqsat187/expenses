// One-time, throwaway diagnostic. Telegram has no way to resolve a private
// invite link (like the XAU/USD alert group's) to a numeric chat id -- the
// bot has to already be a member and something has to have happened for
// getUpdates to report. Open this route once in a browser after deploying:
// it lists the groups the bot currently sees, so you can copy the right
// chat id into the TELEGRAM_XAU_CHAT_ID env var in Vercel. Once that's
// done, this route isn't needed again -- src/app/api/alerts/xau-move/route.ts
// is the real feature.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TelegramChat = { id: number; title?: string; type?: string };
type TelegramUpdate = {
  message?: { chat?: TelegramChat };
  my_chat_member?: { chat?: TelegramChat };
};

export async function GET() {
  const token = process.env.Telegramtoken;
  if (!token) {
    return NextResponse.json({ error: "Telegramtoken не задан." }, { status: 500 });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = (await response.json()) as { ok: boolean; result?: TelegramUpdate[]; description?: string };

  if (!data.ok) {
    return NextResponse.json(
      { error: "Telegram API вернул ошибку.", details: data.description },
      { status: 502 },
    );
  }

  const chats = new Map<number, { id: number; title: string; type: string }>();
  for (const update of data.result ?? []) {
    const chat = update.message?.chat ?? update.my_chat_member?.chat;
    if (chat && (chat.type === "group" || chat.type === "supergroup")) {
      chats.set(chat.id, { id: chat.id, title: chat.title ?? "", type: chat.type });
    }
  }

  if (chats.size === 0) {
    return NextResponse.json({
      chats: [],
      hint: "Групп не найдено. Отправьте любое сообщение в группе (бот должен уже быть её участником) и откройте эту страницу снова.",
    });
  }

  return NextResponse.json({
    chats: [...chats.values()],
    hint: "Скопируйте id нужной группы в переменную TELEGRAM_XAU_CHAT_ID в Vercel.",
  });
}
