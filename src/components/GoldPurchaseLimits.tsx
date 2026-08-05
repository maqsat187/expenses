"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatDateWithWeekday } from "@/lib/format";
import { almatyTodayIso } from "@/lib/goldHistory";

type Person = "Максат" | "Мика" | "Мама";
const PEOPLE: Person[] = ["Максат", "Мика", "Мама"];

type PurchaseEntry = {
  id: number;
  person: Person;
  purchaseDate: string;
  quantity: number;
  releaseDate: string;
};

const YELLOW_THRESHOLD_DAYS = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function rowClass(releaseDate: string, todayIso: string): string {
  const daysUntil = Math.round((Date.parse(releaseDate) - Date.parse(todayIso)) / MS_PER_DAY);
  if (daysUntil <= 0) return "bg-green-50 dark:bg-green-950";
  if (daysUntil <= YELLOW_THRESHOLD_DAYS) return "bg-amber-50 dark:bg-amber-950";
  return "bg-red-50 dark:bg-red-950";
}

function loadPurchases(surname: string, name: string) {
  return fetch("/api/gold/purchase-limits/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ surname, name }),
  }).then((response) => response.json());
}

export function GoldPurchaseLimits({ user }: { user: string }) {
  const surname = user.split(" ")[0];
  const name = user.split(" ").slice(1).join(" ");

  const [entries, setEntries] = useState<PurchaseEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [person, setPerson] = useState<Person>("Максат");
  const [purchaseDate, setPurchaseDate] = useState(almatyTodayIso());
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  function refresh() {
    return loadPurchases(surname, name).then((data) => {
      if (data?.ok) {
        setEntries(data.purchases);
        return true;
      }
      return false;
    });
  }

  useEffect(() => {
    refresh().then((ok) => {
      if (!ok) setLoadError("Не удалось загрузить лимиты.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surname, name]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Введите количество монет числом больше нуля.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await fetch("/api/gold/purchase-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, person, purchaseDate, quantity: qty }),
      });
      const data = await response.json().catch(() => null);
      if (data?.ok) {
        setQuantity("");
        await refresh();
      } else {
        setFormError(typeof data?.message === "string" ? data.message : "Не удалось сохранить.");
      }
    } catch {
      setFormError("Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(entry: PurchaseEntry) {
    setEditingId(entry.id);
    setEditQuantity(String(entry.quantity));
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: number) {
    const qty = Number(editQuantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setEditError("Введите количество монет числом больше нуля.");
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      const response = await fetch("/api/gold/purchase-limits/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, id, quantity: qty }),
      });
      const data = await response.json().catch(() => null);
      if (data?.ok) {
        setEditingId(null);
        await refresh();
      } else {
        setEditError(typeof data?.message === "string" ? data.message : "Не удалось сохранить.");
      }
    } catch {
      setEditError("Не удалось сохранить.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить эту запись?")) return;
    setDeletingId(id);
    setEditError(null);
    try {
      const response = await fetch("/api/gold/purchase-limits/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surname, name, id }),
      });
      const data = await response.json().catch(() => null);
      if (data?.ok) {
        await refresh();
      } else {
        alert(typeof data?.message === "string" ? data.message : "Не удалось удалить запись.");
      }
    } catch {
      alert("Не удалось удалить запись.");
    } finally {
      setDeletingId(null);
    }
  }

  const todayIso = almatyTodayIso();
  const sorted = entries
    ? [...entries].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
    : null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Лимиты покупок Gold Coin (Табыс)
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Лимит — 100 монет в месяц на человека. После покупки количество освобождается через 30
        календарных дней с даты покупки.
      </p>

      {loadError && <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      {sorted && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 font-medium">Кто</th>
                <th className="px-3 py-2 text-right font-medium">Монет</th>
                <th className="px-3 py-2 font-medium">Дата покупки</th>
                <th className="px-3 py-2 font-medium">Освобождение лимита</th>
                <th className="px-3 py-2 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sorted.map((entry) => (
                <tr key={entry.id} className={rowClass(entry.releaseDate, todayIso)}>
                  <td className="px-3 py-2">{entry.person}</td>
                  <td className="px-3 py-2 text-right">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-900"
                        autoFocus
                      />
                    ) : (
                      entry.quantity
                    )}
                  </td>
                  <td className="px-3 py-2">{formatDateWithWeekday(entry.purchaseDate)}</td>
                  <td className="px-3 py-2">{formatDateWithWeekday(entry.releaseDate)}</td>
                  <td className="px-3 py-2">
                    {editingId === entry.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(entry.id)}
                          disabled={editSaving}
                          className="text-slate-700 hover:underline disabled:opacity-50 dark:text-slate-300"
                        >
                          {editSaving ? "Сохраняем…" : "Сохранить"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={editSaving}
                          className="text-slate-500 hover:underline disabled:opacity-50 dark:text-slate-400"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="text-slate-500 hover:underline dark:text-slate-400"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                        >
                          {deletingId === entry.id ? "Удаляем…" : "Удалить"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    Пока нет записей.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {editError && <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 text-sm">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="limit-person"
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Кто
          </label>
          <select
            id="limit-person"
            value={person}
            onChange={(e) => setPerson(e.target.value as Person)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {PEOPLE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="limit-date"
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Дата покупки
          </label>
          <input
            id="limit-date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="limit-quantity"
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            Количество монет
          </label>
          <input
            id="limit-quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {saving ? "Сохраняем…" : "Добавить"}
        </button>
      </form>
      {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
    </section>
  );
}
