"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function NumberPad({
  onDigit,
  onBackspace,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map((key, index) =>
        key === "" ? (
          <div key={index} />
        ) : (
          <button
            key={index}
            type="button"
            onClick={() => (key === "⌫" ? onBackspace() : onDigit(key))}
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700"
          >
            {key}
          </button>
        ),
      )}
    </div>
  );
}
