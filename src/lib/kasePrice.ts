// Best-effort client-side attempt at KASE's USDKZT_TOM weighted-average
// fixings. KASE's own structured feed (IRIS API) is a paid subscription
// (mds@kase.kz) — there is no free public JSON endpoint for this, and the
// public currency page is an ordinary HTML page with no CORS allowance for
// third-party origins, so this will very likely fail from a browser. It's
// still attempted for real rather than assumed to fail; on success it
// surfaces the raw text found near each fixing time instead of asserting a
// parsed number, since the page structure isn't known well enough here to
// parse it with confidence.
export type KaseFixingResult =
  | { status: "ok"; time: string; snippet: string }
  | { status: "error"; time: string; message: string };

const KASE_URL = "https://kase.kz/ru/currency/";
const FIXING_TIMES = ["15:30", "17:30"];

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "kase.kz заблокировал запрос из браузера (CORS) или недоступен из сети. Бесплатного публичного JSON API у KASE нет — только платный IRIS API по подписке.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

export async function fetchKaseUsdKztTomFixings(): Promise<KaseFixingResult[]> {
  try {
    const response = await fetch(KASE_URL);
    if (!response.ok) {
      throw new Error(`Сервер ответил с ошибкой HTTP ${response.status}`);
    }
    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ");
    if (!text.toUpperCase().includes("USDKZT_TOM")) {
      throw new Error(
        "На загруженной странице не нашли тикер USDKZT_TOM — вероятно, цифры подгружаются скриптом уже в браузере пользователя kase.kz.",
      );
    }
    return FIXING_TIMES.map((time) => {
      const index = text.indexOf(time);
      if (index === -1) {
        return {
          status: "error" as const,
          time,
          message: `Отметка времени ${time} не найдена на странице.`,
        };
      }
      const start = Math.max(0, index - 80);
      const snippet = text
        .slice(start, index + 120)
        .replace(/\s+/g, " ")
        .trim();
      return { status: "ok" as const, time, snippet };
    });
  } catch (err) {
    const message = describeFetchError(err);
    return FIXING_TIMES.map((time) => ({ status: "error" as const, time, message }));
  }
}
