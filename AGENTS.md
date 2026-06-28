# Triaxis — Agent Guide

## Project Overview

Triaxis is a web platform where competitive gamers rate games on three independent axes: **Execution**, **Info**, and **Mental**. Games are positioned as vectors in 3D space. Community voting (anonymous, unlimited) drives the averages.

## Maintaining this file

This file captures **non-obvious, load-bearing context** so a fresh agent doesn't start from scratch. Keep it tight.

**Add** an entry only when:
- The obvious thing to do would break something (a trap), and the reason isn't visible from the code itself.

**Don't add** an entry for:
- The default state — what something *isn't* (e.g., "no outline on the wrapper").
- Anything trivially discoverable by reading the relevant file.
- Stylistic preferences already implied by existing patterns.

**When behavior changes:** edit existing bullets in place; remove entries that no longer apply. Don't append — this isn't a changelog.

**Self-test before adding:** "Would a fresh agent waste time or break something without knowing this?" If no, cut it.

## Critical Context

- **This is NOT standard Next.js.** We are on Next.js 16 with breaking changes; read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- **Dynamic route `params` are Promises.** In `app/game/[slug]/page.tsx`, you **must** `await params` before destructuring.
- **Averages are live client-side, owned by `VoteSliders`.** Do not reintroduce a server-rendered averages block on the game detail page — `VoteSliders` reads updated averages from the `/api/votes` POST response and animates the bars in place.
- **On submit, scroll to the top before the bars animate.** `VoteSliders` calls `window.scrollTo({ top: 0, behavior: 'smooth' })` inside a `requestAnimationFrame` *after* `setSaving(true)`. The rAF deferral is load-bearing — calling it synchronously lets React's re-render cancel the smooth-scroll animation (verified experimentally). The scroll container is `documentElement`, not `body` (body is `overflow: hidden` via the flex layout), so `scrollIntoView` on a ref only partially scrolls; use `window.scrollTo` to reach the game title/header.
- **No global `scroll-behavior: smooth`.** Do NOT add `html { scroll-behavior: smooth }` or `data-scroll-behavior="smooth"` on `<html>`. A global smooth rule hijacks browser back/forward scroll restoration, so navigation animates from the top to the saved scroll position instead of instantly snapping to it. Smooth scroll is opt-in per-call (`VoteSliders`'s `window.scrollTo`, and `SmoothScrollLink` for the hero's "Browse Catalog" button). Do not switch the latter back to a plain `<a href="#catalog">` — that would snap instantly under the no-global-rule constraint.
- **CubeStatsCard entrance animation has two load-bearing guards.** (1) While the staggered `animate-fade-in-up` children run, the card uses `overflowY: 'hidden'` (via an `animating` state cleared by a `setTimeout` keyed on `game.id`) to prevent a transient scrollbar from the `translateY`; it switches to `overflow-y: auto` afterwards. (2) The `animating` state resets via the `game.id` effect dependency — do not set it synchronously in the effect (ESLint `react-hooks/set-state-in-effect`).
- **Cube viz helpers are NOT shared by both cubes.** `components/cube-viz.tsx` exports size-parametrized `avgToPosition`/`voteToPosition`/`VoteCluster`/`ClusterDot`, but only `HeroCube` imports them (passing `size={5}`). `ThreeCube` has its own local hardcoded copies (size `10`/`-5..+5`). If you edit `cube-viz.tsx` expecting `ThreeCube` to pick up the change, it won't — update both, or unify them deliberately.
- **Hero cube cycle + click wiring.** Cycle advancement uses the `setActiveIndex(prev => ...)` updater form (not a `let i` closure) to avoid the `react-hooks/set-state-in-effect` lint rule. In `app/page.tsx`, `HeroCubeWithLabel` is wrapped in a Next.js `<Link href="/cube">`; the inner container keeps `pointer-events-none` so the canvas doesn't capture clicks (the Link does) — do not remove `pointer-events-none` or the cube stops being clickable.
- **The `/cube` camera is driven by `CameraTarget` in `ThreeCube.tsx`.** Two load-bearing traps: (1) The camera translates by the same per-frame delta as the `target` lerp so the cube's orientation stays fixed (only the rotation center moves) — do not move the target without also moving the camera, or the view will swing toward the new target. (2) Auto-zoom (to `SELECTED_DISTANCE` on select, back to `INITIAL_DISTANCE` on deselect) is gated behind a `resettingZoom` ref that is cleared on the OrbitControls `'start'` event (wheel/drag) so manual input is never fought — never let auto-zoom run unconditionally each frame.
- **The DB is Turso (libSQL), not local SQLite.** All db helpers in `lib/db.ts` are `async` and go over the network; `await` them at every call site. There is no local file fallback and no `triaxis.db` — do not reintroduce `better-sqlite3`. Two load-bearing traps: (1) **libSQL rows are not plain objects** — `@libsql/client` returns rows as instances of an internal `Row` class, and Next.js RSC serialization rejects non-plain objects when passing them from Server to Client Components (error: "Only plain objects can be passed to Client Components…"). Every query helper in `lib/db.ts` spreads rows through `toPlain<T>()` to strip the prototype — any new query helper must do the same, or the page renders will throw. (2) **Never loop `getVotesByGameId` per game** — that's an N+1 over a remote DB and was the cause of multi-second page loads. Pages that need votes for all games use `getAllVotesByGameId()` (one round-trip, grouped in JS) and `Promise.all([getAllGames(), getAllVotesByGameId()])` to parallelize. `getVotesByGameId(gameId)` exists for single-game paths only.
- **The `/cube` game list and the 3D dots share hover state bidirectionally.** A single `hoveredId` in `ThreeCube` drives both: hovering a list entry sets `hoveredId`, which `GameDot` reads (via its `hoveredId` prop) to expand/glow/label just as a direct pointer hover does; conversely, `GameDot.onHover` writes the id back so the corresponding list row highlights. Do not split these into two independent hover states or the two surfaces will desync. `selectGame`/`deselect` are `useCallback`-wrapped because the keyboard nav `useEffect` depends on them — changing them back to plain functions reintroduces the `react-hooks/exhaustive-deps` warning. Arrow keys cycle the *filtered* list (respects the search box); the keydown handler early-returns while the search input is focused so typing doesn't hijack selection.
- **`ensureSchema()` is cached, do not bypass the cache.** It's backed by a module-level promise (`schemaPromise` in `lib/db.ts`) so the DDL round-trip runs once per server process, not per request. Calling `client.executeMultiple(...)` directly to "skip the wrapper" reintroduces a per-request round-trip. On failure the cache clears so the next request retries — preserve that `.catch` reset if you refactor.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Typography | Bebas Neue (display), Chakra Petch (body), JetBrains Mono (data/labels) |
| Database | Turso (libSQL, network SQLite) via `@libsql/client` |
| 3D Viz | React Three Fiber + Drei |
| Icons | `lucide-react` |

