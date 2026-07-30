-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New
-- query) to create the table the new login system logs to. Unlike
-- schema.sql, this does NOT drop anything first — it's additive and safe to
-- run alongside the existing "expenses" table.

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  surname text not null,
  name text not null,
  success boolean not null,
  ip text,
  user_agent text
);

create index if not exists visits_created_at_idx on public.visits (created_at desc);

-- Same trust model as expenses: the app has no real Supabase auth, so the
-- publishable (anon) key needs full access, gated instead by the app's own
-- login check (surname + name + shared password, validated server-side in
-- /api/auth/login and /api/auth/visits).
alter table public.visits enable row level security;

create policy "public insert access" on public.visits
  for insert with check (true);

create policy "public read access" on public.visits
  for select using (true);
