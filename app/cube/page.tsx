import { getAllGames, getVotesByGameId, Vote } from '@/lib/db';
import ThreeCube from '@/components/ThreeCube';

export const dynamic = 'force-dynamic';

export default async function CubePage() {
  const games = getAllGames();

  const votesByGameId: Record<number, Vote[]> = {};
  for (const game of games) {
    votesByGameId[game.id] = getVotesByGameId(game.id);
  }

  return <ThreeCube games={games} votesByGameId={votesByGameId} />;
}
