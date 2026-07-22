"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES, isCategory } from "@/lib/categories";
import type { ExpenseInput } from "@/lib/expenses";
import { toDateInputValue } from "@/lib/format";

type Props = {
  initialValues?: ExpenseInput;
  submitLabel: string;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onCancel?: () => void;
};

export function ExpenseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const amount = Number(String(formData.get("amount") ?? "").trim());
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!isCategory(category)) {
      setError("Choose a valid category.");
      return;
    }
    if (Number.isNaN(new Date(date).getTime())) {
      setError("Enter a valid date.");
      return;
    }

    setPending(true);
    try {
      await onSubmit({
        amount,
        category,
        description: description || null,
        date,
      });
      if (!initialValues) {
        event.currentTarget.reset();
      }
    } catch {
      setError("Something went wrong saving this expense. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      {error && (
        <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Amount
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={initialValues?.amount}
          required
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Category
        <select
          name="category"
          defaultValue={initialValues?.category ?? CATEGORIES[0]}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Date
        <input
          name="date"
          type="date"
          defaultValue={
            initialValues?.date ?? toDateInputValue(new Date())
          }
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-sm font-medium">
        Description (optional)
        <input
          name="description"
          type="text"
          maxLength={200}
          defaultValue={initialValues?.description ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
