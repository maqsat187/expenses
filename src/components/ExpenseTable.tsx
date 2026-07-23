import type { Expense, ExpenseInput } from "@/lib/expenses";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateShort,
  formatMoney,
  formatPercent,
} from "@/lib/format";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";
import { EditIcon } from "@/components/icons";
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

const COLUMN_COUNT = 7;

export function ExpenseTable(props: Props) {
  const { expenses } = props;

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Записи не найдены.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      {/* table-fixed: column widths come from the header row below and
          hold regardless of content, so truncate actually keeps the
          columns most worth seeing without scrolling (Дата, Наименование,
          Сумма+бонус) in the initial view before Категория/БВУ/Кто. */}
      <table className="w-[552px] table-fixed text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="w-20 px-2 py-2 font-medium">Дата</th>
            <th className="w-28 truncate px-2 py-2 font-medium">
              Наименование
            </th>
            <th className="w-20 px-2 py-2 text-right font-medium">Сумма</th>
            <th className="w-24 truncate px-2 py-2 font-medium">Категория</th>
            <th className="w-16 truncate px-2 py-2 font-medium">БВУ</th>
            <th className="w-14 truncate px-2 py-2 font-medium">Кто</th>
            {props.showActions && (
              <th className="sticky right-0 w-16 border-l border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-800 dark:bg-slate-900" />
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {expenses.map((expense) =>
            props.showActions && props.editingId === expense.id ? (
              <tr key={expense.id}>
                <td colSpan={COLUMN_COUNT} className="px-2 py-3">
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
                      props.onEditSave(expense.id, {
                        ...input,
                        user_name: expense.user_name,
                      })
                    }
                    onCancel={props.onEditCancel}
                  />
                </td>
              </tr>
            ) : (
              <tr key={expense.id}>
                <td className="truncate px-2 py-2 text-slate-500 dark:text-slate-400">
                  {formatDateShort(expense.date)}
                </td>
                <td className="truncate px-2 py-2" title={expense.name}>
                  {expense.name}
                </td>
                <td className="px-2 py-2 text-right">
                  <div
                    className="truncate font-medium"
                    title={formatCurrency(expense.amount)}
                  >
                    {formatMoney(expense.amount)}
                  </div>
                  {expense.bonus ? (
                    <div
                      className="truncate text-xs text-slate-400 dark:text-slate-500"
                      title={`Бонус: ${formatCurrency(expense.bonus)} (${formatPercent(expense.bonus_percent)})`}
                    >
                      +{formatCompactCurrency(expense.bonus)}
                      <br />
                      {formatPercent(expense.bonus_percent)}
                    </div>
                  ) : null}
                </td>
                <td
                  className="truncate px-2 py-2 text-slate-600 dark:text-slate-400"
                  title={expense.category}
                >
                  {expense.category}
                </td>
                <td
                  className="truncate px-2 py-2 text-slate-600 dark:text-slate-400"
                  title={expense.payment_method}
                >
                  {expense.payment_method}
                </td>
                <td className="truncate px-2 py-2 text-slate-600 dark:text-slate-400">
                  {expense.user_name ?? "—"}
                </td>
                {props.showActions && (
                  <td className="sticky right-0 border-l border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => props.onEditStart(expense.id)}
                        title="Изменить"
                        aria-label="Изменить запись"
                        className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        <EditIcon className="h-4 w-4" />
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
  );
}
