#!/usr/bin/env node
// Collects market data from sources that a browser cannot reach directly.
//
// kase.kz and nationalbank.kz don't send CORS headers, so a static page
// served from github.io can't fetch them client-side — the browser blocks
// the response. CORS is a browser-enforced rule though, not a server one:
// a plain server-side request has no origin to check and is never blocked.
// This script runs in GitHub Actions (see .github/workflows/deploy.yml),
// where there's no browser and no CORS, and writes the results to
// public/market-data.json so the deployed page can read them same-origin.
//
// Every source is independent: one failing never aborts the others or the
// build. Failures are recorded in the JSON with their reason so the page
// can show what went wrong instead of silently rendering nothing.
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/market-data.json",
);

// Some of these sites reject requests without a browser-like User-Agent.
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const TIMEOUT_MS = 30_000;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": UA, ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} от ${url}`);
  }
  return response;
}

function errorMessage(err) {
  if (err?.name === "TimeoutError") return "Источник не ответил вовремя.";
  return err instanceof Error ? err.message : String(err);
}

// Strips markup so numbers can be located in readable text.
function toPlainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Matches a Russian-formatted tenge figure: thousands-grouped ("61 889,33",
// the real site's format) or a plain contiguous run ("61889,33") as a
// fallback in case the grouping ever changes. An earlier version made the
// separator optional in a single pattern, which was ambiguous — greedy
// \d{1,3} could eat into a plain run before a grouped match got a chance,
// silently dropping ungrouped numbers instead of matching them.
const PRICE_PATTERN_SOURCE =
  "\\d{1,3}(?:[\\s\\u00a0\\u202f]\\d{3})+(?:[.,]\\d{1,2})?|\\d{4,6}(?:[.,]\\d{1,2})?";

function parseNumbers(text, min, max) {
  const found = [];
  for (const match of text.matchAll(new RegExp(PRICE_PATTERN_SOURCE, "g"))) {
    const value = parseFloat(
      match[0].replace(/[\s  ]/g, "").replace(",", "."),
    );
    if (Number.isFinite(value) && value >= min && value <= max) {
      found.push({ value, index: match.index, raw: match[0] });
    }
  }
  return found;
}

// Quotes the text a number was actually read from. Re-searching for the
// digits afterwards would land on the first coincidental occurrence
// instead, making the recorded context misreport where the value came from.
function contextAround(text, index, rawLength) {
  return text.slice(Math.max(0, index - 90), index + rawLength + 90).trim();
}

// --- GOLD SPOT USD (Gold-API.com) -----------------------------------------
// This one does work from the browser, but it's collected here too so the
// page still has a value to fall back on if the live call fails.
async function fetchGoldSpot() {
  const response = await request("https://api.gold-api.com/price/XAU", {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  if (typeof data?.price !== "number" || !Number.isFinite(data.price)) {
    throw new Error("В ответе Gold-API.com нет поля price.");
  }
  return { price: data.price };
}

// --- KASE USDKZT_TOM weighted average -------------------------------------
// Two-step flow from the user's working script: fetch a CSRF token, then
// POST to the quote-monitor endpoint. Node's fetch has no cookie jar, so
// the session cookies from step one are forwarded to step two by hand.
async function fetchKaseAverage() {
  const tokenResponse = await request("https://kase.kz/api/accounts/get_token/", {
    headers: { Accept: "application/json" },
  });

  const setCookie = tokenResponse.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie
    .map((entry) => entry.split(";")[0])
    .filter(Boolean)
    .join("; ");

  const { csrftoken } = await tokenResponse.json();
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

  const data = await watcherResponse.json();
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

// --- National Bank of Kazakhstan: price of gold per gram, several days ----
// The page itself publishes a small table of recent days ("# Дата
// Стоимость" — row number, an ISO date, a tenge figure), confirmed by a
// live capture: "1 2026-07-29 61 889.33 2 2026-07-28 62 267.21 ...". That
// table already skips weekends on its own (a Monday row is immediately
// followed by the prior Friday's), so parsing every row in one fetch gives
// a full multi-day history directly — no need to accumulate one day at a
// time across separate runs.
const GOLD_KZT_MIN = 5_000;
const GOLD_KZT_MAX = 500_000;
const HISTORY_ROWS_WANTED = 10; // a few more than the 5 the page displays

function parseNbkHistoryRows(text) {
  const rowPattern = new RegExp(
    `\\b\\d{1,2}\\s+(\\d{4}-\\d{2}-\\d{2})\\s+(${PRICE_PATTERN_SOURCE})`,
    "g",
  );
  const rows = [];
  for (const match of text.matchAll(rowPattern)) {
    const date = match[1];
    const price = parseFloat(match[2].replace(/[\s  ]/g, "").replace(",", "."));
    if (Number.isFinite(price) && price >= GOLD_KZT_MIN && price <= GOLD_KZT_MAX) {
      rows.push({ date, pricePerGram: price, index: match.index, raw: match[0] });
    }
  }
  return rows;
}

async function fetchNbkGold() {
  const response = await request("https://nationalbank.kz/ru/gold/zoloto");
  const text = toPlainText(await response.text());

  const tableRows = parseNbkHistoryRows(text);
  if (tableRows.length > 0) {
    // Dedup by date (keep first occurrence) and sort newest-first.
    const seen = new Set();
    const deduped = [];
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
      .sort((a, b) => a.date.localeCompare(b.date)); // oldest-first for display

    return {
      pricePerGram: latest.pricePerGram,
      date: latest.date,
      strategy: "table-rows",
      matchedContext: contextAround(text, latest.index, latest.raw.length),
      history,
    };
  }

  // Fallback: no recognizable table found (page layout changed?) — grab the
  // first plausible number on the page rather than fail outright, but be
  // honest that its date isn't confirmed and there's no history to show.
  const [fallback] = parseNumbers(text, GOLD_KZT_MIN, GOLD_KZT_MAX);
  if (!fallback) {
    throw new Error("На странице Нацбанка не нашли правдоподобную цену.");
  }
  return {
    pricePerGram: fallback.value,
    date: null,
    strategy: "first-plausible-number",
    matchedContext: contextAround(text, fallback.index, fallback.raw.length),
    history: [],
  };
}

// Independent sanity check on the scraped gram price: gold spot converted
// to tenge should land in the same place. The two come from completely
// separate sources (Gold-API + KASE vs. the National Bank's own page), so
// close agreement is strong evidence the scrape grabbed the right number,
// and a large gap is a signal it grabbed something else entirely.
const TROY_OUNCE_GRAMS = 31.1034768;

function crossCheckGoldGram(nbkGold, goldSpot, kase) {
  if (nbkGold.status !== "ok" || goldSpot.status !== "ok" || kase.status !== "ok") {
    return null;
  }
  const expected = (goldSpot.price / TROY_OUNCE_GRAMS) * kase.averagePrice;
  const deviationPercent = ((nbkGold.pricePerGram - expected) / expected) * 100;
  return {
    expectedFromSpot: Number(expected.toFixed(2)),
    deviationPercent: Number(deviationPercent.toFixed(2)),
    // A scrape that picked up an unrelated number (a phone number, a page
    // count) would miss by far more than normal spread and timing drift.
    looksConsistent: Math.abs(deviationPercent) <= 5,
  };
}

async function collect(name, fn) {
  try {
    const value = await fn();
    console.log(`✓ ${name}:`, JSON.stringify(value));
    return { status: "ok", ...value };
  } catch (err) {
    const message = errorMessage(err);
    console.log(`✗ ${name}: ${message}`);
    return { status: "error", message };
  }
}

const [goldSpot, kase, nbkGold] = await Promise.all([
  collect("gold-api", fetchGoldSpot),
  collect("kase", fetchKaseAverage),
  collect("nbk-gold", fetchNbkGold),
]);

const crossCheck = crossCheckGoldGram(nbkGold, goldSpot, kase);
if (crossCheck) {
  const verdict = crossCheck.looksConsistent ? "✓ сходится" : "⚠ РАСХОЖДЕНИЕ";
  console.log(
    `\n${verdict}: цена НБРК ${nbkGold.pricePerGram} ₸/г против ${crossCheck.expectedFromSpot} ₸/г из спота×курса (${crossCheck.deviationPercent}%)`,
  );
}

const payload = {
  generatedAt: new Date().toISOString(),
  goldSpot,
  kase,
  nbkGold,
  crossCheck,
};

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Записано в ${OUT_PATH}`);
