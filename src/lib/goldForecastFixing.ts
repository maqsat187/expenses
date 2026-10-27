// Server-only. Captures one "official" snapshot per day of the gold spot
// price and the KASE USDKZT_TOM rate, taken the first time both are
// fetched live (not stale) on or after 15:30 Almaty — used to compute a
// genuine "forecast for tomorrow" distinct from the main forecast, which
// always uses whatever data is live right now. Locked in per date: once
// captured, later visits the same day never overwrite it, the way a real
// market fixing isn't a moving target.
import { supabase } from "@/lib/supabase";

export type GoldForecastFixing = {
  date: string;
  goldSpotPrice: number;
  kaseRate: number;
  capturedAt: string;
};

// Best-effort: a save failure should never break the main forecast, so
// errors are swallowed here rather than thrown.
export async function saveForecastFixingIfMissing(
  date: string,
  goldSpotPrice: number,
  kaseRate: number,
): Promise<void> {
  try {
    await supabase.from("gold_forecast_fixing").upsert(
      { date, gold_spot_price: goldSpotPrice, kase_rate: kaseRate },
      { onConflict: "date", ignoreDuplicates: true },
    );
  } catch {
    // Ignored — see comment above.
  }
}

export async function loadForecastFixing(date: string): Promise<GoldForecastFixing | null> {
  const { data, error } = await supabase
    .from("gold_forecast_fixing")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error || !data) return null;
  return {
    date: data.date,
    goldSpotPrice: data.gold_spot_price,
    kaseRate: data.kase_rate,
    capturedAt: data.captured_at,
  };
}
