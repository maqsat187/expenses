// Server-only. Stores a manually entered gold-per-gram price for a specific
// date, for when the National Bank's page hasn't published that day's
// figure yet (see fetchNbkGold in marketSources.ts, the only caller).
// Keyed by date, so each day gets its own row and nothing needs cleanup —
// once the National Bank actually publishes a date, fetchNbkGold prefers
// that live value over any override for the same date.
import { supabase } from "@/lib/supabase";

export type NbkGoldOverride = {
  date: string;
  pricePerGram: number;
  enteredBy: string;
  enteredAt: string;
};

export async function saveGoldPriceOverride(
  date: string,
  pricePerGram: number,
  enteredBy: string,
): Promise<void> {
  const { error } = await supabase.from("nbk_gold_override").upsert({
    date,
    price_per_gram: pricePerGram,
    entered_by: enteredBy,
    entered_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function loadGoldPriceOverride(date: string): Promise<NbkGoldOverride | null> {
  const { data, error } = await supabase
    .from("nbk_gold_override")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error || !data) return null;
  return {
    date: data.date,
    pricePerGram: data.price_per_gram,
    enteredBy: data.entered_by,
    enteredAt: data.entered_at,
  };
}
