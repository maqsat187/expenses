"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useGoldAuthGuard } from "@/lib/useGoldAuthGuard";

export default function ChangePasswordPage() {
  const user = useGoldAuthGuard();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const surname = user.split(" ")[0];
  const name = user.split(" ").slice(1).join(" ");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (newPassword !== confirmPassword) {
      setError("Новый пароль и подтверждение не совпадают.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/gold/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => null);
      if (data?.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(typeof data?.message === "string" ? data.message : "Не удалось сохранить.");
      }
    } catch {
      setError("Не удалось сохранить.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-semibold">Смена пароля</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{user}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="current-password" className="text-sm font-medium">
            Текущий пароль
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="off"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="new-password" className="text-sm font-medium">
            Новый пароль
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="off"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirm-password" className="text-sm font-medium">
            Повторите новый пароль
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="off"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Пароль изменён. Используйте его при следующем входе.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {submitting ? "Сохраняем…" : "Сохранить"}
        </button>
      </form>

      <Link href="/gold" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Gold Coin
      </Link>
    </div>
  );
}
