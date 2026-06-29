import type { Game } from '@/lib/db';

export type AxisWeights = { exec: number; info: number; mental: number };

export const DEFAULT_WEIGHTS: AxisWeights = { exec: 1, info: 1, mental: 1 };

export type TargetVector = { exec_avg: number; info_avg: number; mental_avg: number };

export type Neighbor = Game & { distance: number };

// Weighted Euclidean distance in 0-100 axis space. Weights default to 1 across
// all three axes; pass custom weights to emphasize an axis (e.g. /discover).
function weightedDistance(
  a: TargetVector,
  b: TargetVector,
  weights: AxisWeights,
): number {
  const dx = (a.exec_avg - b.exec_avg) * weights.exec;
  const dy = (a.info_avg - b.info_avg) * weights.info;
  const dz = (a.mental_avg - b.mental_avg) * weights.mental;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Return the k nearest neighbors to `seed`, excluding the seed itself (by id)
// and any ids in `excludeIds`. Only games with at least one vote are eligible,
// so un-voted placeholder games never surface as "similar".
export function nearestNeighbors(
  seed: TargetVector & { id: number },
  games: Game[],
  k: number,
  weights: AxisWeights = DEFAULT_WEIGHTS,
  excludeIds: Set<number> = new Set(),
): Neighbor[] {
  return games
    .filter((g) => g.id !== seed.id && !excludeIds.has(g.id) && g.vote_count > 0)
    .map((g) => ({ ...g, distance: weightedDistance(seed, g, weights) }))
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.name.localeCompare(b.name);
    })
    .slice(0, k);
}

// Mean vector across a set of games. Used by /discover "Pick" mode when the
// visitor just selects favorites (no per-game ratings): target = average of
// their selected games' community averages.
export function meanVector(games: Game[]): TargetVector | null {
  if (games.length === 0) return null;
  const sum = games.reduce(
    (acc, g) => {
      acc.exec += g.exec_avg;
      acc.info += g.info_avg;
      acc.mental += g.mental_avg;
      return acc;
    },
    { exec: 0, info: 0, mental: 0 },
  );
  const n = games.length;
  return { exec_avg: sum.exec / n, info_avg: sum.info / n, mental_avg: sum.mental / n };
}