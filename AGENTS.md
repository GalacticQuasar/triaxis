# Triaxis — Agent Guide

## Project Overview

Triaxis is a web platform where competitive gamers rate games on three independent axes: **Execution**, **Info**, and **Mental**. Games are positioned as vectors in 3D space. Community voting (anonymous, unlimited) drives the averages.

## Critical Context

- **This is NOT standard Next.js.** We are on Next.js 16.2.9 with breaking changes. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- **Dynamic route `params` are Promises.** In `app/game/[slug]/page.tsx`, you **must** `await params` before destructuring.
- **Server Actions (`"use server"`)** exist, but this POC uses traditional Route Handlers (`app/api/**/route.ts`) for simplicity.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite (`better-sqlite3`) |
| 3D Viz | React Three Fiber + Drei |
| Icons | `lucide-react` |

## Database

- **File:** `triaxis.db` (gitignored)
- **Schema & client:** `lib/db.ts`
- **Seed script:** `lib/seed.ts`
- **Reset:** Delete `triaxis.db`, then `npx tsx lib/seed.ts`
- `better-sqlite3` has no bundled types. We ship a custom declaration file at `lib/better-sqlite3.d.ts`.

## Build & Dev

```bash
npm run dev      # Turbopack dev server on :3000
npm run build    # Production build
npm run lint     # ESLint
```

## File Structure

```
app/
  layout.tsx              # Root layout, dark mode, nav
  page.tsx                # Game catalog grid (home)
  cube/page.tsx           # Full-page 3D scatter plot
  game/[slug]/page.tsx    # Game detail + voting
  api/games/route.ts      # GET list / single game
  api/votes/route.ts      # POST anonymous vote
components/
  GameCard.tsx            # Grid item with bars
  VoteSliders.tsx         # Three colored sliders
  ScoringGuide.tsx        # Help modal for rating
  ThreeCube.tsx           # R3F Canvas + scene
lib/
  db.ts                   # SQLite client, schema, helpers
  seed.ts                 # Seed 10 games
  utils.ts                # Sorting helpers
  better-sqlite3.d.ts     # Type declarations
public/
  placeholder-cover.svg
```

## Conventions

- All pages that read from the DB export `const dynamic = 'force-dynamic'` to avoid stale data at build time.
- Dark mode is **always on** via `className="dark"` on `<html>`.
- No auth, no env vars, no external services.
