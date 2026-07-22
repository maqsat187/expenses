"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CATEGORIES } from "@/lib/categories";
import type { ActionState } from "@/app/expenses/actions";

type Props = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    amount: number;
    category: string;
    description: string;
    date: string;
  };
  submitLabel: string;
};

const initialState: ActionState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function ExpenseForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Amount
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultValues?.amount}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Category
        <select
          name="category"
          defaultValue={defaultValues?.category ?? CATEGORIES[0]}
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
          defaultValue={defaultValues?.date}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Description (optional)
        <input
          name="description"
          type="text"
          maxLength={200}
          defaultValue={defaultValues?.description}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
