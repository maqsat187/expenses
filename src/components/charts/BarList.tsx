import { CATEGORICAL_CLASSES } from "@/lib/palette";

type BarListItem = {
  label: string;
  value: number;
};

// Ranked magnitude comparison across nominal categories: every bar shares
// one hue (the palette's validated categorical slot 1) rather than a color
// per category, since color here isn't carrying identity — the label is.
export function BarList({
  items,
  formatValue,
  emptyLabel = "Нет данных за период.",
}: {
  items: BarListItem[];
  formatValue: (value: number) => string;
  emptyLabel?: string;
}) {
  const positiveItems = items.filter((item) => item.value > 0);

  if (positiveItems.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...positiveItems.map((item) => item.value));

  return (
    <ul className="flex flex-col gap-2.5">
      {positiveItems.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span
            className="w-32 shrink-0 truncate text-sm text-slate-600 dark:text-slate-400"
            title={item.label}
          >
            {item.label}
          </span>
          <div className="h-5 flex-1 rounded-sm bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-5 rounded-[4px] ${CATEGORICAL_CLASSES[0]}`}
              style={{ width: `${(item.value / max) * 100}%` }}
              title={`${item.label}: ${formatValue(item.value)}`}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">
            {formatValue(item.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
