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
    if (!confirm("Удалить эту запись?")) return;
    setPending(true);
    try {
      await deleteExpense(id);
      onDeleted(id);
    } catch {
      alert("Не удалось удалить запись. Попробуйте ещё раз.");
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
      {pending ? "Удаление…" : "Удалить"}
    </button>
  );
}
