-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New
-- query) to (re)create the table this app reads and writes.
--
-- WARNING: this drops the existing "expenses" table (and its data) first,
-- so any previously entered rows are lost. Run supabase/seed_data.sql
-- afterwards to load the household's real historical data.

drop table if exists public.expenses;

create table public.expenses (
  id bigint generated always as identity primary key,
  date date not null default current_date,
  name text not null,
  category text not null,
  payment_method text not null,
  amount double precision not null,
  bonus double precision not null default 0,
  -- auto-calculated from the bonus amount the bank actually gave, same as
  -- the "Бонусы %" formula (=bonus/amount) in the original spreadsheet
  bonus_percent double precision generated always as (
    case when amount <> 0 then (bonus / amount) * 100 else 0 end
  ) stored,
  -- who added the expense ("Мика" / "Макс"); nullable so imported
  -- historical rows (which predate per-user login) can stay unattributed
  user_name text,
  created_at timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (date);
create index expenses_category_idx on public.expenses (category);
create index expenses_payment_method_idx on public.expenses (payment_method);
create index expenses_user_name_idx on public.expenses (user_name);

-- Row Level Security is on by default for new tables in the dashboard.
-- These policies allow full access via the publishable (anon) key, since
-- this app gates access with an in-app PIN rather than real Supabase auth.
-- Tighten these (e.g. scope to auth.uid()) if you ever add real accounts.
alter table public.expenses enable row level security;

create policy "public read access" on public.expenses
  for select using (true);

create policy "public insert access" on public.expenses
  for insert with check (true);

create policy "public update access" on public.expenses
  for update using (true) with check (true);

create policy "public delete access" on public.expenses
  for delete using (true);
