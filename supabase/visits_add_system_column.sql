-- Run once in the Supabase SQL Editor, after visits_schema.sql. Adds a
-- "system" column so the visits table can log attempts from both logins:
-- Gold Coin's Фамилия/Имя/пароль form ('gold') and the expense tracker's
-- Мика/Макс PIN form ('expenses'). Existing rows predate this column and
-- are all from Gold Coin, so they default to 'gold'.

alter table public.visits add column if not exists system text not null default 'gold';
