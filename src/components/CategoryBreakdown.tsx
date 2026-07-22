import { formatCurrency } from "@/lib/format";
import { categoryColor } from "@/lib/categories";

type Row = { category: string; total: number };

export function CategoryBreakdown({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No expenses yet this month.
      </p>
    );
  }

  const max = Math.max(...rows.map((row) => row.total));

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.category} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-slate-600 dark:text-slate-400">
            {row.category}
          </span>
          <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-2 rounded-full ${categoryColor(row.category)}`}
              style={{ width: `${(row.total / max) * 100}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-sm font-medium">
            {formatCurrency(row.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}
