import { formatMonth } from "@/lib/format";

type MonthlyItem = {
  month: string; // "YYYY-MM"
  value: number;
};

export function MonthlyColumns({
  items,
  formatValue,
}: {
  items: MonthlyItem[];
  formatValue: (value: number) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Нет данных.
      </p>
    );
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="flex items-end gap-4 overflow-x-auto pb-1">
      {items.map((item) => (
        <div
          key={item.month}
          className="flex w-14 shrink-0 flex-col items-center gap-1.5"
        >
          <span className="text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300">
            {item.value > 0 ? formatValue(item.value) : ""}
          </span>
          <div
            className="flex h-32 w-6 items-end rounded-sm bg-slate-100 dark:bg-slate-800"
            title={`${formatMonth(item.month)}: ${formatValue(item.value)}`}
          >
            <div
              className="w-6 rounded-t-[4px] bg-[#2a78d6] dark:bg-[#3987e5]"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatMonth(item.month).split(" ")[0].slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}
