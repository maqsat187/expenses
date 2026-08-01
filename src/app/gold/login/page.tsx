"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { setCurrentUser } from "@/lib/goldAuth";

export default function GoldLoginPage() {
  const router = useRouter();
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, password }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok: true; displayName: string }
        | { ok: false }
        | null;

      if (data?.ok) {
        setCurrentUser(data.displayName);
        router.replace("/gold");
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-semibold">Вход в Gold Coin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Отдельный вход, не связанный с учётом расходов.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="surname" className="text-sm font-medium">
            Фамилия
          </label>
          <input
            id="surname"
            type="text"
            autoComplete="off"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Имя
          </label>
          <input
            id="name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Неверные данные для входа
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {submitting ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
