-- Run once in the Supabase SQL Editor. Stores a manually entered gold
-- price for a specific date, for when the National Bank's page hasn't
-- published that day's figure yet — one row per date, entered by
-- Жайсанбаев Максат or Усипбаев Самат via the Gold Coin page. A live
-- National Bank value for the same date always takes priority once it's
-- published, so rows here never need to be deleted by hand.

create table if not exists public.nbk_gold_override (
  date date primary key,
  price_per_gram double precision not null,
  entered_by text not null,
  entered_at timestamptz not null default now()
);

alter table public.nbk_gold_override enable row level security;

create policy "public read access" on public.nbk_gold_override
  for select using (true);

create policy "public insert access" on public.nbk_gold_override
  for insert with check (true);

create policy "public update access" on public.nbk_gold_override
  for update using (true) with check (true);
