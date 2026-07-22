import type { Expense, ExpenseInput } from "@/lib/expenses";
import { formatCurrency, formatDate } from "@/lib/format";
import { categoryColor } from "@/lib/categories";
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
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 font-medium">Description</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            {props.showActions && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {expenses.map((expense) =>
            props.showActions && props.editingId === expense.id ? (
              <tr key={expense.id}>
                <td colSpan={5} className="px-4 py-3">
                  <ExpenseForm
                    submitLabel="Save"
                    initialValues={{
                      amount: expense.amount,
                      category: expense.category,
                      description: expense.description,
                      date: expense.date,
                    }}
                    onSubmit={(input) => props.onEditSave(expense.id, input)}
                    onCancel={props.onEditCancel}
                  />
                </td>
              </tr>
            ) : (
              <tr key={expense.id}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDate(expense.date)}
                </td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${categoryColor(expense.category)}`}
                    />
                    {expense.category}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                  {expense.description ?? "—"}
                </td>
                <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </td>
                {props.showActions && (
                  <td className="px-4 py-2">
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
