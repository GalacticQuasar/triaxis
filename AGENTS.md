# Triaxis — Agent Guide

## Project Overview

Triaxis is a web platform where competitive gamers rate games on three independent axes: **Execution**, **Info**, and **Mental**. Games are positioned as vectors in 3D space. Community voting (anonymous, unlimited) drives the averages.

## Critical Context

- **This is NOT standard Next.js.** We are on Next.js 16.2.9 with breaking changes. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- **Dynamic route `params` are Promises.** In `app/game/[slug]/page.tsx`, you **must** `await params` before destructuring.
- **Server Actions (`"use server"`)** exist, but this POC uses traditional Route Handlers (`app/api/**/route.ts`) for simplicity.
- **Averages are live client-side.** `VoteSliders` renders the Community Averages bars and owns them as state; on submit it reads the updated averages from the `/api/votes` POST response and animates the bars in place. Do not reintroduce a server-rendered averages block on the game detail page.
- **On submit, scroll to the top before the bars animate.** `VoteSliders` calls `window.scrollTo({ top: 0, behavior: 'smooth' })` inside a `requestAnimationFrame` *after* `setSaving(true)`. The rAF deferral is load-bearing — calling it synchronously lets React's re-render cancel the smooth-scroll animation (verified experimentally). Do not inline the scroll before the state update. The scroll container is `documentElement`, not `body` (body is `overflow: hidden` via the flex layout), so `scrollIntoView` on a ref only partially scrolls; use `window.scrollTo` to reach the game title/header.
- **No global `scroll-behavior: smooth`.** Do NOT add `html { scroll-behavior: smooth }` or `data-scroll-behavior="smooth"` on `<html>`. A global smooth rule hijacks browser back/forward scroll restoration, so navigation animates from the top to the saved scroll position instead of instantly snapping to it. Smooth scroll is opt-in per-call: `VoteSliders` uses `window.scrollTo({ behavior: 'smooth' })` on submit, and the hero's "Browse Catalog" button uses `SmoothScrollLink` (a client component wrapping an `<a>` whose `onClick` calls `scrollIntoView({ behavior: 'smooth' })` + `history.replaceState`). Do not switch the latter back to a plain `<a href="#catalog">` — that would snap instantly under the no-global-rule constraint.
- **CubeStatsCard re-mounts per selection.** `ThreeCube` passes `key={selectedGame.id}` to `CubeStatsCard` so it re-mounts and its staggered entrance animation replays each time a different dot is picked. The card container only fades in (`animate-fade-in`, opacity-only — do not translate the card itself); inner sections stagger via `animate-fade-in-up` with incremental delays. While the entrance animation runs the card uses `overflowY: 'hidden'` (via an `animating` state cleared by a `setTimeout` keyed on `game.id`) to prevent a transient scrollbar from the `translateY` on staggered children; it switches to `overflow-y: auto` afterwards. The `animating` state resets via the `game.id` effect dependency — do not set it synchronously in the effect (ESLint `react-hooks/set-state-in-effect`).
- **3D viz logic is shared between both cubes via `components/cube-viz.tsx`.** `avgToPosition`, `voteToPosition`, `gameColor`, `VoteCluster`, and `ClusterDot` live there and are imported by both `ThreeCube` (full `/cube` page) and `HeroCube` (hero section of `/`). The coordinate-mapping helpers take a `size` parameter (default `10` for the main cube; the hero cube passes `5`) — when adding cube features that touch positions, thread the `size` through `VoteCluster` rather than hardcoding the main cube's `10`/`-5..+5` range, or the hero's vote dots will originate from the wrong point and fall outside the box.
- **Hero cube auto-cycles the top-10 most-voted games.** `HeroCube` (`components/HeroCube.tsx`) is a non-interactive (`pointer-events-none`) rotating cube in the hero of `/`. Every `CYCLE_INTERVAL_MS` it advances to the next of the top-10 games by `vote_count`, expanding that game's votes via a `VoteCluster` (forward) while the previous game's votes collapse (reverse `VoteCluster` with `onExited` cleanup). The active game is reported up via an `onActiveGameChange` callback to `HeroCubeWithLabel`, the client wrapper that renders the bottom-right glitch label (`GlitchText`) — a per-character resolve-from-random animation. Cycle advancement uses the `setActiveIndex(prev => ...)` updater form (not a `let i` closure) to avoid the `react-hooks/set-state-in-effect` lint rule. Unselected game dots are dimmed to gray (`DIM_GRAY`); the active dot retains its game color. The three cube edges touching the (+,+,+) corner fade from acid to gray via drei `<Line vertexColors>`; all other edges are solid gray.

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
npm run build    # Production build (also runs TypeScript typecheck — there is no separate typecheck script)
npm run lint     # ESLint
npx tsx lib/seed.ts  # Seed/reseed the DB (run after deleting triaxis.db)
```

- **No test suite.** There are no test scripts or test files; verify changes with `npm run lint && npm run build`.
- **`better-sqlite3` is in `serverExternalPackages`** (`next.config.ts`) so the native binding isn't bundled by Turbopack. Don't remove it or the build breaks.

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
  ThreeCube.tsx           # R3F Canvas + scene (full /cube page)
  CubeStatsCard.tsx       # Rich stats panel shown on cube dot selection
  cube-viz.tsx            # Shared 3D viz helpers: avgToPosition, voteToPosition, gameColor, VoteCluster, ClusterDot (size-parametrized)
  HeroCube.tsx            # Non-interactive rotating mini cube in hero of /; auto-cycles top-10 voted games
  HeroCubeWithLabel.tsx   # Client wrapper for HeroCube + bottom-right GlitchText label
  GlitchText.tsx          # Per-character resolve-from-random glitch animation
  SmoothScrollLink.tsx    # Client `<a>` wrapper that smooth-scrolls to an in-page anchor via scrollIntoView (opt-in; no global scroll-behavior)
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
