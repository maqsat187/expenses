// Server-only. Remembers the XAU/USD price at the time of the last "moved
// 2%" alert sent to Telegram (see src/app/api/alerts/xau-move/route.ts) —
// each check compares the live price against this, not a fixed daily
// reference, and overwrites it whenever a new alert fires. Always a single
// row (id = 1).
import { supabase } from "@/lib/supabase";

export type XauAlertState = {
  lastAlertPrice: number;
  lastAlertAt: string;
};

const ROW_ID = 1;

export async function loadXauAlertState(): Promise<XauAlertState | null> {
  const { data, error } = await supabase
    .from("xau_alert_state")
    .select("*")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error || !data) return null;
  return { lastAlertPrice: data.last_alert_price, lastAlertAt: data.last_alert_at };
}

export async function saveXauAlertState(lastAlertPrice: number): Promise<void> {
  const { error } = await supabase.from("xau_alert_state").upsert({
    id: ROW_ID,
    last_alert_price: lastAlertPrice,
    last_alert_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
