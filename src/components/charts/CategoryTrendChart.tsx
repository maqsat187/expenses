import { formatMonth } from "@/lib/format";
import { CATEGORICAL_CLASSES } from "@/lib/palette";
import type { MonthlyCategoryPoint } from "@/lib/analytics";

export function CategoryTrendChart({
  points,
  formatValue,
}: {
  points: MonthlyCategoryPoint[];
  formatValue: (value: number) => string;
}) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Нет данных.
      </p>
    );
  }

  const labels = points[0].values.map((v) => v.label);
  const totals = points.map((p) => p.values.reduce((sum, v) => sum + v.value, 0));
  const max = Math.max(...totals, 1);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {labels.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5 text-xs">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORICAL_CLASSES[i % CATEGORICAL_CLASSES.length]}`}
            />
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-5 overflow-x-auto pb-1">
        {points.map((point, index) => {
          const total = totals[index];
          return (
            <div
              key={point.month}
              className="flex w-16 shrink-0 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">
                {total > 0 ? formatValue(total) : ""}
              </span>
              <div className="flex h-40 w-7 flex-col-reverse gap-[2px] overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
                {point.values.map((v, i) =>
                  v.value > 0 ? (
                    <div
                      key={v.label}
                      className={`w-7 ${CATEGORICAL_CLASSES[i % CATEGORICAL_CLASSES.length]}`}
                      style={{ height: `${(v.value / max) * 100}%` }}
                      title={`${v.label}: ${formatValue(v.value)}`}
                    />
                  ) : null,
                )}
              </div>
              <span className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                {formatMonth(point.month).split(" ")[0].slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
