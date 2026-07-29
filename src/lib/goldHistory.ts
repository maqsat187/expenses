// Reads public/gold-history.json — daily National Bank gram prices,
// accumulated across deploy-workflow runs (see scripts/fetch-market-data.mjs
// and .github/workflows/deploy.yml). Same-origin fetch, same reasoning as
// marketData.ts: no browser CORS request happens at runtime at all.
export type GoldHistoryEntry = { date: string; nbkPricePerGram: number };

export type GoldHistoryResult =
  | { status: "ok"; entries: GoldHistoryEntry[] }
  | { status: "error"; message: string };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export async function fetchGoldHistory(): Promise<GoldHistoryResult> {
  try {
    const response = await fetch(`${BASE_PATH}/gold-history.json`, {
      cache: "no-store",
    });
    if (response.status === 404) {
      throw new Error(
        "Файл истории ещё не создан. Он появляется после первого запуска деплоя.",
      );
    }
    if (!response.ok) {
      throw new Error(`Не удалось загрузить историю: HTTP ${response.status}`);
    }
    const data = (await response.json()) as { entries?: GoldHistoryEntry[] };
    return { status: "ok", entries: data.entries ?? [] };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Неизвестная ошибка",
    };
  }
}

// "Gold Coin" here means 1/20 troy ounce (≈1.555 g) — the weight the
// forecast formula below is built around (spot ÷ 20).
export const TROY_OUNCE_GRAMS = 31.1034768;
export const GOLD_COIN_GRAMS = TROY_OUNCE_GRAMS / 20;

export type DailyGoldCoinPoint = {
  date: string;
  goldCoinPrice: number;
  changeAmount: number | null;
  changePercent: number | null;
};

// Computes day-over-day change across the *entire* supplied history before
// the caller slices to however many days it wants to display, so even the
// oldest displayed row can show a real change if earlier data exists.
export function buildDailyGoldCoinSeries(
  entries: GoldHistoryEntry[],
): DailyGoldCoinPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((entry, i) => {
    const goldCoinPrice = entry.nbkPricePerGram * GOLD_COIN_GRAMS;
    const prev = i > 0 ? sorted[i - 1] : null;
    if (!prev) {
      return { date: entry.date, goldCoinPrice, changeAmount: null, changePercent: null };
    }
    const prevPrice = prev.nbkPricePerGram * GOLD_COIN_GRAMS;
    const changeAmount = goldCoinPrice - prevPrice;
    return {
      date: entry.date,
      goldCoinPrice,
      changeAmount,
      changePercent: (changeAmount / prevPrice) * 100,
    };
  });
}

// Kazakhstan is UTC+5 year-round; shifting by that offset and reading UTC
// fields gives Almaty-local calendar values regardless of the visitor's own
// timezone, without depending on Intl timezone support.
export function almatyNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5 * 60 * 60 * 1000);
}

// Next weekday after `from`. Public holidays specific to Kazakhstan (Nauryz,
// Kurban Ait, etc.) aren't accounted for — those shift year to year and
// would need a maintained list; this only skips Saturday/Sunday.
export function nextBusinessDayIso(from: Date): string {
  const next = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1),
  );
  while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.toISOString().slice(0, 10);
}
