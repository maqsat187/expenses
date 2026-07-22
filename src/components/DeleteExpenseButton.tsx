"use client";

import { useState } from "react";
import { deleteExpense } from "@/lib/expenses";

export function DeleteExpenseButton({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted: (id: number) => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Delete this expense?")) return;
    setPending(true);
    try {
      await deleteExpense(id);
      onDeleted(id);
    } catch {
      alert("Failed to delete this expense. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
