-- Run once in the Supabase SQL Editor. Tracks gold coin purchases against
-- Tabys's 100-coin/month limit per person — one row per purchase; the app
-- computes each row's release date (purchase_date + 30 calendar days)
-- rather than storing it. Visible only to Жайсанбаев Максат.

create table if not exists public.gold_purchase_limits (
  id bigint generated always as identity primary key,
  person text not null check (person in ('Максат', 'Мика', 'Мама')),
  purchase_date date not null,
  quantity integer not null check (quantity > 0),
  entered_by text not null,
  entered_at timestamptz not null default now()
);

create index if not exists gold_purchase_limits_person_idx on public.gold_purchase_limits (person);
create index if not exists gold_purchase_limits_purchase_date_idx on public.gold_purchase_limits (purchase_date);

alter table public.gold_purchase_limits enable row level security;

create policy "public read access" on public.gold_purchase_limits
  for select using (true);

create policy "public insert access" on public.gold_purchase_limits
  for insert with check (true);

-- Seed: the limits known as of 2026-07-31, given as (person, quantity,
-- release date) — purchase_date below is release date minus 30 days, so
-- the app reproduces the same release dates from it.
insert into public.gold_purchase_limits (person, purchase_date, quantity, entered_by) values
  ('Мама', '2026-07-04', 31, 'Жайсанбаев Максат'),
  ('Мама', '2026-07-16', 34, 'Жайсанбаев Максат'),
  ('Мама', '2026-07-22', 35, 'Жайсанбаев Максат'),
  ('Мика', '2026-07-04', 36, 'Жайсанбаев Максат'),
  ('Мика', '2026-07-13', 64, 'Жайсанбаев Максат'),
  ('Максат', '2026-07-04', 98, 'Жайсанбаев Максат'),
  ('Максат', '2026-07-16', 1, 'Жайсанбаев Максат'),
  ('Максат', '2026-07-22', 1, 'Жайсанбаев Максат');
