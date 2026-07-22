"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isCategory } from "@/lib/categories";

export type ActionState = { error: string | null };

type ParsedExpense = {
  amount: number;
  category: string;
  description: string | null;
  date: Date;
};

type ParseResult =
  | { ok: true; data: ParsedExpense }
  | { ok: false; error: string };

function parseExpenseForm(formData: FormData): ParseResult {
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount greater than 0." };
  }
  if (!isCategory(category)) {
    return { ok: false, error: "Choose a valid category." };
  }
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Enter a valid date." };
  }

  return {
    ok: true,
    data: {
      amount,
      category,
      description: description || null,
      date,
    },
  };
}

export async function createExpense(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseExpenseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.expense.create({ data: parsed.data });

  revalidatePath("/");
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function updateExpense(
  id: number,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseExpenseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.expense.update({ where: { id }, data: parsed.data });

  revalidatePath("/");
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(id: number): Promise<void> {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/expenses");
}
