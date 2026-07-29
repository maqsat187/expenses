// Best-effort client-side fetch of the National Bank of Kazakhstan's own
// published gold price (nationalbank.kz/ru/gold/zoloto — "Стоимость 1
// грамма золота в тенге"), rather than deriving a gram price ourselves from
// spot price + exchange rate. The page's schema isn't reachable from here
// to confirm, so this searches the page text near a "1 грамм" mention for a
// plausible tenge amount instead of assuming specific markup/selectors.
export type NbkGoldResult =
  | { status: "ok"; pricePerGram: number }
  | { status: "error"; message: string };

const NBK_GOLD_URL = "https://nationalbank.kz/ru/gold/zoloto";

// Gold in KZT per gram has stayed within roughly this band at current
// market levels; used only to reject an obviously unrelated number (a date,
// a percentage, a phone number), not to validate the real-world price.
const PLAUSIBLE_MIN = 5_000;
const PLAUSIBLE_MAX = 200_000;

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Запрос из браузера не прошёл — вероятно nationalbank.kz не разрешает CORS для стороннего сайта, либо нет сети.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

function extractPlausiblePrice(text: string): number | undefined {
  const numbers = text.match(/\d{1,3}(?:[  ]?\d{3})*(?:[.,]\d{1,2})?/g) ?? [];
  return numbers
    .map((n) => parseFloat(n.replace(/[  ]/g, "").replace(",", ".")))
    .find((n) => n >= PLAUSIBLE_MIN && n <= PLAUSIBLE_MAX);
}

export async function fetchNbkGoldPricePerGram(): Promise<NbkGoldResult> {
  try {
    const response = await fetch(NBK_GOLD_URL);
    if (!response.ok) {
      throw new Error(`Сервер ответил с ошибкой HTTP ${response.status}`);
    }
    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");

    const anchorIndex = text.search(/1\s*г(рамм)?\b/i);
    const window = anchorIndex !== -1 ? text.slice(anchorIndex, anchorIndex + 200) : text;

    const price = extractPlausiblePrice(window) ?? extractPlausiblePrice(text);
    if (price === undefined) {
      throw new Error("Не удалось найти правдоподобную цену на странице Нацбанка.");
    }
    return { status: "ok", pricePerGram: price };
  } catch (err) {
    return { status: "error", message: describeFetchError(err) };
  }
}