## Database

- **Host:** Turso (libSQL — network-attached SQLite). Remote only; no local file fallback.
- **Client & schema:** `lib/db.ts` (uses `@libsql/client`'s `createClient`). Schema bootstrap is `ensureSchema()`, cached via a module-level promise so it runs once per server process.
- **Env vars (required):** `TURSO_DATABASE_URL` (e.g. `libsql://<db>-<org>.turso.io`) and `TURSO_AUTH_TOKEN` (a long-lived JWT). Set in `.env` locally (gitignored) and in the Vercel project settings for production.
- **Seed script:** `lib/seed.ts` — inserts 10 games + 100 votes (1 hardcoded + 9 seeded-random per game). Run with `npx tsx --env-file=.env lib/seed.ts` (`tsx` does not auto-load `.env`). Pass `--wipe` to delete all rows before seeding: `npx tsx --env-file=.env lib/seed.ts --wipe`. The script calls `ensureSchema()` first, so it's safe to run against a fresh Turso DB.
- **Reset:** Run the seed script with `--wipe` (drops all votes + games + resets AUTOINCREMENT sequences), or drop & recreate the DB in the Turso dashboard. Without `--wipe`, `INSERT OR IGNORE` on games is idempotent for the games table but re-running will duplicate votes.

## Build & Dev

```bash
npm run dev                          # Turbopack dev server on :3000 (loads .env automatically)
npm run build                         # Production build (also runs TypeScript typecheck — there is no separate typecheck script)
npm run lint                          # ESLint
npx tsx --env-file=.env lib/seed.ts   # Seed/reseed the Turso DB (tsx doesn't auto-load .env)
```

- **No test suite.** There are no test scripts or test files; verify changes with `npm run lint && npm run build`.
- **No `serverExternalPackages` config needed.** `@libsql/client` is pure JS and bundles fine with Turbopack; the old `better-sqlite3` native-binding exclusion was removed during the Turso migration.

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
  ThreeCube.tsx           # R3F Canvas + scene, left game list + search panel, keyboard nav (full /cube page)
  CubeStatsCard.tsx       # Rich stats panel shown on cube dot selection
  cube-viz.tsx            # Shared 3D viz helpers: avgToPosition, voteToPosition, gameColor, VoteCluster, ClusterDot (size-parametrized)
  HeroCube.tsx            # Non-interactive rotating mini cube in hero of /; auto-cycles top-10 voted games
  HeroCubeWithLabel.tsx   # Client wrapper for HeroCube + bottom-right GlitchText label
  GlitchText.tsx          # Per-character resolve-from-random glitch animation
  SmoothScrollLink.tsx    # Client `<a>` wrapper that smooth-scrolls to an in-page anchor via scrollIntoView (opt-in; no global scroll-behavior)
  CatalogSearch.tsx       # Client search box + sort tabs + grid for the home catalog section; owns both sort (client state, sliding highlight) and name/genre filter. `app/page.tsx` no longer reads `searchParams` — pass it the unsorted `games`.
lib/
  db.ts                   # Turso (libSQL) async client, schema bootstrap (cached), query helpers, toPlain Row-stripping
  seed.ts                 # Seed 10 games + 30 initial votes (3 per game); run with --env-file=.env
  utils.ts                # Sorting helpers
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
- No auth. Two env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) are required for the DB; Turso is the only external service.
- **Native input focus rings are suppressed globally** in `globals.css` (`input:focus`/`:focus-visible` → `outline: none; box-shadow: none`). Inputs that want a focus affordance must style it themselves (the `/cube` search bar does this via `focus:border-acid` + a `transition-[border-color]` fade) — don't re-add a native outline on an individual input, or you'll get the double-ring bug back.
