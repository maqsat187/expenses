"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listExpenses,
  createExpense,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { describeError } from "@/lib/errors";
import { formatCurrency, formatMonth, formatPercent } from "@/lib/format";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";

export default function EntryPage() {
  const user = useAuthGuard();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterCategories, setFilterCategories] = useState<Set<string>>(
    new Set(),
  );
  const [filterMonths, setFilterMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    listExpenses()
      .then(setExpenses)
      .catch((err) =>
        setError(`Не удалось загрузить расходы из Supabase.${describeError(err)}`),
      );
  }, [user]);

  const monthOptions = useMemo(() => {
    const months = new Set((expenses ?? []).map((e) => e.date.slice(0, 7)));
    return [...months]
      .sort()
      .reverse()
      .map((month) => ({ value: month, label: formatMonth(month) }));
  }, [expenses]);

  const categoryOptions = useMemo(() => {
    const categories = new Set((expenses ?? []).map((e) => e.category));
    return [...categories]
      .sort((a, b) => a.localeCompare(b, "ru"))
      .map((category) => ({ value: category, label: category }));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return (expenses ?? []).filter((e) => {
      if (filterCategories.size > 0 && !filterCategories.has(e.category))
        return false;
      if (filterMonths.size > 0 && !filterMonths.has(e.date.slice(0, 7)))
        return false;
      return true;
    });
  }, [expenses, filterCategories, filterMonths]);

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredBonusTotal = filteredExpenses.reduce(
    (sum, e) => sum + e.bonus,
    0,
  );
  const filteredAvgBonusPercent =
    filteredTotal !== 0 ? (filteredBonusTotal / filteredTotal) * 100 : 0;
  const isFiltered = filterCategories.size > 0 || filterMonths.size > 0;

  if (!user) {
    return null;
  }

  // A failure here means the list on screen may be one row stale until the
  // next successful refresh — not that the save itself failed, so it's
  // deliberately not re-thrown (the form above would report it as a save
  // error, which would be wrong: createExpense/updateExpense already
  // succeeded by the time this runs).
  async function refreshExpenses() {
    try {
      setExpenses(await listExpenses());
      setError(null);
    } catch (err) {
      setError(
        `Расход сохранён, но не удалось обновить список. Обновите страницу.${describeError(err)}`,
      );
    }
  }

  async function handleCreate(input: Omit<ExpenseInput, "user_name">) {
    await createExpense({ ...input, user_name: user });
    await refreshExpenses();
  }

  async function handleEditSave(id: number, input: ExpenseInput) {
    await updateExpense(id, input);
    await refreshExpenses();
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Расходы</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Вы вошли как {user}.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Дашборды
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Добавить расход</h2>
        <ExpenseForm submitLabel="Добавить" onSubmit={handleCreate} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Все записи</h2>
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
            <div className="flex flex-wrap items-center gap-3">
              <MultiSelectFilter
                label="Месяцы"
                placeholder="Все месяцы"
                options={monthOptions}
                selected={filterMonths}
                onChange={setFilterMonths}
              />
              <MultiSelectFilter
                label="Категории"
                placeholder="Все категории"
                options={categoryOptions}
                selected={filterCategories}
                onChange={setFilterCategories}
              />
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterMonths(new Set());
                    setFilterCategories(new Set());
                  }}
                  className="text-sm text-slate-600 hover:underline dark:text-slate-400"
                >
                  Сбросить фильтр
                </button>
              )}
            </div>

            {isFiltered && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Найдено записей: {filteredExpenses.length}. Сумма:{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(filteredTotal)}
                </span>
                . Бонусов:{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(filteredBonusTotal)}
                </span>{" "}
                (
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatPercent(filteredAvgBonusPercent)}
                </span>{" "}
                в среднем)
              </p>
            )}

            <ExpenseTable
              expenses={filteredExpenses}
              showActions
              editingId={editingId}
              onEditStart={setEditingId}
              onEditCancel={() => setEditingId(null)}
              onEditSave={handleEditSave}
              onDeleted={(id) =>
                setExpenses((prev) => prev?.filter((e) => e.id !== id) ?? prev)
              }
            />
          </>
        )}
      </section>
    </div>
  );
}
