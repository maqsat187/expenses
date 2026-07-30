// Server-side fetchers for the Gold Coin page's data sources.
//
// This runs on the server (via the /api/market-data route), never in the
// browser. That's the whole point: kase.kz and nationalbank.kz don't send
// CORS headers, so a browser can't read their responses — but CORS is a
// browser-enforced rule, and a server request has no origin to check. The
// page therefore calls our own /api/market-data, which is same-origin and
// never blocked, and this module does the cross-origin work behind it.
//
// Every source is independent: one failing never fails the others. Failures
// are returned as data so the page can show what went wrong per source.
import type { MarketData } from "@/lib/marketData";

// Some of these sites reject requests without a browser-like User-Agent.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const TIMEOUT_MS = 15_000;

async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": UA, ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} от ${url}`);
  }
  return response;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.name === "TimeoutError") {
    return "Источник не ответил вовремя.";
  }
  return err instanceof Error ? err.message : String(err);
}

// Strips markup so numbers can be located in readable text.
function toPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Two alternatives, tried in order: thousands-grouped ("61 889,33", the real
// site's format) first, then a plain contiguous run ("61889,33"). Making the
// separator optional in a single pattern was ambiguous — greedy \d{1,3}
// could eat into a plain run before a grouped match got a chance, silently
// dropping ungrouped numbers instead of matching them.
const PRICE_PATTERN_SOURCE =
  "\\d{1,3}(?:[\\s\\u00a0\\u202f]\\d{3})+(?:[.,]\\d{1,2})?|\\d{4,6}(?:[.,]\\d{1,2})?";

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/[\s  ]/g, "").replace(",", "."));
}

type NumberHit = { value: number; index: number; raw: string };

function parseNumbers(text: string, min: number, max: number): NumberHit[] {
  const found: NumberHit[] = [];
  for (const match of text.matchAll(new RegExp(PRICE_PATTERN_SOURCE, "g"))) {
    const value = toNumber(match[0]);
    if (Number.isFinite(value) && value >= min && value <= max) {
      found.push({ value, index: match.index, raw: match[0] });
    }
  }
  return found;
}

// Quotes the text a number was actually read from. Re-searching for the
// digits afterwards would land on the first coincidental occurrence instead,
// making the recorded context misreport where the value came from.
function contextAround(text: string, index: number, rawLength: number): string {
  return text.slice(Math.max(0, index - 90), index + rawLength + 90).trim();
}

// --- GOLD SPOT USD (Gold-API.com) -----------------------------------------
async function fetchGoldSpot() {
  const response = await request("https://api.gold-api.com/price/XAU", {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json()) as { price?: number };
  if (typeof data?.price !== "number" || !Number.isFinite(data.price)) {
    throw new Error("В ответе Gold-API.com нет поля price.");
  }
  return { price: data.price };
}

// --- KASE USDKZT_TOM weighted average -------------------------------------
// Two-step flow: fetch a CSRF token, then POST to the quote-monitor
// endpoint. Node's fetch has no cookie jar, so the session cookies from step
// one are forwarded to step two by hand.
async function fetchKaseAverage() {
  const tokenResponse = await request("https://kase.kz/api/accounts/get_token/", {
    headers: { Accept: "application/json" },
  });

  const setCookie = tokenResponse.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie
    .map((entry) => entry.split(";")[0])
    .filter(Boolean)
    .join("; ");

  const { csrftoken } = (await tokenResponse.json()) as { csrftoken?: string };
  if (!csrftoken) {
    throw new Error("В ответе KASE нет csrftoken.");
  }

  const watcherResponse = await request("https://kase.kz/api/trades/watcher/", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": csrftoken,
      Referer: "https://kase.kz/ru/account/trades",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: new URLSearchParams({
      instruments: "USDKZT_TOM",
      fields: "averageprc,lastdp,tradestatus",
    }).toString(),
  });

  const data = (await watcherResponse.json()) as {
    is_realtime?: boolean;
    server_time?: string;
    data?: { code?: string; fields?: Record<string, { value?: unknown }> }[];
  };
  const row = data?.data?.find((item) => item.code === "USDKZT_TOM");
  if (!row) {
    throw new Error("В ответе KASE нет строки USDKZT_TOM.");
  }

  const raw = row.fields?.averageprc?.value;
  const averagePrice = typeof raw === "number" ? raw : parseFloat(String(raw));
  if (!Number.isFinite(averagePrice)) {
    throw new Error("В ответе KASE нет значения averageprc.");
  }

  return {
    averagePrice,
    isRealtime: Boolean(data.is_realtime),
    serverTime: data.server_time ?? null,
  };
}

