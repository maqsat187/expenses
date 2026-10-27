-- Run once in the Supabase SQL Editor. Stores one gold-spot + KASE-rate
-- snapshot per day, captured the first time both are fetched live on or
-- after 15:30 Almaty — used for the "forecast for tomorrow" box on the
-- Gold Coin page, kept separate from the "right now" forecast, which
-- always uses whatever data is live at the moment someone clicks.

create table if not exists public.gold_forecast_fixing (
  date date primary key,
  gold_spot_price double precision not null,
  kase_rate double precision not null,
  captured_at timestamptz not null default now()
);

alter table public.gold_forecast_fixing enable row level security;

create policy "public read access" on public.gold_forecast_fixing
  for select using (true);

create policy "public insert access" on public.gold_forecast_fixing
  for insert with check (true);
