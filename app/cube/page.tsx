import { getAllGames } from '@/lib/db';
import ThreeCube from '@/components/ThreeCube';

export const dynamic = 'force-dynamic';

export default async function CubePage() {
  const games = getAllGames();
  return <ThreeCube games={games} />;
}
