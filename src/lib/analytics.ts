import type { Expense } from "@/lib/expenses";
import { toDateInputValue } from "@/lib/format";

export type Period = "month" | "quarter" | "all";

export function filterByPeriod(expenses: Expense[], period: Period): Expense[] {
  if (period === "all") return expenses;
  const now = new Date();
  const monthsBack = period === "month" ? 0 : 2;
  const cutoff = toDateInputValue(
    new Date(now.getFullYear(), now.getMonth() - monthsBack, 1),
  );
  return expenses.filter((e) => e.date >= cutoff);
}

export function sumAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function sumBonus(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.bonus, 0);
}

export type GroupedValue = { label: string; value: number };

export function groupSum(
  expenses: Expense[],
  keyFn: (e: Expense) => string,
  valueFn: (e: Expense) => number = (e) => e.amount,
): GroupedValue[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const key = keyFn(expense);
    totals.set(key, (totals.get(key) ?? 0) + valueFn(expense));
  }
  return [...totals.entries()].map(([label, value]) => ({ label, value }));
}

// Keeps the top `keep` entries and folds the rest into one "Other" bucket,
// matching the categorical palette's ~8-slot ceiling.
export function foldTail(
  items: GroupedValue[],
  keep = 7,
  otherLabel = "Другое",
): GroupedValue[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= keep + 1) return sorted;
  const head = sorted.slice(0, keep);
  const tailSum = sorted.slice(keep).reduce((sum, i) => sum + i.value, 0);
  return [...head, { label: otherLabel, value: tailSum }];
}

export type MonthlyValue = { month: string; value: number };

export function monthlyTotals(expenses: Expense[], months = 12): MonthlyValue[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, value]) => ({ month, value }));
}
