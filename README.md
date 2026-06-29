# Triaxis

A platform for rating competitive games on three independent axes: **Execution**, **Info**, and **Mental**. Community votes position each game as a vector in 3D space, browsable through a catalog, detail pages, and an interactive 3D scatter plot.

## Features

- **Game Catalog** — 10 hand-picked competitive games in a responsive, sortable grid
- **Anonymous Voting** — Three sliders (0–100) per game with a built-in scoring guide
- **3D Visualization** — Interactive scatter plot at `/cube` showing games positioned by their averages

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Typography:** Bebas Neue (display), Chakra Petch (body), JetBrains Mono (data/labels)
- **Database:** Turso (libSQL — network-attached SQLite) via `@libsql/client`
- **3D Viz:** React Three Fiber + Drei
- **Icons:** `lucide-react`

## Getting Started

You'll need a Turso database (free tier is fine). Create one at [turso.tech](https://turso.tech), then grab the **URL** (`libsql://…`) and a **read-write auth token** from the database dashboard.

```bash
npm install

# Create .env in the repo root (gitignored):
#   TURSO_DATABASE_URL=libsql://<your-db>.turso.io
#   TURSO_AUTH_TOKEN=eyJ...

# Seed the database (10 games + 100 votes: 1 hardcoded + 9 seeded-random per game)
npx tsx --env-file=.env lib/seed.ts

# Start the dev server (loads .env automatically)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Turso is remote-only — there is no local SQLite file fallback. The schema is bootstrapped idempotently by `ensureSchema()` in `lib/db.ts` and runs once per server process.

To reset:

```bash
# --wipe drops all votes + games and resets AUTOINCREMENT sequences before seeding
npx tsx --env-file=.env lib/seed.ts --wipe
```

Without `--wipe`, `INSERT OR IGNORE` on the games table makes the seed idempotent for games, but re-running will duplicate votes.

## Deployment

The app deploys to Vercel's free tier. Turso's free tier covers the database.

1. Push the repo to GitHub.
2. Import it on [vercel.com](https://vercel.com) — Next.js is auto-detected.
3. Add environment variables in the Vercel project settings (apply to Production at minimum):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy. Picking a Vercel region close to your Turso DB region minimizes page-load latency.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/games` | List all games. Optional: `?sort=votes\|exec\|info\|mental` |
| `GET` | `/api/games?slug=...` | Single game lookup |
| `POST` | `/api/votes` | Body: `{slug, exec, info, mental}`. Inserts vote and recalculates averages. |

## Project Structure

```
app/
  layout.tsx              # Root layout with dark theme and nav
  page.tsx                # Homepage: catalog grid
  globals.css             # Tailwind v4 theme tokens & utilities
  _components/
    Footer.tsx            # Client footer (hidden on /cube)
  cube/page.tsx           # 3D scatter plot
  game/[slug]/page.tsx    # Game detail + voting
  api/games/route.ts      # Games API
  api/votes/route.ts      # Votes API
components/
  GameCard.tsx            # Grid item with bars and vote count
  VoteSliders.tsx         # Three colored sliders

  ThreeCube.tsx           # R3F Canvas + scene setup
  CubeStatsCard.tsx       # Rich stats panel shown on cube dot selection
  cube-viz.tsx            # Shared 3D viz helpers (size-parametrized)
  HeroCube.tsx            # Non-interactive rotating mini cube in hero of /
  HeroCubeWithLabel.tsx   # Client wrapper for HeroCube + GlitchText label
  GlitchText.tsx          # Per-character resolve-from-random glitch animation
  SmoothScrollLink.tsx    # Client <a> wrapper that smooth-scrolls to an in-page anchor
lib/
  db.ts                   # Turso (libSQL) async client, schema, helpers
  seed.ts                 # Seed 10 competitive games + 100 votes (1 hardcoded + 9 seeded-random per game)
  utils.ts                # Sorting helpers
public/
  placeholder-cover.svg   # Placeholder cover art (plus default Next.js assets)
```

## Notes

- Anonymous voting with no deduplication (unlimited votes per person).
- On game detail pages, `VoteSliders` updates the Community Averages bars in place after a successful vote — no page reload required.
- Games with **0 votes** show placeholder bars at 50% and a "Be the first to vote" message.
- The 3D cube only displays dots for games that have received at least one vote.
- See `AGENTS.md` for non-obvious implementation context (load-bearing traps, caching, RSC serialization quirks).