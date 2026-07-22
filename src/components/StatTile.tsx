export function StatTile({
  label,
  value,
  subtle,
}: {
  label: string;
  value: string;
  subtle?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {subtle && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {subtle}
        </p>
      )}
    </div>
  );
}
