// Client-side fetch to a free, keyless gold-spot endpoint. This app has no
// backend, so the call runs straight from the browser — it only works if
// the source's server sends permissive CORS headers. Not an official quote;
// treat it as a starting point to cross-check, not a settled price.
export type SpotPriceResult =
  | {
      status: "ok";
      source: string;
      sourceUrl: string;
      price: number;
      fetchedAt: string;
    }
  | { status: "error"; source: string; sourceUrl: string; message: string };

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Запрос из браузера не прошёл — скорее всего источник не разрешает CORS для стороннего сайта, либо нет сети.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

export async function fetchGoldApiSpot(): Promise<SpotPriceResult> {
  const source = "Gold-API.com";
  const sourceUrl = "https://gold-api.com/";
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
    return {
      status: "ok",
      source,
      sourceUrl,
      price,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { status: "error", source, sourceUrl, message: describeFetchError(err) };
  }
}
