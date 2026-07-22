import { createClient } from "@supabase/supabase-js";

// Public Supabase project config. The "publishable" key is safe to expose
// in client-side code by design — access is governed by Row Level Security
// policies on the database, not by keeping this key secret. Falling back to
// the real values means the static export builds without needing CI secrets.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://oahpmotzynzimaxiwjfi.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_sSSSEP8K_fkHrVQSo4C4JQ_nA4oP2mO";

export const supabase = createClient(supabaseUrl, supabaseKey);
