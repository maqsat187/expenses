# Expenses

A household expense tracker built with Next.js (static export) and Supabase.
PIN login for two profiles, an entry form matching the household's existing
Excel columns (with auto-calculated bonus %), and a set of dashboards.

## Stack

- Next.js (App Router, client components, `output: "export"` static build)
- Tailwind CSS
- Supabase (Postgres + REST API via `@supabase/supabase-js`)

## Setup

1. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) once in your
   Supabase project's SQL Editor to (re)create the `expenses` table.
2. Run [`supabase/seed_data.sql`](./supabase/seed_data.sql) once, right after,
   to load the household's historical data (imported from the Excel
   tracker — 1827 rows, Oct 2025 through Jul 2026).
3. Copy `.env.example` to `.env.local` and fill in your Supabase project's
   URL and publishable key (Project Settings -> API).
4. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Auth

`/login` shows a profile picker (Мика / Макс) and a phone-style PIN pad.
PINs live in [`src/lib/auth.ts`](./src/lib/auth.ts). This is a static site —
the PINs ship in the public JS bundle like everything else here, so this is
a household-only gate, not real security. Every expense created while signed
in is tagged with the current profile; historical imported rows are left
unattributed.

## Pages

- `/` — sign-in required. Add an expense (Наименование, Категория, Способ
  БВУ, Дата, Сумма, Бонус — Бонус % is auto-calculated from bonus/amount)
  and browse/edit/delete all entries.
- `/dashboard` — sign-in required. KPIs, spending by category, by payment
  method, bonuses earned by payment method, by household member, a 12-month
  trend, and the largest transactions for the selected period. "← Назад"
  returns to `/`.

## Deployment (GitHub Pages)

Pushing to `main` runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml),
which builds a static export (`next build` with `output: "export"`) and
publishes it to GitHub Pages.

One-time setup in the repo: **Settings -> Pages -> Build and deployment ->
Source -> GitHub Actions**. After that, the site is available at
`https://<owner>.github.io/expenses/`.

The Supabase URL and publishable key are safe to ship in the client bundle
(access is controlled by Row Level Security policies, not by keeping the key
secret), so no repository secrets are required for the build.
