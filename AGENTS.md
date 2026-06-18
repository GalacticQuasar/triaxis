# Triaxis — Agent Guide

## Project Overview

Triaxis is a web platform where competitive gamers rate games on three independent axes: **Execution**, **Info**, and **Mental**. Games are positioned as vectors in 3D space. Community voting (anonymous, unlimited) drives the averages.

## Critical Context

- **This is NOT standard Next.js.** We are on Next.js 16.2.9 with breaking changes. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- **Dynamic route `params` are Promises.** In `app/game/[slug]/page.tsx`, you **must** `await params` before destructuring.
- **Server Actions (`"use server"`)** exist, but this POC uses traditional Route Handlers (`app/api/**/route.ts`) for simplicity.
- **Averages are live client-side.** `VoteSliders` renders the Community Averages bars and owns them as state; on submit it reads the updated averages from the `/api/votes` POST response and animates the bars in place. Do not reintroduce a server-rendered averages block on the game detail page.
- **On submit, scroll to the top before the bars animate.** `VoteSliders` calls `window.scrollTo({ top: 0, behavior: 'smooth' })` inside a `requestAnimationFrame` *after* `setSaving(true)`. The rAF deferral is load-bearing — calling it synchronously lets React's re-render cancel the smooth-scroll animation (verified experimentally). Do not inline the scroll before the state update. The scroll container is `documentElement`, not `body` (body is `overflow: hidden` via the flex layout), so `scrollIntoView` on a ref only partially scrolls; use `window.scrollTo` to reach the game title/header.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Typography | Bebas Neue (display), Chakra Petch (body), JetBrains Mono (data/labels) |
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
  layout.tsx              # Root layout: nav, typography/font vars, scanline/noise overlays
  page.tsx                # Game catalog grid (home)
  globals.css             # Tailwind v4 theme tokens, utilities, & custom range input
  favicon.ico
  _components/
    Footer.tsx            # Client footer (hidden on /cube)
  cube/page.tsx           # Full-page 3D scatter plot
  game/[slug]/page.tsx    # Game detail header (averages + voting now live in VoteSliders)
  api/games/route.ts      # GET list / single game
  api/votes/route.ts      # POST anonymous vote — returns { success, game: {exec_avg, info_avg, mental_avg, vote_count} }
components/
  GameCard.tsx            # Grid item with bars
  VoteSliders.tsx         # Client component: Community Averages bars + three sliders. Owns averages as state and updates them from the POST response so bars animate without a reload.
  ScoringGuide.tsx        # Help modal for rating
  ThreeCube.tsx           # R3F Canvas + scene
  CubeStatsCard.tsx       # Rich stats panel shown on cube dot selection
lib/
  db.ts                   # SQLite client, schema, helpers
  seed.ts                 # Seed 10 games + 30 initial votes (3 per game)
  utils.ts                # Sorting helpers
  better-sqlite3.d.ts     # Type declarations
public/
  placeholder-cover.svg   # Default Next.js placeholder assets (file/globe/window.svg)
```

## Visual System

The current UI is a **techno-grunge** aesthetic.

- **Palette**: near-black `#050505` background, asphalt panels `#0e0e0e`, acid yellow `#d5ff00`, hot red `#ff2a00`, cyan `#00f0ff`.
- **Axes mapping**: Execution = acid yellow, Information = cyan, Mental = hot red.
- **Surfaces**: hard-edged, clipped-corner panels via `.grunge-card`; use borders (`border-stroke`) instead of shadows/blur.
- **Texture**: fixed `scanlines` + heavy `noise-overlay` layers sit above the page; do not remove them.
- **Typography**: Bebas Neue for all display/headlines, Chakra Petch for body, JetBrains Mono for data/labels/badges.
- **Bars**: `.bar-track` / `.bar-fill` for every data bar (community averages, game cards, sliders). No rounded progress bars.
- **Buttons**: `.btn` base; `.btn-primary` for CTAs. Clipped corners, 1px borders, uppercase labels.
- **Links**: `.glitch-link` for hover-underline nav style.
- **Custom range inputs**: styled in `globals.css` — square track, square thumb, no rounded edges.

## Conventions

- All pages that read from the DB export `const dynamic = 'force-dynamic'` to avoid stale data at build time.
- Dark mode is **always on** via `className="dark"` on `<html>`.
- No auth, no env vars, no external services.
