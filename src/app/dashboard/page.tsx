"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listExpenses, type Expense } from "@/lib/expenses";
import { useAuthGuard } from "@/lib/useAuthGuard";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  formatDate,
} from "@/lib/format";
import {
  filterByPeriod,
  foldTail,
  groupSum,
  monthlyTotals,
  monthlyTotalsForCategory,
  sumAmount,
  sumBonus,
  type Period,
} from "@/lib/analytics";
import { describeError } from "@/lib/errors";
import { StatTile } from "@/components/StatTile";
import { BarList } from "@/components/charts/BarList";
import { MonthlyColumns } from "@/components/charts/MonthlyColumns";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Этот месяц" },
  { value: "previousMonth", label: "Прошлый месяц" },
  { value: "all", label: "Всё время" },
];

export default function DashboardPage() {
  const user = useAuthGuard();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listExpenses()
      .then(setExpenses)
      .catch((err) =>
        setError(`Не удалось загрузить расходы из Supabase.${describeError(err)}`),
      );
  }, [user]);

  const scoped = useMemo(
    () => (expenses ? filterByPeriod(expenses, period) : []),
    [expenses, period],
  );

  const total = sumAmount(scoped);
  const bonusTotal = sumBonus(scoped);
  const avgBonusPercent = total !== 0 ? (bonusTotal / total) * 100 : 0;

  const byCategory = foldTail(groupSum(scoped, (e) => e.category));
  const byBank = foldTail(groupSum(scoped, (e) => e.payment_method));
  const bonusByBank = foldTail(
    groupSum(scoped, (e) => e.payment_method, (e) => e.bonus),
  );
  const trend = monthlyTotals(expenses ?? [], 12);

  const categoryOptions = groupSum(expenses ?? [], (e) => e.category)
    .sort((a, b) => b.value - a.value)
    .map((c) => c.label);
  const activeCategory = selectedCategory ?? categoryOptions[0] ?? null;
  const categoryTrend = activeCategory
    ? monthlyTotalsForCategory(expenses ?? [], activeCategory, 12)
    : [];
  const categoryTrendTotal = categoryTrend.reduce((sum, m) => sum + m.value, 0);

  const topExpenses = [...scoped]
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Дашборды</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Анализ расходов.
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          ← Назад
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {!expenses && !error && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Загрузка…
        </p>
      )}

      {expenses && (
        <>
          <div className="flex gap-2" role="group" aria-label="Период">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  period === option.value
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatTile label="Всего потрачено" value={formatCurrency(total)} />
            <StatTile
              label="Бонусов получено"
              value={formatCurrency(bonusTotal)}
            />
            <StatTile
              label="Средний % бонуса"
              value={formatPercent(avgBonusPercent)}
            />
            <StatTile label="Операций" value={String(scoped.length)} />
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">По категориям</h2>
            <BarList items={byCategory} formatValue={formatCurrency} />
          </section>

          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">По способу БВУ</h2>
              <BarList items={byBank} formatValue={formatCurrency} />
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium">Бонусы по способу БВУ</h2>
              <BarList items={bonusByBank} formatValue={formatCurrency} />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">
              По месяцам (последние 12)
            </h2>
            <MonthlyColumns items={trend} formatValue={formatCompactCurrency} />
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">По категории по месяцам</h2>
              {categoryOptions.length > 0 && (
                <select
                  value={activeCategory ?? ""}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {activeCategory ? (
              <>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Итого за 12 мес.:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(categoryTrendTotal)}
                  </span>
                </p>
                <MonthlyColumns
                  items={categoryTrend}
                  formatValue={formatCompactCurrency}
                />
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Нет данных.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">Крупнейшие траты</h2>
            {topExpenses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Нет данных за период.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {topExpenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">{expense.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(expense.date)} · {expense.category}
                      </p>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(expense.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
