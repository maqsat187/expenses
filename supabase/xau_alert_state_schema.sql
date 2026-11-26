-- Run once in the Supabase SQL Editor. Stores the XAU/USD price at the
-- time of the last "moved 2%" alert sent to Telegram (see
-- src/app/api/alerts/xau-move/route.ts) -- each check compares against
-- this, not a fixed daily reference, and it's overwritten whenever a new
-- alert fires. Always a single row (id = 1).

create table if not exists public.xau_alert_state (
  id smallint primary key default 1,
  last_alert_price double precision not null,
  last_alert_at timestamptz not null default now(),
  constraint xau_alert_state_single_row check (id = 1)
);

alter table public.xau_alert_state enable row level security;

create policy "public read access" on public.xau_alert_state
  for select using (true);

create policy "public insert access" on public.xau_alert_state
  for insert with check (true);

create policy "public update access" on public.xau_alert_state
  for update using (true) with check (true);
