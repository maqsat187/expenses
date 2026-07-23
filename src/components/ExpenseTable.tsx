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

// A wide table needs more room than this app's content column ever has —
// even at its widest, the page is narrower than a table with every column
// (№, Дата, Наименование, Категория, Способ БВУ, Сумма, Бонус, %, Кто,
// actions) needs, so it always required horizontal scrolling to reach
// Бонус/%, on a phone and on a full browser window alike. Cards for every
// record instead: every field is visible without scrolling, at any width.
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
    <div className="flex flex-col gap-3">
      {expenses.map((expense) =>
        props.showActions && props.editingId === expense.id ? (
          <div
            key={expense.id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
          >
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
                  №{expense.id} · {formatDate(expense.date)} ·{" "}
                  {expense.category}
                </p>
              </div>
              <span className="shrink-0 font-medium tabular-nums">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600 sm:grid-cols-4 dark:text-slate-400">
              <div className="flex justify-between gap-2 sm:block">
                <dt>Способ БВУ</dt>
                <dd className="sm:font-medium sm:text-slate-800 sm:dark:text-slate-200">
                  {expense.payment_method}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt>Кто</dt>
                <dd className="sm:font-medium sm:text-slate-800 sm:dark:text-slate-200">
                  {expense.user_name ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt>Бонус</dt>
                <dd className="sm:font-medium sm:text-slate-800 sm:dark:text-slate-200">
                  {expense.bonus ? formatCurrency(expense.bonus) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt>% бонуса</dt>
                <dd className="sm:font-medium sm:text-slate-800 sm:dark:text-slate-200">
                  {expense.bonus ? formatPercent(expense.bonus_percent) : "—"}
                </dd>
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
  );
}
