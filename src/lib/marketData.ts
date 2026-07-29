// Reads the snapshot produced by scripts/fetch-market-data.mjs during the
// deploy workflow. It's served from this site's own origin, so there's no
// cross-origin request and nothing for CORS to block — which is the whole
// reason the data is collected server-side instead of fetched from kase.kz
// and nationalbank.kz directly in the browser.
//
// Freshness is bounded by how often the workflow runs (see its schedule),
// so every value is paired with generatedAt and the UI shows it.
export type SnapshotEntry<T> = ({ status: "ok" } & T) | { status: "error"; message: string };

export type MarketData = {
  generatedAt: string;
  goldSpot: SnapshotEntry<{ price: number }>;
  kase: SnapshotEntry<{
    averagePrice: number;
    isRealtime: boolean;
    serverTime: string | null;
  }>;
  nbkGold: SnapshotEntry<{
    pricePerGram: number;
    date: string | null;
    strategy: string;
    matchedContext: string;
  }>;
  // Present only when all three sources loaded: compares the National
  // Bank's published gram price against the same figure derived from spot
  // price and the KASE rate. Null when it couldn't be computed.
  crossCheck: {
    expectedFromSpot: number;
    deviationPercent: number;
    looksConsistent: boolean;
  } | null;
};

export type MarketDataResult =
  | { status: "ok"; data: MarketData }
  | { status: "error"; message: string };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export async function fetchMarketData(): Promise<MarketDataResult> {
  try {
    // cache: "no-store" so a redeploy's fresh numbers aren't masked by a
    // previously cached copy of the file.
    const response = await fetch(`${BASE_PATH}/market-data.json`, {
      cache: "no-store",
    });
    if (response.status === 404) {
      throw new Error(
        "Файл с данными ещё не собран. Он создаётся при деплое — запустите workflow или дождитесь ближайшего запуска по расписанию.",
      );
    }
    if (!response.ok) {
      throw new Error(`Не удалось загрузить данные: HTTP ${response.status}`);
    }
    return { status: "ok", data: (await response.json()) as MarketData };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Неизвестная ошибка",
    };
  }
}

export function formatSnapshotTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
