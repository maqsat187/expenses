// Client-side port of a working script that hits KASE's own (undocumented,
// but keyless/anonymous) quote-monitor API: a GET for a CSRF token followed
// by a POST for the watcher data, reading the "averageprc" field ("Average"
// column) for USDKZT_TOM.
//
// The script this was ported from works because it runs outside a browser —
// CORS and cookie SameSite rules don't apply to a Python script. From our
// static site's origin they do: the flow needs kase.kz to (a) send
// Access-Control-Allow-Origin for our exact origin plus
// Access-Control-Allow-Credentials on both requests, and (b) issue its CSRF
// cookie as SameSite=None so a cross-site fetch can carry it back on the
// second request. Most CSRF cookies default to Lax/Strict specifically to
// prevent cross-site use, so this is a real attempt, not a guaranteed one —
// same spirit as the other best-effort sources on this page.
export type KaseAverageResult =
  | { status: "ok"; averagePrice: number; isRealtime: boolean }
  | { status: "error"; message: string };

const TOKEN_URL = "https://kase.kz/api/accounts/get_token/";
const WATCHER_URL = "https://kase.kz/api/trades/watcher/";
const INSTRUMENT = "USDKZT_TOM";

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Запрос из браузера не прошёл — вероятно kase.kz не разрешает CORS/куки для стороннего сайта, либо нет сети.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

export async function fetchKaseUsdKztAverage(): Promise<KaseAverageResult> {
  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!tokenResponse.ok) {
      throw new Error(`Не удалось получить токен: HTTP ${tokenResponse.status}`);
    }
    const tokenData = (await tokenResponse.json()) as { csrftoken?: string };
    const token = tokenData.csrftoken;
    if (!token) {
      throw new Error("В ответе KASE не нашли csrftoken.");
    }

    const body = new URLSearchParams({
      instruments: INSTRUMENT,
      fields: "averageprc",
    });
    const watcherResponse = await fetch(WATCHER_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": token,
      },
      body: body.toString(),
    });
    if (!watcherResponse.ok) {
      throw new Error(`Сервер ответил с ошибкой HTTP ${watcherResponse.status}`);
    }
    const data = (await watcherResponse.json()) as {
      is_realtime?: boolean;
      data?: { code?: string; fields?: Record<string, { value?: unknown }> }[];
    };
    const row = data.data?.find((r) => r.code === INSTRUMENT);
    const rawValue = row?.fields?.averageprc?.value;
    const averagePrice =
      typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue));
    if (!Number.isFinite(averagePrice)) {
      throw new Error("Не удалось найти среднюю цену в ответе KASE.");
    }
    return { status: "ok", averagePrice, isRealtime: Boolean(data.is_realtime) };
  } catch (err) {
    return { status: "error", message: describeFetchError(err) };
  }
}
