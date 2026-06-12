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
- **Database:** SQLite (`better-sqlite3`)
- **3D Viz:** React Three Fiber + Drei
- **Icons:** `lucide-react`

## Getting Started

```bash
npm install

# Seed the SQLite database
npx tsx lib/seed.ts

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

SQLite is file-based (`triaxis.db`, gitignored). To reset:

```bash
rm triaxis.db
npx tsx lib/seed.ts
```

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
  cube/page.tsx           # 3D scatter plot
  game/[slug]/page.tsx    # Game detail + voting
  api/games/route.ts      # Games API
  api/votes/route.ts      # Votes API
components/
  GameCard.tsx            # Grid item with bars and vote count
  VoteSliders.tsx         # Three colored sliders
  ScoringGuide.tsx        # Help modal explaining the axes
  ThreeCube.tsx           # R3F Canvas + scene setup
lib/
  db.ts                   # SQLite client, schema, helpers
  seed.ts                 # Seed 10 competitive games
  utils.ts                # Sorting helpers
public/
  placeholder-cover.svg   # Placeholder cover art
```

## Notes

- Anonymous voting with no deduplication (unlimited votes per person).
- Vote averages update in real-time in the DB, but the UI requires a manual refresh to see changes.
- Games with **0 votes** show placeholder bars at 50% and a "Be the first to vote" message.
- The 3D cube only displays dots for games that have received at least one vote.
