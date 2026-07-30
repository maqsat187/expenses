"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { isAdmin } from "@/lib/auth";
import { formatSnapshotTime } from "@/lib/marketData";

type Visit = {
  id: number;
  created_at: string;
  surname: string;
  name: string;
  success: boolean;
  ip: string | null;
  user_agent: string | null;
};

export default function VisitsPage() {
  const user = useAuthGuard();
  const [password, setPassword] = useState("");
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  if (!isAdmin(user)) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Доступ запрещён</h1>
        <Link href="/gold" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
          ← Gold Coin
        </Link>
      </div>
    );
  }

  const [surname, name] = [user.split(" ")[0], user.split(" ").slice(1).join(" ")];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, password }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok: true; visits: Visit[] }
        | { ok: false }
        | null;

      if (data?.ok) {
        setVisits(data.visits);
      } else if (response.status === 403) {
        setError("Неверный пароль");
      } else {
        setError("Не удалось загрузить историю (сервер вернул ошибку)");
      }
    } catch {
      setError("Не удалось загрузить историю");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">История посещений</h1>
        <Link
          href="/gold"
          className="shrink-0 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          ← Gold Coin
        </Link>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        MAC-адрес браузер сайту не сообщает — ни один сайт технически не может его узнать. Ниже
        показаны IP-адрес, User-Agent и время каждой попытки входа.
      </p>

      {visits === null ? (
        <form onSubmit={handleSubmit} className="flex max-w-xs flex-col gap-3">
          <label htmlFor="confirm-password" className="text-sm font-medium">
            Подтвердите пароль
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {loading ? "Загружаем…" : "Показать"}
          </button>
        </form>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 font-medium">Время</th>
                <th className="px-3 py-2 font-medium">Фамилия Имя</th>
                <th className="px-3 py-2 font-medium">Результат</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">User-Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatSnapshotTime(visit.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    {visit.surname} {visit.name}
                  </td>
                  <td className="px-3 py-2">
                    {visit.success ? (
                      <span className="text-green-600 dark:text-green-400">успех</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">отказ</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{visit.ip ?? "—"}</td>
                  <td className="max-w-xs truncate px-3 py-2" title={visit.user_agent ?? ""}>
                    {visit.user_agent ?? "—"}
                  </td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                    Пока нет записей.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
