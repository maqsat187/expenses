// Client-side fetch to a free, keyless gold-spot endpoint. Unlike KASE and
// the National Bank (which don't send CORS headers, hence market-data.json
// being collected server-side at deploy time), Gold-API.com does allow
// cross-origin requests — so this one can be fetched live, right when the
// button is clicked, instead of only reflecting the last deploy.
export type SpotPriceResult =
  | { status: "ok"; price: number }
  | { status: "error"; message: string };

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Запрос из браузера не прошёл — сеть недоступна или источник перестал разрешать CORS.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

export async function fetchGoldApiSpot(): Promise<SpotPriceResult> {
  try {
    const response = await fetch("https://api.gold-api.com/price/XAU", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Сервер ответил с ошибкой HTTP ${response.status}`);
    }
    const data = (await response.json()) as { price?: number };
    const price = data.price;
    if (typeof price !== "number" || !Number.isFinite(price)) {
      throw new Error("Не удалось найти цену в ответе источника.");
    }
    return { status: "ok", price };
  } catch (err) {
    return { status: "error", message: describeFetchError(err) };
  }
}
