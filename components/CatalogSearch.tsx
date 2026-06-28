'use client';

import { useMemo, useState } from 'react';
import { Game } from '@/lib/db';
import GameCard from '@/components/GameCard';
import { Search, X } from 'lucide-react';

export default function CatalogSearch({ games }: { games: Game[] }) {
  const [search, setSearch] = useState('');

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.genre_tag?.toLowerCase().includes(q) ?? false),
    );
  }, [search, games]);

  return (
    <>
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or genre"
          className="w-full bg-panel border border-stroke pl-10 pr-10 py-2.5 text-xs text-ink placeholder:text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider focus:border-acid transition-[border-color] duration-200"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-acid transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGames.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
            No matches for &quot;{search}&quot;
          </div>
        ) : (
          filteredGames.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))
        )}
      </div>
    </>
  );
}