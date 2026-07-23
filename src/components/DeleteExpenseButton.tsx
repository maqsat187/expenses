"use client";

import { useState } from "react";
import { deleteExpense } from "@/lib/expenses";
import { describeError } from "@/lib/errors";
import { TrashIcon } from "@/components/icons";

export function DeleteExpenseButton({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted: (id: number) => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Удалить эту запись?")) return;
    setPending(true);
    try {
      await deleteExpense(id);
      onDeleted(id);
    } catch (err) {
      alert(`Не удалось удалить запись. Попробуйте ещё раз.${describeError(err)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      title="Удалить"
      aria-label="Удалить запись"
      className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
