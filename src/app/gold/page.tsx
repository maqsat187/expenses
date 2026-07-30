"use client";

import Link from "next/link";
import { useState } from "react";
import { fetchMarketData, formatSnapshotTime, type MarketDataResult } from "@/lib/marketData";
import { fetchGoldApiSpot, type SpotPriceResult } from "@/lib/goldPrice";
import { fetchKaseLive, type KaseLiveResult } from "@/lib/kaseRate";
import { buildDailyGoldCoinSeries, nextBusinessDayIso, almatyNow } from "@/lib/goldHistory";
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
  const [liveSpot, setLiveSpot] = useState<SpotPriceResult | null>(null);
  const [liveKase, setLiveKase] = useState<KaseLiveResult | null>(null);

  async function handleForecastClick() {
    setLoading(true);
    setMarket(null);
    setLiveSpot(null);
    setLiveKase(null);
    const [marketResult, spotResult, kaseResult] = await Promise.all([
      fetchMarketData(),
      fetchGoldApiSpot(),
      fetchKaseLive(),
    ]);
    setMarket(marketResult);
    setLiveSpot(spotResult);
    setLiveKase(kaseResult);
    setLoading(false);
  }

  const snapshot = market?.status === "ok" ? market.data : null;
  const nbkOk = snapshot && snapshot.nbkGold.status === "ok" ? snapshot.nbkGold : null;
  const series = nbkOk ? buildDailyGoldCoinSeries(nbkOk.history) : null;
  const recentSeries = series ? series.slice(-HISTORY_DAYS_SHOWN) : null;
  const latest = series && series.length > 0 ? series[series.length - 1] : null;

  // Gold-API allows cross-origin calls, so the live value (as of this
  // click) is preferred; the deploy-time snapshot is only a fallback for
  // when the live request fails.
  const liveGoldSpotOk = liveSpot?.status === "ok" ? liveSpot : null;
  const snapshotGoldSpotOk = snapshot && snapshot.goldSpot.status === "ok" ? snapshot.goldSpot : null;
  const goldSpotPrice = liveGoldSpotOk?.price ?? snapshotGoldSpotOk?.price ?? null;

  // Same live-first pattern as the spot price above: use the browser's own
  // reading when KASE allows it, otherwise the deploy-time snapshot.
  const liveKaseOk = liveKase?.status === "ok" ? liveKase : null;
  const snapshotKaseOk = snapshot && snapshot.kase.status === "ok" ? snapshot.kase : null;
  const kaseSource = liveKaseOk ?? snapshotKaseOk;
  const kaseRate = kaseSource?.averagePrice ?? null;

  const forecastPrice =
    goldSpotPrice !== null && kaseRate !== null ? (goldSpotPrice / 20) * kaseRate : null;

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

      {market && (
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
              {snapshot?.nbkGold.status === "error"
                ? snapshot.nbkGold.message
                : "На странице Нацбанка не нашли таблицу истории в этот раз — доступна только текущая цена (ниже, в исходных данных)."}
            </p>
          )}
        </section>
      )}

      {market && (
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

      {(snapshot || liveSpot) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Исходные данные из источников
          </h2>
          <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
            <SourceCard
              title="Gold-API.com — золото, спот (USD/тройская унция)"
              href="https://gold-api.com/"
              value={goldSpotPrice !== null ? `${goldSpotPrice.toFixed(2)} USD` : null}
              error={
                goldSpotPrice === null
                  ? (liveSpot?.status === "error" ? liveSpot.message : null) ??
                    (snapshot?.goldSpot.status === "error" ? snapshot.goldSpot.message : null)
                  : null
              }
            >
              {goldSpotPrice !== null && (
                <p>
                  {liveGoldSpotOk
                    ? "Живой запрос из браузера на момент нажатия кнопки — этот источник разрешает CORS, в отличие от KASE и Нацбанка ниже."
                    : snapshot
                      ? `Живой запрос не прошёл — показана цена из снэпшота (${formatSnapshotTime(snapshot.generatedAt)}).`
                      : null}
                </p>
              )}
            </SourceCard>
            {snapshot && (
              <>
                <SourceCard
                  title="KASE — USDKZT_TOM, средневзвешенная цена"
                  href="https://kase.kz/ru/account/trades"
                  value={kaseRate !== null ? `${kaseRate.toFixed(2)} ₸` : null}
                  error={
                    kaseRate === null
                      ? (snapshot.kase.status === "error" ? snapshot.kase.message : null) ??
                        (liveKase?.status === "error" ? liveKase.message : null)
                      : null
                  }
                >
                  {kaseSource && (
                    <>
                      <p>
                        {liveKaseOk
                          ? "Живой запрос из браузера на момент нажатия кнопки."
                          : `Из снэпшота (${formatSnapshotTime(snapshot.generatedAt)}) — живой запрос не прошёл.`}
                      </p>
                      {!liveKaseOk && liveKase?.status === "error" && (
                        <p>{liveKase.message}</p>
                      )}
                      <p>
                        {kaseSource.isRealtime
                          ? "Данные в реальном времени."
                          : "Данные с задержкой (анонимный доступ без входа в аккаунт KASE)."}
                        {kaseSource.serverTime &&
                          ` Время биржи на момент запроса: ${kaseSource.serverTime}.`}
                      </p>
                    </>
                  )}
                </SourceCard>
                <SourceCard
                  title="Нацбанк РК — цена 1 г золота в тенге"
                  href="https://nationalbank.kz/ru/gold/zoloto"
                  value={
                    snapshot.nbkGold.status === "ok"
                      ? formatMoney(snapshot.nbkGold.pricePerGram)
                      : null
                  }
                  error={snapshot.nbkGold.status === "error" ? snapshot.nbkGold.message : null}
                >
                  {snapshot.nbkGold.status === "ok" && (
                    <>
                      <p>
                        {snapshot.nbkGold.date
                          ? `Дата на странице подтверждена: ${snapshot.nbkGold.date}.`
                          : "Дата на странице не подтвердилась — взято первое правдоподобное число, возможна погрешность."}
                      </p>
                      <p className="italic">
                        Найдено на странице: «{snapshot.nbkGold.matchedContext}»
                      </p>
                      {snapshot.crossCheck && (
                        <p
                          className={
                            snapshot.crossCheck.looksConsistent
                              ? ""
                              : "font-medium text-amber-700 dark:text-amber-500"
                          }
                        >
                          {snapshot.crossCheck.looksConsistent ? "Сходится" : "Не сходится"} с
                          независимым расчётом из спота и курса KASE (
                          {formatMoney(snapshot.crossCheck.expectedFromSpot)}/г, расхождение{" "}
                          {snapshot.crossCheck.deviationPercent}%).
                        </p>
                      )}
                    </>
                  )}
                </SourceCard>
              </>
            )}
          </div>
          {snapshot && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Снэпшот собран {formatSnapshotTime(snapshot.generatedAt)} на сервере при деплое —
              из него берутся цифры Нацбанка, а также KASE, если живой запрос не прошёл. Gold-API
              и KASE запрашиваются живьём в момент нажатия кнопки; у каждого источника выше
              написано, живая это цифра или из снэпшота.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function SourceCard({
  title,
  href,
  value,
  error,
  children,
}: {
  title: string;
  href: string;
  value: string | null;
  error?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-700 hover:underline dark:text-slate-300"
        >
          {title}
        </a>
        {value !== null ? (
          <span className="shrink-0 font-medium text-slate-700 dark:text-slate-300">{value}</span>
        ) : (
          <span className="shrink-0 text-red-600 dark:text-red-400">ошибка</span>
        )}
      </div>
      {error && <p>{error}</p>}
      {children}
    </div>
  );
}
