"use client";

import { useEffect, useState } from "react";
import {
  listExpenses,
  createExpense,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    listExpenses()
      .then(setExpenses)
      .catch(() => setError("Could not load expenses from Supabase."));
  }, []);

  async function handleCreate(input: ExpenseInput) {
    await createExpense(input);
    setExpenses(await listExpenses());
  }

  async function handleEditSave(id: number, input: ExpenseInput) {
    await updateExpense(id, input);
    setExpenses(await listExpenses());
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">All expenses</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add, edit, and remove expenses.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Add expense</h2>
        <ExpenseForm submitLabel="Add expense" onSubmit={handleCreate} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Expenses</h2>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!expenses && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading…
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
