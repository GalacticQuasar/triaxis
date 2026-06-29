import { ensureSchema, getAllGames } from '@/lib/db';
import DiscoverClient from '@/components/DiscoverClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'TRIAXIS // Discover',
  description: 'Find games that match your competitive taste across the three axes.',
};

export default async function DiscoverPage() {
  await ensureSchema();
  const games = await getAllGames();
  return <DiscoverClient games={games} />;
}