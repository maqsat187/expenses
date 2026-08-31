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

// Fixed window of `months` consecutive calendar months ending with the
// current one — the current (still in progress) month is included, so
// today's spending shows up right away rather than waiting for the month
// to finish. A month with no expenses still gets its own zero-value slot
// instead of being skipped (which would otherwise let sparse data quietly
// stretch the window further back than "last N months").
function lastMonthKeys(months: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function monthlyTotals(expenses: Expense[], months = 10): MonthlyValue[] {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  }
  return lastMonthKeys(months).map((month) => ({
    month,
    value: totals.get(month) ?? 0,
  }));
}

export function monthlyTotalsForCategory(
  expenses: Expense[],
  category: string,
  months = 10,
): MonthlyValue[] {
  return monthlyTotals(
    expenses.filter((e) => e.category === category),
    months,
  );
}
