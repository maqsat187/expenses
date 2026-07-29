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

function parseNumbers(text, min, max) {
  const matches = text.match(/\d{1,3}(?:[\s  ]?\d{3})*(?:[.,]\d{1,2})?/g) ?? [];
  return matches
    .map((raw) => parseFloat(raw.replace(/[\s  ]/g, "").replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= min && n <= max);
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

// --- National Bank of Kazakhstan: price of 1 gram of gold -----------------
// The page's markup isn't documented, so rather than depend on a selector
// that may not exist, this locates the freshest date on the page and takes
// the first plausible tenge figure near it. matchedContext is kept in the
// output so a wrong match is visible and diagnosable rather than silent.
const GOLD_KZT_MIN = 5_000;
const GOLD_KZT_MAX = 500_000;

async function fetchNbkGold() {
  const response = await request("https://nationalbank.kz/ru/gold/zoloto");
  const text = toPlainText(await response.text());

  const dateMatches = [...text.matchAll(/\b(\d{2})\.(\d{2})\.(\d{4})\b/g)];
  let best = null;

  for (const match of dateMatches) {
    const [, day, month, year] = match;
    const timestamp = Date.parse(`${year}-${month}-${day}T00:00:00Z`);
    if (!Number.isFinite(timestamp)) continue;
    // Ignore future dates; a page listing them would otherwise win on
    // recency and hand back a figure that isn't today's.
    if (timestamp > Date.now() + 86_400_000) continue;
    if (!best || timestamp > best.timestamp) {
      best = { timestamp, index: match.index, date: `${day}.${month}.${year}` };
    }
  }

  if (best) {
    const context = text.slice(best.index, best.index + 200);
    const [price] = parseNumbers(
      context.slice(best.date.length),
      GOLD_KZT_MIN,
      GOLD_KZT_MAX,
    );
    if (Number.isFinite(price)) {
      return {
        pricePerGram: price,
        date: best.date,
        strategy: "date-anchored",
        matchedContext: context.slice(0, 200),
      };
    }
  }

  const [fallback] = parseNumbers(text, GOLD_KZT_MIN, GOLD_KZT_MAX);
  if (!Number.isFinite(fallback)) {
    throw new Error("На странице Нацбанка не нашли правдоподобную цену.");
  }
  const at = text.indexOf(String(Math.trunc(fallback)).slice(0, 3));
  return {
    pricePerGram: fallback,
    date: null,
    strategy: "first-plausible-number",
    matchedContext: text.slice(Math.max(0, at - 100), at + 100),
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

const payload = {
  generatedAt: new Date().toISOString(),
  goldSpot,
  kase,
  nbkGold,
};

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`\nЗаписано в ${OUT_PATH}`);