// --- National Bank of Kazakhstan: gold per gram, several days -------------
// The page publishes a table of recent days ("# Дата Стоимость" — row
// number, ISO date, tenge figure), so one fetch yields full history. That
// table already skips weekends on its own (a Monday row is followed by the
// prior Friday's), so no business-day filtering is needed here.
const GOLD_KZT_MIN = 5_000;
const GOLD_KZT_MAX = 500_000;
const HISTORY_ROWS_WANTED = 10;

function parseNbkHistoryRows(text: string) {
  const rowPattern = new RegExp(
    `\\b\\d{1,2}\\s+(\\d{4}-\\d{2}-\\d{2})\\s+(${PRICE_PATTERN_SOURCE})`,
    "g",
  );
  const rows: { date: string; pricePerGram: number; index: number; raw: string }[] = [];
  for (const match of text.matchAll(rowPattern)) {
    const price = toNumber(match[2]);
    if (Number.isFinite(price) && price >= GOLD_KZT_MIN && price <= GOLD_KZT_MAX) {
      rows.push({ date: match[1], pricePerGram: price, index: match.index, raw: match[0] });
    }
  }
  return rows;
}

async function fetchNbkGold() {
  const response = await request("https://nationalbank.kz/ru/gold/zoloto");
  const text = toPlainText(await response.text());

  const tableRows = parseNbkHistoryRows(text);
  if (tableRows.length > 0) {
    const seen = new Set<string>();
    const deduped: typeof tableRows = [];
    for (const row of tableRows) {
      if (seen.has(row.date)) continue;
      seen.add(row.date);
      deduped.push(row);
    }
    deduped.sort((a, b) => b.date.localeCompare(a.date));
    const latest = deduped[0];
    const history = deduped
      .slice(0, HISTORY_ROWS_WANTED)
      .map(({ date, pricePerGram }) => ({ date, pricePerGram }))
      .sort((a, b) => a.date.localeCompare(b.date)); // oldest first, for display

    return {
      pricePerGram: latest.pricePerGram,
      date: latest.date,
      strategy: "table-rows",
      matchedContext: contextAround(text, latest.index, latest.raw.length),
      history,
    };
  }

  // Fallback: no recognizable table (layout changed?). Take the first
  // plausible number rather than fail, but be honest that its date isn't
  // confirmed and that there's no history to show.
  const [fallback] = parseNumbers(text, GOLD_KZT_MIN, GOLD_KZT_MAX);
  if (!fallback) {
    throw new Error("На странице Нацбанка не нашли правдоподобную цену.");
  }
  return {
    pricePerGram: fallback.value,
    date: null,
    strategy: "first-plausible-number",
    matchedContext: contextAround(text, fallback.index, fallback.raw.length),
    history: [] as { date: string; pricePerGram: number }[],
  };
}

// Independent sanity check: gold spot converted through the KASE rate should
// land on the National Bank's published gram price. They come from entirely
// separate sources, so close agreement is real evidence the scrape read the
// right number, and a large gap signals it grabbed something else.
const TROY_OUNCE_GRAMS = 31.1034768;

function crossCheckGoldGram(
  nbkGold: MarketData["nbkGold"],
  goldSpot: MarketData["goldSpot"],
  kase: MarketData["kase"],
): MarketData["crossCheck"] {
  if (nbkGold.status !== "ok" || goldSpot.status !== "ok" || kase.status !== "ok") {
    return null;
  }
  const expected = (goldSpot.price / TROY_OUNCE_GRAMS) * kase.averagePrice;
  const deviationPercent = ((nbkGold.pricePerGram - expected) / expected) * 100;
  return {
    expectedFromSpot: Number(expected.toFixed(2)),
    deviationPercent: Number(deviationPercent.toFixed(2)),
    // A scrape that picked up an unrelated number would miss by far more
    // than normal spread and timing drift.
    looksConsistent: Math.abs(deviationPercent) <= 5,
  };
}

async function collect<T extends object>(
  fn: () => Promise<T>,
): Promise<({ status: "ok" } & T) | { status: "error"; message: string }> {
  try {
    return { status: "ok", ...(await fn()) };
  } catch (err) {
    return { status: "error", message: errorMessage(err) };
  }
}

export async function collectMarketData(): Promise<MarketData> {
  const [goldSpot, kase, nbkGold] = await Promise.all([
    collect(fetchGoldSpot),
    collect(fetchKaseAverage),
    collect(fetchNbkGold),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    goldSpot,
    kase,
    nbkGold,
    crossCheck: crossCheckGoldGram(nbkGold, goldSpot, kase),
  };
}
