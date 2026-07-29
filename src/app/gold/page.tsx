"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import {
  fetchGoldApiSpot,
  fetchGoldPriceOrgSpot,
  type SpotPriceResult,
} from "@/lib/goldPrice";
import { fetchKaseUsdKztTomFixings, type KaseFixingResult } from "@/lib/kasePrice";

export default function GoldCoinPage() {
  const user = useAuthGuard();
  const [loading, setLoading] = useState(false);
  const [spotResults, setSpotResults] = useState<SpotPriceResult[] | null>(
    null,
  );
  const [kaseResults, setKaseResults] = useState<KaseFixingResult[] | null>(
    null,
  );

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
    setSpotResults(null);
    setKaseResults(null);
    const [goldApi, goldPriceOrg, kase] = await Promise.all([
      fetchGoldApiSpot(),
      fetchGoldPriceOrgSpot(),
      fetchKaseUsdKztTomFixings(),
    ]);
    setSpotResults([goldApi, goldPriceOrg]);
    setKaseResults(kase);
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

      {spotResults && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">GOLD SPOT USD</h2>
          <div className="flex flex-col gap-2">
            {spotResults.map((result) => (
              <SpotRow key={result.source} result={result} />
            ))}
          </div>
        </section>
      )}

      {kaseResults && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            KASE USDKZT_TOM — средневзвешенная цена
          </h2>
          <div className="flex flex-col gap-2">
            {kaseResults.map((result) => (
              <KaseRow key={result.time} result={result} />
            ))}
          </div>
          <a
            href="https://kase.kz/ru/currency/"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-slate-600 hover:underline dark:text-slate-400"
          >
            Открыть kase.kz для проверки вручную →
          </a>
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

function KaseRow({ result }: { result: KaseFixingResult }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">Фиксинг {result.time}</span>
        {result.status === "error" && (
          <span className="text-red-600 dark:text-red-400">Недоступно</span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {result.status === "ok" ? result.snippet : result.message}
      </p>
    </div>
  );
}
