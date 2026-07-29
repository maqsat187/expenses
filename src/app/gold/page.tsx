"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import {
  fetchGoldApiSpot,
  goldPriceForGrams,
  type SpotPriceResult,
} from "@/lib/goldPrice";
import { fetchNbkUsdKztRate, type NbkRateResult } from "@/lib/nbkRate";
import { formatMoney } from "@/lib/format";

const GRAM_AMOUNTS = [1, 1.555];

export default function GoldCoinPage() {
  const user = useAuthGuard();
  const [loading, setLoading] = useState(false);
  const [spotResult, setSpotResult] = useState<SpotPriceResult | null>(null);
  const [nbkResult, setNbkResult] = useState<NbkRateResult | null>(null);

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
    setSpotResult(null);
    setNbkResult(null);
    const [spot, nbk] = await Promise.all([
      fetchGoldApiSpot(),
      fetchNbkUsdKztRate(),
    ]);
    setSpotResult(spot);
    setNbkResult(nbk);
    setLoading(false);
  }

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
          Пока это только сбор исходных цен из внешних источников — сам
          прогноз ещё не считается. Источники указаны рядом с каждым
          значением, перепроверяйте цифры вручную по ссылкам.
        </p>
      </section>

      {spotResult && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">GOLD SPOT USD</h2>
          <SpotRow result={spotResult} />
        </section>
      )}

      {nbkResult && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Курс USD/KZT (Нацбанк РК)</h2>
          <NbkRow result={nbkResult} />
        </section>
      )}

      {(spotResult || nbkResult) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Цена золота в тенге</h2>
          <div className="flex flex-col gap-2">
            {GRAM_AMOUNTS.map((grams) => (
              <GramRow
                key={grams}
                grams={grams}
                spotResult={spotResult}
                nbkResult={nbkResult}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SpotRow({ result }: { result: SpotPriceResult }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <a
          href={result.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:underline"
        >
          {result.source}
        </a>
        {result.status === "ok" ? (
          <span className="font-semibold">{result.price.toFixed(2)} USD</span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Ошибка</span>
        )}
      </div>
      {result.status === "error" && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {result.message}
        </p>
      )}
    </div>
  );
}

function NbkRow({ result }: { result: NbkRateResult }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <a
          href="https://nationalbank.kz/ru/exchangerates/ezhednevnye-oficialnye-rynochnye-kursy-valyut"
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:underline"
        >
          Нацбанк РК
        </a>
        {result.status === "ok" ? (
          <span className="font-semibold">{result.rate.toFixed(2)} ₸</span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Ошибка</span>
        )}
      </div>
      {result.status === "error" && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {result.message}
        </p>
      )}
    </div>
  );
}

function GramRow({
  grams,
  spotResult,
  nbkResult,
}: {
  grams: number;
  spotResult: SpotPriceResult | null;
  nbkResult: NbkRateResult | null;
}) {
  const label = `${grams.toString().replace(".", ",")} г`;
  const canCompute = spotResult?.status === "ok" && nbkResult?.status === "ok";

  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        {canCompute ? (
          <span className="font-semibold">
            {formatMoney(
              goldPriceForGrams(spotResult.price, nbkResult.rate, grams),
            )}
          </span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Недоступно</span>
        )}
      </div>
      {!canCompute && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Нужны обе цифры выше — цена золота и курс Нацбанка.
        </p>
      )}
    </div>
  );
}
