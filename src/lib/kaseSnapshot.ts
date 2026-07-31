// Server-only. Remembers the last successfully fetched KASE USDKZT_TOM
// average price in Supabase, so the Gold Coin page has something useful to
// show when KASE itself has nothing (e.g. outside the trading session) —
// see fetchKaseAverage in marketSources.ts, which is the only caller.
// Always a single row (id = 1), overwritten on every successful live fetch.
import { supabase } from "@/lib/supabase";

export type KaseSnapshot = {
  averagePrice: number;
  isRealtime: boolean;
  serverTime: string | null;
  fetchedAt: string;
};

const ROW_ID = 1;

// Best-effort: a save failure should never break a successful live fetch,
// so errors are swallowed here rather than thrown.
export async function saveKaseSnapshot(data: {
  averagePrice: number;
  isRealtime: boolean;
  serverTime: string | null;
}): Promise<void> {
  try {
    await supabase.from("kase_snapshot").upsert({
      id: ROW_ID,
      average_price: data.averagePrice,
      is_realtime: data.isRealtime,
      server_time: data.serverTime,
      fetched_at: new Date().toISOString(),
    });
  } catch {
    // Ignored — see comment above.
  }
}

export async function loadKaseSnapshot(): Promise<KaseSnapshot | null> {
  const { data, error } = await supabase
    .from("kase_snapshot")
    .select("*")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error || !data) return null;
  return {
    averagePrice: data.average_price,
    isRealtime: data.is_realtime,
    serverTime: data.server_time,
    fetchedAt: data.fetched_at,
  };
}
