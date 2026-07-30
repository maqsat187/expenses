// Client-side reader for /api/market-data — our own server route, which
// fetches Gold-API, KASE and the National Bank server-side (see
// marketSources.ts). Because the request goes to our own origin there's no
// cross-origin call from the browser and nothing for CORS to block, which is
// what makes KASE and the National Bank reachable at all.
//
// Every value is therefore live as of the click, not a snapshot baked in at
// deploy time; generatedAt records the moment the server did the fetching.
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
    // Several recent days parsed from the National Bank's own page in the
    // same fetch, oldest first. Empty when the page's table wasn't found.
    history: { date: string; pricePerGram: number }[];
  }>;
  // Present only when all three sources loaded: compares the National Bank's
  // published gram price against the same figure derived from spot price and
  // the KASE rate. Null when it couldn't be computed.
  crossCheck: {
    expectedFromSpot: number;
    deviationPercent: number;
    looksConsistent: boolean;
  } | null;
};

export type MarketDataResult =
  | { status: "ok"; data: MarketData }
  | { status: "error"; message: string };

export async function fetchMarketData(): Promise<MarketDataResult> {
  try {
    const response = await fetch("/api/market-data", { cache: "no-store" });
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
