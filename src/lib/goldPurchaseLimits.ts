// Server-only. Tracks gold coin purchases against Tabys's 100-coin/month
// limit per person, and computes when each purchase's quantity frees back
// up — 30 calendar days after the purchase date. Visible only to
// Жайсанбаев Максат (see /api/gold/purchase-limits and its list/ route,
// gated with goldAuth's isAdmin).
import { supabase } from "@/lib/supabase";
import { addDaysIso } from "@/lib/goldHistory";

export type Person = "Максат" | "Мика" | "Мама";

export const PEOPLE: Person[] = ["Максат", "Мика", "Мама"];

const RELEASE_DAYS = 30;

export type PurchaseLimitEntry = {
  id: number;
  person: Person;
  purchaseDate: string;
  quantity: number;
  releaseDate: string;
  enteredBy: string;
  enteredAt: string;
};

export async function savePurchase(
  person: Person,
  purchaseDate: string,
  quantity: number,
  enteredBy: string,
): Promise<void> {
  const { error } = await supabase.from("gold_purchase_limits").insert({
    person,
    purchase_date: purchaseDate,
    quantity,
    entered_by: enteredBy,
  });
  if (error) throw new Error(error.message);
}

export async function updatePurchaseQuantity(id: number, quantity: number): Promise<void> {
  const { error } = await supabase
    .from("gold_purchase_limits")
    .update({ quantity })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listPurchases(): Promise<PurchaseLimitEntry[]> {
  const { data, error } = await supabase
    .from("gold_purchase_limits")
    .select("*")
    .order("purchase_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    person: row.person,
    purchaseDate: row.purchase_date,
    quantity: row.quantity,
    releaseDate: addDaysIso(row.purchase_date, RELEASE_DAYS),
    enteredBy: row.entered_by,
    enteredAt: row.entered_at,
  }));
}
