-- Run once in the Supabase SQL Editor, after gold_purchase_limits_schema.sql
-- (and gold_purchase_limits_add_update_policy.sql, if applied). Adds
-- delete, now needed so a mistaken purchase entry can be removed entirely.

create policy "public delete access" on public.gold_purchase_limits
  for delete using (true);
