"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listExpenses,
  createExpense,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { describeError } from "@/lib/errors";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";

export default function EntryPage() {
  const user = useAuthGuard();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    listExpenses()
      .then(setExpenses)
      .catch((err) =>
        setError(`Не удалось загрузить расходы из Supabase.${describeError(err)}`),
      );
  }, [user]);

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
          <ExpenseTable
            expenses={expenses}
            showActions
            editingId={editingId}
            onEditStart={setEditingId}
            onEditCancel={() => setEditingId(null)}
            onEditSave={handleEditSave}
            onDeleted={(id) =>
              setExpenses((prev) => prev?.filter((e) => e.id !== id) ?? prev)
            }
          />
        )}
      </section>
    </div>
  );
}
