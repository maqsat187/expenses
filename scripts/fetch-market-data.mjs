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
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/market-data.json",
);
// Unlike market-data.json (gitignored, rebuilt fresh every run), this file
// is committed back to the repo by the workflow so daily prices accumulate
// across runs instead of only ever holding the latest one.
const HISTORY_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/gold-history.json",
);
const HISTORY_KEEP_DAYS = 40; // comfortably more than the 5 the page shows

// Kazakhstan is UTC+5 year-round (no DST), so "today" for history purposes
// is computed from that offset rather than the runner's UTC clock.
function almatyDateString(date = new Date()) {
  const shifted = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function isWeekday(isoDate) {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
}

async function updateGoldHistory(nbkGold) {
  let history = { entries: [] };
  try {
    history = JSON.parse(await readFile(HISTORY_PATH, "utf8"));
    if (!Array.isArray(history.entries)) history = { entries: [] };
  } catch {
    // No history yet (first run) — start fresh.
  }

  const today = almatyDateString();
  if (nbkGold.status === "ok" && isWeekday(today)) {
    // Replace, not append: the schedule runs every 30 minutes, so a run
    // later in the day should update today's entry rather than duplicate it.
    const withoutToday = history.entries.filter((e) => e.date !== today);
    withoutToday.push({ date: today, nbkPricePerGram: nbkGold.pricePerGram });
    withoutToday.sort((a, b) => a.date.localeCompare(b.date));
    history.entries = withoutToday.slice(-HISTORY_KEEP_DAYS);
  }

  await writeFile(HISTORY_PATH, `${JSON.stringify(history, null, 2)}\n`);
  return history;
}

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
  const found = [];
  // Two alternatives, tried in order: thousands-grouped ("61 889,33", the
  // real site's format) first, then a plain contiguous run ("61889,33") as
  // a fallback in case the grouping ever changes. An earlier version made
  // the separator optional in a single pattern, which was ambiguous —
  // greedy \d{1,3} could eat into a plain run before a grouped match got a
  // chance, silently dropping ungrouped numbers instead of matching them.
  const pattern =
    /\d{1,3}(?:[\s  ]\d{3})+(?:[.,]\d{1,2})?|\d{4,6}(?:[.,]\d{1,2})?/g;
  for (const match of text.matchAll(pattern)) {
    const value = parseFloat(
      match[0].replace(/[\s\u00a0\u202f]/g, "").replace(",", "."),
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

// --- National Bank of Kazakhstan: price of 1 gram of gold -----------------
// The page's markup isn't documented, so rather than depend on a selector
// that may not exist, this looks for a plausible tenge figure near a date.
// matchedContext is kept in the output so a wrong match is visible and
// diagnosable rather than silent.
const GOLD_KZT_MIN = 5_000;
const GOLD_KZT_MAX = 500_000;
const DATE_LOOKBACK_DAYS = 7;

function shiftIsoDate(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function fetchNbkGold() {
  const response = await request("https://nationalbank.kz/ru/gold/zoloto");
  const text = toPlainText(await response.text());

  // Deliberately does NOT pick "the most recent date found anywhere on the
  // page" — a live run against the real site did exactly that and anchored
  // on "01.02.2016" from an archive-links section, not the actual price
  // date (the price value next to it happened to still be right, by
  // coincidence — the date label was not). Probing backward for an *exact*
  // match on today's date, then yesterday's, etc., can't be fooled by
  // unrelated historical dates elsewhere on the page: an archive link would
  // have to happen to name one of the last few real days, which archives by
  // definition don't.
  //
  // Tries both YYYY-MM-DD and DD.MM.YYYY: a later live run's matchedContext
  // showed the page's actual price table uses ISO-style dates
  // ("2026-07-29"), not the DD.MM.YYYY this originally assumed — that
  // mismatch meant date-anchoring silently never matched at all and always
  // fell through to the fallback strategy below (which happened to still
  // land on the right number only because today's row comes first in the
  // table). Both formats are tried since the exact layout isn't confirmed
  // beyond that one capture.
  const todayAlmaty = almatyDateString();
  for (let back = 0; back <= DATE_LOOKBACK_DAYS; back++) {
    const candidateIso = shiftIsoDate(todayAlmaty, -back);
    const [y, m, d] = candidateIso.split("-");
    for (const label of [candidateIso, `${d}.${m}.${y}`]) {
      const index = text.indexOf(label);
      if (index === -1) continue;
      const after = text.slice(index + label.length);
      const [hit] = parseNumbers(after, GOLD_KZT_MIN, GOLD_KZT_MAX);
      if (hit) {
        return {
          pricePerGram: hit.value,
          date: candidateIso,
          strategy: "date-anchored",
          matchedContext: contextAround(text, index, label.length),
        };
      }
    }
  }

  const [fallback] = parseNumbers(text, GOLD_KZT_MIN, GOLD_KZT_MAX);
  if (!fallback) {
    throw new Error("На странице Нацбанка не нашли правдоподобную цену.");
  }
  return {
    pricePerGram: fallback.value,
    date: null,
    strategy: "first-plausible-number",
    matchedContext: contextAround(text, fallback.index, fallback.raw.length),
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

const history = await updateGoldHistory(nbkGold);
console.log(
  `Записано в ${HISTORY_PATH} (${history.entries.length} дн., последняя: ${history.entries.at(-1)?.date ?? "—"})`,
);
