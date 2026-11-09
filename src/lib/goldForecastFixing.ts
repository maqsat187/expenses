// Server-only. Captures one "official" snapshot per day of the gold spot
// price and the KASE USDKZT_TOM rate — used to compute a genuine "forecast
// for tomorrow" distinct from the main forecast, which always uses
// whatever data is live right now.
//
// Candidates are considered starting at 15:00 Almaty; whichever one is
// closest to the 15:30 target (by its own kase_as_of timestamp, live or
// from the snapshot fallback) wins and overwrites any earlier candidate
// for the same date — see marketSources.ts for the comparison logic that
// calls saveForecastFixingIfCloser. Once captured, it stays visible until
// 9:00 Almaty on the next business day (see getActiveFixing), not just
// until midnight.
import { supabase } from "@/lib/supabase";

export type GoldForecastFixing = {
  date: string;
  goldSpotPrice: number;
  kaseRate: number;
  kaseAsOf: string;
  capturedAt: string;
};

// Best-effort: a save failure should never break the main forecast, so
// errors are swallowed here rather than thrown.
export async function saveForecastFixingIfCloser(
  date: string,
  goldSpotPrice: number,
  kaseRate: number,
  kaseAsOf: string,
  distanceToTargetMs: number,
): Promise<void> {
  try {
    const existing = await loadForecastFixing(date);
    if (existing) {
      const existingDistance = Math.abs(
        new Date(existing.kaseAsOf).getTime() - targetTime(date),
      );
      if (existingDistance <= distanceToTargetMs) return;
    }
    await supabase.from("gold_forecast_fixing").upsert(
      {
        date,
        gold_spot_price: goldSpotPrice,
        kase_rate: kaseRate,
        kase_as_of: kaseAsOf,
      },
      { onConflict: "date" },
    );
  } catch {
    // Ignored — see comment above.
  }
}

// 15:30 Almaty (= 10:30 UTC) on the given date, as a timestamp — the
// target the closest-kase_as_of comparison measures distance against.
function targetTime(dateIso: string): number {
  return new Date(`${dateIso}T10:30:00.000Z`).getTime();
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
    kaseAsOf: data.kase_as_of,
    capturedAt: data.captured_at,
  };
}
