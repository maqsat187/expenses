// Client-side fetches to free, keyless third-party gold-spot endpoints.
// This app has no backend, so these calls run straight from the browser —
// they only work if the source's server sends permissive CORS headers.
// Neither source is official; treat the numbers as a starting point to
// cross-check, not a settled quote.
export type SpotPriceResult =
  | {
      status: "ok";
      source: string;
      sourceUrl: string;
      price: number;
      fetchedAt: string;
    }
  | { status: "error"; source: string; sourceUrl: string; message: string };

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Сервер ответил с ошибкой HTTP ${response.status}`);
  }
  return response.json();
}

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
    const data = (await fetchJson("https://api.gold-api.com/price/XAU")) as {
      price?: number;
    };
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

export async function fetchGoldPriceOrgSpot(): Promise<SpotPriceResult> {
  const source = "GoldPrice.org";
  const sourceUrl = "https://goldprice.org/";
  try {
    const data = (await fetchJson(
      "https://data-asg.goldprice.org/dbXRates/USD",
    )) as { items?: { xauPrice?: number }[] };
    const price = data.items?.[0]?.xauPrice;
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
