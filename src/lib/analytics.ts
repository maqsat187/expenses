import type { Expense } from "@/lib/expenses";
import { toDateInputValue } from "@/lib/format";

export type Period = "month" | "previousMonth" | "all";

export function filterByPeriod(expenses: Expense[], period: Period): Expense[] {
  if (period === "all") return expenses;
  const now = new Date();

  if (period === "month") {
    const start = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
    return expenses.filter((e) => e.date >= start);
  }

  const start = toDateInputValue(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const end = toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  return expenses.filter((e) => e.date >= start && e.date < end);
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
  otherLabel = "Прочее",
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

export type MonthlyCategoryPoint = { month: string; values: GroupedValue[] };

// Category spending per month, over the last `months` months present in the
// data. The category set (and its stacking order) is fixed once from the
// window's overall totals — top `keep` + "Other" — so every month's bar
// stacks the same categories in the same order and color.
export function monthlyCategoryTotals(
  expenses: Expense[],
  months = 6,
  keep = 7,
): MonthlyCategoryPoint[] {
  const monthKeys = [...new Set(expenses.map((e) => e.date.slice(0, 7)))]
    .sort()
    .slice(-months);
  const windowSet = new Set(monthKeys);
  const windowExpenses = expenses.filter((e) => windowSet.has(e.date.slice(0, 7)));

  const otherLabel = "Прочее";
  const overall = foldTail(groupSum(windowExpenses, (e) => e.category), keep, otherLabel);
  const categoryOrder = overall.map((c) => c.label);
  const topCategories = new Set(categoryOrder.filter((label) => label !== otherLabel));

  return monthKeys.map((month) => {
    const sums = new Map<string, number>();
    for (const expense of windowExpenses) {
      if (expense.date.slice(0, 7) !== month) continue;
      const key = topCategories.has(expense.category) ? expense.category : otherLabel;
      sums.set(key, (sums.get(key) ?? 0) + expense.amount);
    }
    return {
      month,
      values: categoryOrder.map((label) => ({ label, value: sums.get(label) ?? 0 })),
    };
  });
}
