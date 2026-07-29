"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchMarketData, formatSnapshotTime, type MarketDataResult } from "@/lib/marketData";
import {
  fetchGoldHistory,
  buildDailyGoldCoinSeries,
  nextBusinessDayIso,
  almatyNow,
  type GoldHistoryResult,
} from "@/lib/goldHistory";
import {
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
  formatDateWithWeekday,
} from "@/lib/format";

const HISTORY_DAYS_SHOWN = 5;

function changeColorClass(value: number | null): string {
  if (value === null || value === 0) return "text-slate-500 dark:text-slate-400";
  return value > 0
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

export default function GoldCoinPage() {
  const [loading, setLoading] = useState(false);
  const [market, setMarket] = useState<MarketDataResult | null>(null);
  const [history, setHistory] = useState<GoldHistoryResult | null>(null);

  async function handleForecastClick() {
    setLoading(true);
    setMarket(null);
    setHistory(null);
    const [marketResult, historyResult] = await Promise.all([
      fetchMarketData(),
      fetchGoldHistory(),
    ]);
    setMarket(marketResult);
    setHistory(historyResult);
    setLoading(false);
  }

  const snapshot = market?.status === "ok" ? market.data : null;
  const series = history?.status === "ok" ? buildDailyGoldCoinSeries(history.entries) : null;
  const recentSeries = series ? series.slice(-HISTORY_DAYS_SHOWN) : null;
  const latest = series && series.length > 0 ? series[series.length - 1] : null;

  const goldSpotOk = snapshot && snapshot.goldSpot.status === "ok" ? snapshot.goldSpot : null;
  const kaseOk = snapshot && snapshot.kase.status === "ok" ? snapshot.kase : null;
  const forecastPrice =
    goldSpotOk && kaseOk ? (goldSpotOk.price / 20) * kaseOk.averagePrice : null;

  const diffAmount =
    forecastPrice !== null && latest ? forecastPrice - latest.goldCoinPrice : null;
  const diffPercent =
    diffAmount !== null && latest ? (diffAmount / latest.goldCoinPrice) * 100 : null;

  const nextBusinessDate = nextBusinessDayIso(almatyNow());

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gold Coin</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Отдельный раздел, не связанный с расходами.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          ← Расходы
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleForecastClick}
          disabled={loading}
          className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {loading ? "Собираем данные…" : "Прогноз цены золота на завтра"}
        </button>
      </section>

      {market?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{market.message}</p>
      )}

      {series && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            История цены Gold Coin (1,555 г) — последние {HISTORY_DAYS_SHOWN} рабочих дней
          </h2>
          {recentSeries && recentSeries.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Дата</th>
                    <th className="px-3 py-2 text-right font-medium">Цена</th>
                    <th className="px-3 py-2 text-right font-medium">Изменение</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {recentSeries.map((point) => (
                    <tr key={point.date}>
                      <td className="px-3 py-2">{formatDateWithWeekday(point.date)}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatMoney(point.goldCoinPrice)}
                      </td>
                      <td className={`px-3 py-2 text-right ${changeColorClass(point.changeAmount)}`}>
                        {point.changeAmount !== null && point.changePercent !== null
                          ? `${formatSignedMoney(point.changeAmount)} (${formatSignedPercent(point.changePercent)})`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400">
              Пока нет накопленной истории — она собирается по расписанию, зайдите позже.
            </p>
          )}
        </section>
      )}
      {history?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{history.message}</p>
      )}

      {(market || history) && (
        <section className="rounded-lg border-2 border-slate-300 p-5 dark:border-slate-700">
          <h2 className="text-lg font-medium">
            Прогноз на {formatDateWithWeekday(nextBusinessDate)}
          </h2>
          {forecastPrice !== null ? (
            <>
              <p className="mt-2 text-3xl font-bold">{formatMoney(forecastPrice)}</p>
              {latest && diffAmount !== null && diffPercent !== null && (
                <p className={`mt-1 text-base font-medium ${changeColorClass(diffAmount)}`}>
                  {formatSignedMoney(diffAmount)} ({formatSignedPercent(diffPercent)}) к цене
                  Нацбанка на {formatDateWithWeekday(latest.date)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              Недоступно: нужны цена золота (Gold-API) и курс KASE, а один из них не загрузился.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Расчёт: (цена золота Gold-API ÷ 20) × средневзвешенный курс USD/KZT KASE — это
            простой пересчёт по формуле, а не гарантированный прогноз. Учтены только выходные
            (сб/вс); праздники РК не исключены.
          </p>
        </section>
      )}

      {snapshot && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Источники:{" "}
          <a href="https://gold-api.com/" target="_blank" rel="noreferrer" className="hover:underline">
            Gold-API.com
          </a>
          ,{" "}
          <a
            href="https://kase.kz/ru/account/trades"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            KASE
          </a>
          ,{" "}
          <a
            href="https://nationalbank.kz/ru/gold/zoloto"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Нацбанк РК
          </a>
          . Данные собраны {formatSnapshotTime(snapshot.generatedAt)}, обновляются по расписанию.
        </p>
      )}
    </div>
  );
}
