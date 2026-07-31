"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchMarketData, formatSnapshotTime, type MarketDataResult } from "@/lib/marketData";
import {
  buildDailyGoldCoinSeries,
  nextBusinessDayIso,
  almatyNow,
  almatyTodayIso,
  GOLD_COIN_GRAMS,
} from "@/lib/goldHistory";
import {
  formatMoney,
  formatSignedMoney,
  formatSignedPercent,
  formatDateWithWeekday,
} from "@/lib/format";
import { clearCurrentUser, isAdmin, canEditGoldPrice } from "@/lib/goldAuth";
import { useGoldAuthGuard } from "@/lib/useGoldAuthGuard";
import { GoldPurchaseLimits } from "@/components/GoldPurchaseLimits";

const HISTORY_DAYS_SHOWN = 5;

function changeColorClass(value: number | null): string {
  if (value === null || value === 0) return "text-slate-500 dark:text-slate-400";
  return value > 0
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

export default function GoldCoinPage() {
  const router = useRouter();
  const user = useGoldAuthGuard();
  const [loading, setLoading] = useState(false);
  const [market, setMarket] = useState<MarketDataResult | null>(null);

  async function handleForecastClick() {
    setLoading(true);
    setMarket(null);
    setMarket(await fetchMarketData());
    setLoading(false);
  }

  const snapshot = market?.status === "ok" ? market.data : null;
  const nbkOk = snapshot && snapshot.nbkGold.status === "ok" ? snapshot.nbkGold : null;
  const series = nbkOk ? buildDailyGoldCoinSeries(nbkOk.history) : null;
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

  const todayIso = almatyTodayIso();
  const nbkHasLiveToday = nbkOk?.date === todayIso && nbkOk.strategy === "table-rows";
  const nbkManualValue =
    nbkOk?.strategy === "manual-override" ? nbkOk.pricePerGram * GOLD_COIN_GRAMS : null;

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gold Coin</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isAdmin(user) && (
            <Link
              href="/gold/visits"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              История посещений
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              clearCurrentUser();
              router.replace("/gold/login");
            }}
            className="text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            Выйти
          </button>
        </div>
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
          {canEditGoldPrice(user) && !nbkHasLiveToday && (
            <NbkOverrideForm
              user={user}
              todayIso={todayIso}
              currentValue={nbkManualValue}
              onSaved={handleForecastClick}
            />
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

      {snapshot && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Исходные данные из источников
          </h2>
          <div className="flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
            <SourceCard
              title="Gold-API.com — золото, спот (USD/тройская унция)"
              href="https://gold-api.com/"
              value={goldSpotOk ? `${goldSpotOk.price.toFixed(2)} USD` : null}
              error={snapshot.goldSpot.status === "error" ? snapshot.goldSpot.message : null}
            />
            <SourceCard
              title="KASE — USDKZT_TOM, средневзвешенная цена"
              href="https://kase.kz/ru/account/trades"
              value={kaseOk ? `${kaseOk.averagePrice.toFixed(2)} ₸` : null}
              error={snapshot.kase.status === "error" ? snapshot.kase.message : null}
            >
              {kaseOk && (
                <p className={kaseOk.stale ? "font-medium text-amber-700 dark:text-amber-500" : ""}>
                  {kaseOk.stale ? (
                    <>
                      Свежих данных нет — показана последняя известная цена от{" "}
                      {formatSnapshotTime(kaseOk.asOf)}. Попробуйте позже, в течение торговой
                      сессии (с 10:30 по Алматы).
                    </>
                  ) : (
                    <>
                      {kaseOk.isRealtime
                        ? "Данные в реальном времени."
                        : "Данные с задержкой ~15 минут (анонимный доступ без входа в аккаунт KASE)."}
                      {kaseOk.serverTime && ` Время биржи на момент запроса: ${kaseOk.serverTime}.`}
                    </>
                  )}
                </p>
              )}
            </SourceCard>
            <SourceCard
              title="Нацбанк РК — цена 1 г золота в тенге"
              href="https://nationalbank.kz/ru/gold/zoloto"
              value={nbkOk ? formatMoney(nbkOk.pricePerGram) : null}
              error={snapshot.nbkGold.status === "error" ? snapshot.nbkGold.message : null}
            >
              {nbkOk && (
                <>
                  {nbkOk.strategy === "manual-override" ? (
                    <p className="font-medium text-amber-700 dark:text-amber-500">
                      {nbkOk.matchedContext}
                    </p>
                  ) : (
                    <>
                      <p>
                        {nbkOk.date
                          ? `Дата на странице подтверждена: ${nbkOk.date}.`
                          : "Дата на странице не подтвердилась — взято первое правдоподобное число, возможна погрешность."}
                      </p>
                      <p className="italic">Найдено на странице: «{nbkOk.matchedContext}»</p>
                    </>
                  )}
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
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Все три источника запрошены на сервере в {formatSnapshotTime(snapshot.generatedAt)} —
            в момент нажатия кнопки, а не заранее. Нажмите ещё раз, чтобы обновить.
          </p>
        </section>
      )}

      {isAdmin(user) && <GoldPurchaseLimits user={user} />}
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

function NbkOverrideForm({
  user,
  todayIso,
  currentValue,
  onSaved,
}: {
  user: string;
  todayIso: string;
  currentValue: number | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(
    currentValue !== null ? String(Math.round(currentValue)) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const coinPrice = Number(value);
    if (!Number.isFinite(coinPrice) || coinPrice <= 0) {
      setError("Введите цену числом больше нуля.");
      return;
    }

    setSaving(true);
    setError(null);
    const surname = user.split(" ")[0];
    const name = user.split(" ").slice(1).join(" ");

    try {
      const response = await fetch("/api/gold/nbk-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, date: todayIso, coinPrice }),
      });
      const data = await response.json().catch(() => null);
      if (data?.ok) {
        onSaved();
      } else {
        setError(typeof data?.message === "string" ? data.message : "Не удалось сохранить.");
      }
    } catch {
      setError("Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="nbk-override-price"
          className="text-xs font-medium text-amber-800 dark:text-amber-300"
        >
          {currentValue !== null
            ? "Данных Нацбанка за сегодня всё ещё нет — обновить введённую вручную цену (₸ за монету, 1,555 г):"
            : "Данных Нацбанка за сегодня ещё нет — ввести цену вручную (₸ за монету, 1,555 г):"}
        </label>
        <input
          id="nbk-override-price"
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          required
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {saving ? "Сохраняем…" : "Сохранить"}
      </button>
      {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
