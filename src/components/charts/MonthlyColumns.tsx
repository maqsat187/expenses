import { formatMonth } from "@/lib/format";
import { CATEGORICAL_CLASSES } from "@/lib/palette";

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
    <div className="flex items-end gap-5 overflow-x-auto pb-1">
      {items.map((item) => (
        <div
          key={item.month}
          className="flex w-16 shrink-0 flex-col items-center gap-2"
        >
          <span className="text-xs font-medium tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
            {item.value > 0 ? formatValue(item.value) : ""}
          </span>
          <div
            className="flex h-32 w-7 items-end rounded-sm bg-slate-100 dark:bg-slate-800"
            title={`${formatMonth(item.month)}: ${formatValue(item.value)}`}
          >
            <div
              className={`w-7 rounded-t-[4px] ${CATEGORICAL_CLASSES[0]}`}
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
            {formatMonth(item.month).split(" ")[0].slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}
