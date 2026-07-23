"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES } from "@/lib/categories";
import { PAYMENT_METHODS } from "@/lib/banks";
import { toDateInputValue } from "@/lib/format";
import { describeError } from "@/lib/errors";
import type { ExpenseInput } from "@/lib/expenses";

type FormValues = Omit<ExpenseInput, "user_name">;

type Props = {
  initialValues?: FormValues;
  submitLabel: string;
  onSubmit: (input: FormValues) => Promise<void>;
  onCancel?: () => void;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// bonus and its percent are two views of the same number — deriving one
// from the amount plus whichever the person actually typed.
function percentFromBonus(amount: number, bonus: number): string {
  if (!Number.isFinite(amount) || amount === 0 || !Number.isFinite(bonus)) {
    return "";
  }
  return String(round2((bonus / amount) * 100));
}

function bonusFromPercent(amount: number, percent: number): string {
  if (!Number.isFinite(amount) || !Number.isFinite(percent)) return "";
  return String(round2((amount * percent) / 100));
}

export function ExpenseForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [amountText, setAmountText] = useState(
    initialValues ? String(initialValues.amount) : "",
  );
  const [bonusText, setBonusText] = useState(
    initialValues ? String(initialValues.bonus) : "",
  );
  const [percentText, setPercentText] = useState(() =>
    initialValues
      ? percentFromBonus(initialValues.amount, initialValues.bonus)
      : "",
  );
  // Which of bonus/percent is the "rule" to keep applying when the amount
  // changes afterwards — whichever the person last actually typed into.
  const [bonusSource, setBonusSource] = useState<"bonus" | "percent">("bonus");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAmountChange(value: string) {
    setAmountText(value);
    const amount = Number(value);
    if (bonusSource === "percent") {
      setBonusText(bonusFromPercent(amount, Number(percentText)));
    } else {
      setPercentText(percentFromBonus(amount, Number(bonusText)));
    }
  }

  function handleBonusChange(value: string) {
    setBonusText(value);
    setBonusSource("bonus");
    setPercentText(percentFromBonus(Number(amountText), Number(value)));
  }

  function handlePercentChange(value: string) {
    setPercentText(value);
    setBonusSource("percent");
    setBonusText(bonusFromPercent(Number(amountText), Number(value)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capture the form element synchronously: React nulls out
    // event.currentTarget once the synchronous dispatch phase ends, so
    // reading it after the `await onSubmit(...)` below would throw even on
    // a fully successful save — the .reset() call would hit a null target
    // and land in the catch block below, misreporting success as failure.
    const form = event.currentTarget;
    setError(null);

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const paymentMethod = String(formData.get("payment_method") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const amount = Number(amountText);
    const bonus = Number(bonusText || 0);

    if (!name) {
      setError("Укажите наименование расхода.");
      return;
    }
    if (!category) {
      setError("Укажите категорию.");
      return;
    }
    if (!paymentMethod) {
      setError("Укажите способ БВУ.");
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      setError("Укажите сумму.");
      return;
    }
    if (!Number.isFinite(bonus)) {
      setError("Некорректный бонус.");
      return;
    }
    if (Number.isNaN(new Date(date).getTime())) {
      setError("Укажите дату.");
      return;
    }

    setPending(true);
    try {
      await onSubmit({ name, category, payment_method: paymentMethod, date, amount, bonus });
      if (!initialValues) {
        form.reset();
        setAmountText("");
        setBonusText("");
        setPercentText("");
        setBonusSource("bonus");
      }
    } catch (err) {
      setError(`Не удалось сохранить расход. Попробуйте ещё раз.${describeError(err)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      {error && (
        <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-sm font-medium">
        Наименование
        <input
          name="name"
          type="text"
          maxLength={200}
          defaultValue={initialValues?.name}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Категория
        <input
          name="category"
          type="text"
          list="category-options"
          defaultValue={initialValues?.category}
          required
          className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <datalist id="category-options">
          {CATEGORIES.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Способ БВУ
        <input
          name="payment_method"
          type="text"
          list="payment-method-options"
          defaultValue={initialValues?.payment_method}
          required
          className="w-36 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <datalist id="payment-method-options">
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Дата
        <input
          name="date"
          type="date"
          defaultValue={initialValues?.date ?? toDateInputValue(new Date())}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Сумма
        <input
          name="amount"
          type="number"
          step="0.01"
          value={amountText}
          onChange={(e) => handleAmountChange(e.target.value)}
          required
          className="w-28 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Бонус
        <input
          type="number"
          step="0.01"
          value={bonusText}
          onChange={(e) => handleBonusChange(e.target.value)}
          placeholder="0"
          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        % бонуса
        <input
          type="number"
          step="0.01"
          value={percentText}
          onChange={(e) => handlePercentChange(e.target.value)}
          placeholder="0"
          className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {pending ? "Сохранение…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
