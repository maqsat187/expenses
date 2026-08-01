-- Run once in the Supabase SQL Editor. Stores a personal password per
-- Gold Coin user, overriding the shared "Gold2026" default just for them
-- once they set one via /gold/change-password. One row per (surname,
-- name); salt + password_hash only (scrypt), never the password itself.
--
-- Note on trust: this app has only the public/publishable Supabase key,
-- no service-role key, so this table is exposed to that same key like
-- every other table here — hashing keeps it from handing out actual
-- passwords, but this is still the same "casual gate" trust model as the
-- rest of the app's auth, not a hardened account system.

create table if not exists public.gold_user_passwords (
  surname text not null,
  name text not null,
  salt text not null,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  primary key (surname, name)
);

alter table public.gold_user_passwords enable row level security;

create policy "public read access" on public.gold_user_passwords
  for select using (true);

create policy "public insert access" on public.gold_user_passwords
  for insert with check (true);

create policy "public update access" on public.gold_user_passwords
  for update using (true) with check (true);
