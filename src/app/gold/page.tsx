"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchGoldApiSpot, type SpotPriceResult } from "@/lib/goldPrice";
import {
  fetchMarketData,
  formatSnapshotTime,
  type MarketDataResult,
} from "@/lib/marketData";
import { formatMoney } from "@/lib/format";

const GRAM_AMOUNTS = [1, 1.555];

export default function GoldCoinPage() {
  const user = useAuthGuard();
  const [loading, setLoading] = useState(false);
  const [spot, setSpot] = useState<SpotPriceResult | null>(null);
  const [market, setMarket] = useState<MarketDataResult | null>(null);

  if (!user) {
    return null;
  }

  if (user !== "Макс") {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Раздел Gold Coin доступен только профилю Макс.
        </p>
        <Link
          href="/"
          className="text-sm text-slate-600 hover:underline dark:text-slate-400"
        >
          ← Назад к расходам
        </Link>
      </div>
    );
  }

  async function handleForecastClick() {
    setLoading(true);
    setSpot(null);
    setMarket(null);
    const [spotResult, marketResult] = await Promise.all([
      fetchGoldApiSpot(),
      fetchMarketData(),
    ]);
    setSpot(spotResult);
    setMarket(marketResult);
    setLoading(false);
  }

  const snapshot = market?.status === "ok" ? market.data : null;
  // Gold-API allows cross-origin calls, so the browser gets a price as of
  // this click. If that call fails, the deploy-time snapshot still has one.
  const liveSpot = spot?.status === "ok" ? spot.price : null;
  const snapshotSpot =
    snapshot?.goldSpot.status === "ok" ? snapshot.goldSpot.price : null;

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
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Пока это только сбор исходных цен — сам прогноз ещё не считается.
          Перепроверяйте цифры по ссылкам на источники.
        </p>
      </section>

      {market?.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {market.message}
        </p>
      )}

      {(spot || snapshot) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">GOLD SPOT USD</h2>
          <Card
            title="Gold-API.com"
            href="https://gold-api.com/"
            value={
              liveSpot !== null
                ? `${liveSpot.toFixed(2)} USD`
                : snapshotSpot !== null
                  ? `${snapshotSpot.toFixed(2)} USD`
                  : null
            }
            note={
              liveSpot !== null
                ? "Цена на момент нажатия кнопки."
                : snapshotSpot !== null && snapshot
                  ? `Из сохранённых данных (${formatSnapshotTime(snapshot.generatedAt)}) — прямой запрос не прошёл.`
                  : spot?.status === "error"
                    ? spot.message
                    : "Нет данных."
            }
          />
        </section>
      )}

      {snapshot && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">
              USD/KZT — средневзвешенная (KASE, USDKZT_TOM)
            </h2>
            <Card
              title="KASE"
              href="https://kase.kz/ru/account/trades"
              value={
                snapshot.kase.status === "ok"
                  ? `${snapshot.kase.averagePrice.toFixed(2)} ₸`
                  : null
              }
              note={
                snapshot.kase.status === "ok"
                  ? [
                      `Собрано ${formatSnapshotTime(snapshot.generatedAt)}.`,
                      snapshot.kase.isRealtime
                        ? "Данные в реальном времени."
                        : "Данные с задержкой (анонимный доступ).",
                      snapshot.kase.serverTime
                        ? `Время биржи: ${snapshot.kase.serverTime}.`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : snapshot.kase.message
              }
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">
              Цена золота в тенге (Нацбанк РК)
            </h2>
            <div className="flex flex-col gap-2">
              {GRAM_AMOUNTS.map((grams) => (
                <Card
                  key={grams}
                  title={`${grams.toString().replace(".", ",")} г`}
                  value={
                    snapshot.nbkGold.status === "ok"
                      ? formatMoney(snapshot.nbkGold.pricePerGram * grams)
                      : null
                  }
                  note={
                    snapshot.nbkGold.status === "ok"
                      ? snapshot.nbkGold.date
                        ? `На ${snapshot.nbkGold.date}. Собрано ${formatSnapshotTime(snapshot.generatedAt)}.`
                        : `Собрано ${formatSnapshotTime(snapshot.generatedAt)}.`
                      : snapshot.nbkGold.message
                  }
                />
              ))}
            </div>
            {snapshot.crossCheck && (
              <p
                className={
                  snapshot.crossCheck.looksConsistent
                    ? "text-xs text-slate-500 dark:text-slate-400"
                    : "text-xs text-amber-700 dark:text-amber-500"
                }
              >
                {snapshot.crossCheck.looksConsistent
                  ? `Сходится с расчётом из спота и курса KASE (${formatMoney(snapshot.crossCheck.expectedFromSpot)}/г, расхождение ${snapshot.crossCheck.deviationPercent}%).`
                  : `Внимание: расходится с расчётом из спота и курса KASE (${formatMoney(snapshot.crossCheck.expectedFromSpot)}/г, расхождение ${snapshot.crossCheck.deviationPercent}%). Проверьте цифру вручную.`}
              </p>
            )}
            <a
              href="https://nationalbank.kz/ru/gold/zoloto"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-600 hover:underline dark:text-slate-400"
            >
              Открыть nationalbank.kz для проверки вручную →
            </a>
          </section>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  href,
  value,
  note,
}: {
  title: string;
  href?: string;
  value: string | null;
  note?: string | null;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:underline"
          >
            {title}
          </a>
        ) : (
          <span className="font-medium">{title}</span>
        )}
        {value !== null ? (
          <span className="font-semibold">{value}</span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Недоступно</span>
        )}
      </div>
      {note && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
      )}
    </div>
  );
}
