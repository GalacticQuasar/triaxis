import { getAllGames } from '@/lib/db';
import { sortGames, SortKey } from '@/lib/utils';
import GameCard from '@/components/GameCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const sortKey: SortKey = ['votes', 'exec', 'info', 'mental'].includes(sort as string) ? (sort as SortKey) : 'votes';

  const games = sortGames(getAllGames(), sortKey);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
          Game Catalog
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Sort by:</span>
          {[
            { key: 'votes', label: 'Most Voted' },
            { key: 'exec', label: 'Execution' },
            { key: 'info', label: 'Info' },
            { key: 'mental', label: 'Mental' },
          ].map((s) => (
            <Link
              key={s.key}
              href={`/?sort=${s.key}`}
              className={`rounded-md px-2.5 py-1.5 transition-colors ${
                sortKey === s.key
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
