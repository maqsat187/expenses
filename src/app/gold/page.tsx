"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchGoldApiSpot, type SpotPriceResult } from "@/lib/goldPrice";
import { fetchKaseUsdKztAverage, type KaseAverageResult } from "@/lib/kaseRate";
import { fetchNbkGoldPricePerGram, type NbkGoldResult } from "@/lib/nbkGold";
import { formatMoney } from "@/lib/format";

const GRAM_AMOUNTS = [1, 1.555];

export default function GoldCoinPage() {
  const user = useAuthGuard();
  const [loading, setLoading] = useState(false);
  const [spotResult, setSpotResult] = useState<SpotPriceResult | null>(null);
  const [kaseResult, setKaseResult] = useState<KaseAverageResult | null>(null);
  const [nbkGoldResult, setNbkGoldResult] = useState<NbkGoldResult | null>(null);

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
    setKaseResult(null);
    setNbkGoldResult(null);
    const [spot, kase, nbkGold] = await Promise.all([
      fetchGoldApiSpot(),
      fetchKaseUsdKztAverage(),
      fetchNbkGoldPricePerGram(),
    ]);
    setSpotResult(spot);
    setKaseResult(kase);
    setNbkGoldResult(nbkGold);
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

      {kaseResult && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            USD/KZT — средневзвешенная цена (KASE, USDKZT_TOM)
          </h2>
          <KaseRow result={kaseResult} />
        </section>
      )}

      {nbkGoldResult && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Цена золота в тенге (Нацбанк РК)</h2>
          <div className="flex flex-col gap-2">
            {GRAM_AMOUNTS.map((grams) => (
              <NbkGoldRow key={grams} grams={grams} result={nbkGoldResult} />
            ))}
          </div>
          <a
            href="https://nationalbank.kz/ru/gold/zoloto"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-slate-600 hover:underline dark:text-slate-400"
          >
            Открыть nationalbank.kz для проверки вручную →
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

function KaseRow({ result }: { result: KaseAverageResult }) {
  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <a
          href="https://kase.kz/ru/account/trades"
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:underline"
        >
          KASE
        </a>
        {result.status === "ok" ? (
          <span className="font-semibold">
            {result.averagePrice.toFixed(2)} ₸
          </span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Ошибка</span>
        )}
      </div>
      {result.status === "ok" && !result.isRealtime && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Данные с задержкой (анонимный доступ без входа в аккаунт).
        </p>
      )}
      {result.status === "error" && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {result.message}
        </p>
      )}
    </div>
  );
}

function NbkGoldRow({
  grams,
  result,
}: {
  grams: number;
  result: NbkGoldResult;
}) {
  const label = `${grams.toString().replace(".", ",")} г`;
  return (
    <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        {result.status === "ok" ? (
          <span className="font-semibold">
            {formatMoney(result.pricePerGram * grams)}
          </span>
        ) : (
          <span className="text-red-600 dark:text-red-400">Недоступно</span>
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
