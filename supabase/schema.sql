-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- to create the table this app reads and writes.

create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  amount double precision not null check (amount > 0),
  category text not null,
  description text,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (date);
create index if not exists expenses_category_idx on public.expenses (category);

-- Row Level Security is on by default for new tables in the dashboard.
-- These policies allow full access via the publishable (anon) key, since
-- this app has no authentication yet and is meant for a single user.
-- Tighten these (e.g. scope to auth.uid()) before exposing the app publicly.
alter table public.expenses enable row level security;

create policy "public read access" on public.expenses
  for select using (true);

create policy "public insert access" on public.expenses
  for insert with check (true);

create policy "public update access" on public.expenses
  for update using (true) with check (true);

create policy "public delete access" on public.expenses
  for delete using (true);
