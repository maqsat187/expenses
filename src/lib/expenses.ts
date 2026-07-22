import { supabase } from "@/lib/supabase";

export type Expense = {
  id: number;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
};

export type ExpenseInput = {
  amount: number;
  category: string;
  description: string | null;
  date: string;
};

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data ?? [];
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
