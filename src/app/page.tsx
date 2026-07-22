"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listExpenses, type Expense } from "@/lib/expenses";
import { formatCurrency } from "@/lib/format";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ExpenseTable } from "@/components/ExpenseTable";

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listExpenses()
      .then(setExpenses)
      .catch(() => setError("Could not load expenses from Supabase."));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }
  if (!expenses) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
    );
  }

  const yearMonth = currentYearMonth();
  const monthExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = new Map<string, number>();
  for (const expense of monthExpenses) {
    byCategory.set(
      expense.category,
      (byCategory.get(expense.category) ?? 0) + expense.amount,
    );
  }
  const categoryRows = [...byCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const recentExpenses = expenses.slice(0, 5);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Overview of your spending.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {monthLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(monthTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Expenses this month
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {monthExpenses.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All-time total
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCurrency(allTimeTotal)}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Spending by category</h2>
        <CategoryBreakdown rows={categoryRows} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent expenses</h2>
          <Link
            href="/expenses"
            className="text-sm text-slate-600 hover:underline dark:text-slate-400"
          >
            View all
          </Link>
        </div>
        <ExpenseTable expenses={recentExpenses} />
      </section>
    </div>
  );
}
