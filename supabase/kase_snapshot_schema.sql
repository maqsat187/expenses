-- Run once in the Supabase SQL Editor. Stores the most recently fetched
-- KASE USDKZT_TOM average price, so the Gold Coin page can fall back to
-- "last known" data (with its real timestamp) when KASE has nothing to
-- report right now — most commonly outside the trading session (roughly
-- from 10:30 Almaty). Always a single row (id = 1), overwritten by every
-- successful live fetch.

create table if not exists public.kase_snapshot (
  id smallint primary key default 1,
  average_price double precision not null,
  is_realtime boolean not null,
  server_time text,
  fetched_at timestamptz not null default now(),
  constraint kase_snapshot_single_row check (id = 1)
);

alter table public.kase_snapshot enable row level security;

create policy "public read access" on public.kase_snapshot
  for select using (true);

create policy "public insert access" on public.kase_snapshot
  for insert with check (true);

create policy "public update access" on public.kase_snapshot
  for update using (true) with check (true);
