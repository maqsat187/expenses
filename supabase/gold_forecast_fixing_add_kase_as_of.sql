-- Run once in the Supabase SQL Editor, after gold_forecast_fixing_schema.sql.
-- Adds the column needed to compare candidates by how close they are to
-- the 15:30 Almaty target (rather than just keeping the first one seen),
-- and to require it be set when inserting/updating a row.

alter table public.gold_forecast_fixing add column if not exists kase_as_of timestamptz;

update public.gold_forecast_fixing set kase_as_of = captured_at where kase_as_of is null;

alter table public.gold_forecast_fixing alter column kase_as_of set not null;

-- The original schema only granted insert (plus select) — updating an
-- existing row toward a closer candidate needs update too.
create policy "public update access" on public.gold_forecast_fixing
  for update using (true) with check (true);
