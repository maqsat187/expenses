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
        No expenses found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
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
            {props.showActions && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {expenses.map((expense) =>
            props.showActions && props.editingId === expense.id ? (
              <tr key={expense.id}>
                <td colSpan={10} className="px-3 py-3">
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
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => props.onEditStart(expense.id)}
                        className="text-sm text-slate-600 hover:underline dark:text-slate-400"
                      >
                        Edit
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
