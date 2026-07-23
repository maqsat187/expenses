import type { Expense, ExpenseInput } from "@/lib/expenses";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { ExpenseForm } from "@/components/ExpenseForm";

type EditableProps = {
  showActions: true;
  editingId: number | null;
  onEditStart: (id: number) => void;
  onEditCancel: () => void;
  onEditSave: (id: number, input: ExpenseInput) => Promise<void>;
  onDeleted: (id: number) => void;
};

type ReadOnlyProps = {
  showActions?: false;
};

type Props = { expenses: Expense[] } & (EditableProps | ReadOnlyProps);

export function ExpenseTable(props: Props) {
  const { expenses } = props;

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Записи не найдены.
      </p>
    );
  }

  function editForm(expense: Expense) {
    if (!props.showActions) return null;
    return (
      <ExpenseForm
        submitLabel="Сохранить"
        initialValues={{
          name: expense.name,
          category: expense.category,
          payment_method: expense.payment_method,
          amount: expense.amount,
          bonus: expense.bonus,
          date: expense.date,
        }}
        onSubmit={(input) =>
          props.onEditSave(expense.id, { ...input, user_name: expense.user_name })
        }
        onCancel={props.onEditCancel}
      />
    );
  }

  return (
    <>
      {/* Card layout: avoids hiding Бонус/%/actions behind horizontal
          scroll on narrow screens. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {expenses.map((expense) =>
          props.showActions && props.editingId === expense.id ? (
            <div
              key={expense.id}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              {editForm(expense)}
            </div>
          ) : (
            <div
              key={expense.id}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{expense.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(expense.date)} · {expense.category}
                  </p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between gap-2">
                  <dt>Способ БВУ</dt>
                  <dd>{expense.payment_method}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Кто</dt>
                  <dd>{expense.user_name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Бонус</dt>
                  <dd>{expense.bonus ? formatCurrency(expense.bonus) : "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>% бонуса</dt>
                  <dd>{expense.bonus ? formatPercent(expense.bonus_percent) : "—"}</dd>
                </div>
              </dl>
              {props.showActions && (
                <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => props.onEditStart(expense.id)}
                    className="text-sm text-slate-600 hover:underline dark:text-slate-400"
                  >
                    Изменить
                  </button>
                  <DeleteExpenseButton id={expense.id} onDeleted={props.onDeleted} />
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {/* Table layout for larger screens. */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 sm:block dark:border-slate-800">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">№</th>
              <th className="px-3 py-2 font-medium">Дата</th>
              <th className="px-3 py-2 font-medium">Наименование</th>
              <th className="px-3 py-2 font-medium">Категория</th>
              <th className="px-3 py-2 font-medium">Способ БВУ</th>
              <th className="px-3 py-2 text-right font-medium">Сумма</th>
              <th className="px-3 py-2 text-right font-medium">Бонус</th>
              <th className="px-3 py-2 text-right font-medium">%</th>
              <th className="px-3 py-2 font-medium">Кто</th>
              {props.showActions && (
                <th className="sticky right-0 border-l border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {expenses.map((expense) =>
              props.showActions && props.editingId === expense.id ? (
                <tr key={expense.id}>
                  <td colSpan={10} className="px-3 py-3">
                    {editForm(expense)}
                  </td>
                </tr>
              ) : (
                <tr key={expense.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {expense.id}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-3 py-2">{expense.name}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {expense.category}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {expense.payment_method}
                  </td>
                  <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {expense.bonus ? formatCurrency(expense.bonus) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">
                    {expense.bonus ? formatPercent(expense.bonus_percent) : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {expense.user_name ?? "—"}
                  </td>
                  {props.showActions && (
                    <td className="sticky right-0 border-l border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => props.onEditStart(expense.id)}
                          className="text-sm text-slate-600 hover:underline dark:text-slate-400"
                        >
                          Изменить
                        </button>
                        <DeleteExpenseButton
                          id={expense.id}
                          onDeleted={props.onDeleted}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
