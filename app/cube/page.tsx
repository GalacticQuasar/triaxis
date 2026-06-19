import { ensureSchema, getAllGames, getAllVotesByGameId } from '@/lib/db';
import ThreeCube from '@/components/ThreeCube';

export const dynamic = 'force-dynamic';

export default async function CubePage() {
  await ensureSchema();
  // Parallel: games + all votes in 2 round-trips instead of 1 + N sequential.
  const [games, votesByGameId] = await Promise.all([
    getAllGames(),
    getAllVotesByGameId(),
  ]);

  return <ThreeCube games={games} votesByGameId={votesByGameId} />;
}
