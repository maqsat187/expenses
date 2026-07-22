import { supabase } from "@/lib/supabase";

export type Expense = {
  id: number;
  date: string;
  name: string;
  category: string;
  payment_method: string;
  amount: number;
  bonus: number;
  bonus_percent: number;
  user_name: string | null;
  created_at: string;
};

export type ExpenseInput = {
  date: string;
  name: string;
  category: string;
  payment_method: string;
  amount: number;
  bonus: number;
  user_name: string | null;
};

// Supabase (PostgREST) caps a single response at 1000 rows by default, so a
// household with more than that would silently lose its oldest expenses
// (sorted newest-first, the tail past row 1000 never arrives). Page through
// with .range() until a page comes back short.
const PAGE_SIZE = 1000;

export async function listExpenses(): Promise<Expense[]> {
  const all: Expense[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function createExpense(input: ExpenseInput): Promise<void> {
  const { error } = await supabase.from("expenses").insert(input);
  if (error) throw error;
}

export async function updateExpense(
  id: number,
  input: ExpenseInput,
): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .update(input)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteExpense(id: number): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
