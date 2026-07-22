import Link from "next/link";
import type { Expense } from "@/generated/prisma/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { categoryColor } from "@/lib/categories";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No expenses found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Description</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td className="px-4 py-2 whitespace-nowrap">
                {formatDate(expense.date)}
              </td>
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${categoryColor(expense.category)}`}
                  />
                  {expense.category}
                </span>
              </td>
              <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                {expense.description ?? "—"}
              </td>
              <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                {formatCurrency(expense.amount)}
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/expenses/${expense.id}/edit`}
                    className="text-sm text-slate-600 hover:underline dark:text-slate-400"
                  >
                    Edit
                  </Link>
                  <DeleteExpenseButton id={expense.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
