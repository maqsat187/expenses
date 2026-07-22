"use client";

import { useTransition } from "react";
import { deleteExpense } from "@/app/expenses/actions";

export function DeleteExpenseButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Delete this expense?")) {
          startTransition(() => {
            deleteExpense(id);
          });
        }
      }}
      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
