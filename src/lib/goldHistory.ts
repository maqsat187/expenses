// Pure helpers for the gold price history/forecast shown on the Gold Coin
// page. The history data itself arrives as nbkGold.history from
// /api/market-data (see marketSources.ts) — the National Bank's own page
// publishes several recent days in one table, so a single server-side fetch
// captures full history; nothing here fetches on its own.

// "Gold Coin" here means 1/20 troy ounce (≈1.555 g) — the weight the
// forecast formula on the page is built around (spot ÷ 20).
export const TROY_OUNCE_GRAMS = 31.1034768;
export const GOLD_COIN_GRAMS = TROY_OUNCE_GRAMS / 20;

export type GoldHistoryEntry = { date: string; pricePerGram: number };

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
    const goldCoinPrice = entry.pricePerGram * GOLD_COIN_GRAMS;
    const prev = i > 0 ? sorted[i - 1] : null;
    if (!prev) {
      return { date: entry.date, goldCoinPrice, changeAmount: null, changePercent: null };
    }
    const prevPrice = prev.pricePerGram * GOLD_COIN_GRAMS;
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

// Today's date in Almaty, as "YYYY-MM-DD" — matches the format nbkGold's
// history entries use, so it can be compared against them directly.
export function almatyTodayIso(): string {
  return almatyNow().toISOString().slice(0, 10);
}

// Adds (or subtracts) calendar days to a "YYYY-MM-DD" string. JS's Date
// constructor normalizes out-of-range day-of-month values itself, so this
// works across month/year boundaries without extra logic.
export function addDaysIso(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
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
