"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGoldAuthGuard } from "@/lib/useGoldAuthGuard";
import { isAdmin } from "@/lib/goldAuth";
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
  const user = useGoldAuthGuard();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin(user)) return;

    const [surname, name] = [user.split(" ")[0], user.split(" ").slice(1).join(" ")];

    fetch("/api/auth/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ surname, name }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok) {
          setVisits(data.visits);
        } else if (typeof data?.message === "string") {
          setError(`Не удалось загрузить историю: ${data.message}`);
        } else {
          setError("Не удалось загрузить историю (сервер вернул ошибку)");
        }
      })
      .catch(() => setError("Не удалось загрузить историю"));
  }, [user]);

  const loading = !visits && !error;

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

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Загружаем…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {visits && (
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
