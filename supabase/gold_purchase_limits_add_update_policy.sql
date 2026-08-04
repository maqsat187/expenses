-- Run once in the Supabase SQL Editor, after gold_purchase_limits_schema.sql.
-- That original schema only granted select/insert — this adds update, now
-- needed so a purchase's recorded quantity can be corrected afterwards.

create policy "public update access" on public.gold_purchase_limits
  for update using (true) with check (true);
