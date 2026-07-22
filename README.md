# Expenses

A small expense tracker built with Next.js (static export) and Supabase.

## Stack

- Next.js (App Router, client components, `output: "export"` static build)
- Tailwind CSS
- Supabase (Postgres + REST API via `@supabase/supabase-js`)

## Setup

1. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql) once in your
   Supabase project's SQL Editor to create the `expenses` table.
2. Copy `.env.example` to `.env.local` and fill in your Supabase project's
   URL and publishable key (Project Settings -> API).
3. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

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
