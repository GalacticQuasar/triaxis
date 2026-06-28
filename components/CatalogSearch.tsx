'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Game } from '@/lib/db';
import GameCard from '@/components/GameCard';
import { sortGames, SortKey } from '@/lib/utils';
import { Search, X } from 'lucide-react';

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'votes', label: 'Most Voted' },
  { key: 'exec', label: 'Execution' },
  { key: 'info', label: 'Info' },
  { key: 'mental', label: 'Mental' },
];

export default function CatalogSearch({ games }: { games: Game[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('votes');

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [highlight, setHighlight] = useState<{ x: number; w: number } | null>(null);

  const sortedGames = useMemo(() => sortGames(games, sortKey), [games, sortKey]);

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedGames;
    return sortedGames.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.genre_tag?.toLowerCase().includes(q) ?? false),
    );
  }, [search, sortedGames]);

  useEffect(() => {
    const active = tabRefs.current[sortKey];
    const container = containerRef.current;
    if (!active || !container) return;
    const a = active.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    setHighlight({ x: a.left - c.left, w: a.width });
  }, [sortKey]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-stroke pb-5">
        <div>
          <h2 className="font-[family-name:var(--font-dharma)] text-4xl font-normal uppercase tracking-wide text-ink">
            Game Catalog
          </h2>
          <p className="text-xs text-ink-muted mt-1 font-[family-name:var(--font-mono)] uppercase tracking-wider">
            {filteredGames.length} games rated by the community
          </p>
        </div>
        <div ref={containerRef} className="relative flex items-center gap-1 text-sm border border-stroke bg-panel p-1">
          {highlight && (
            <span
              aria-hidden
              className="absolute top-1 bottom-1 bg-acid transition-[left,width] duration-100 ease-out"
              style={{ left: highlight.x, width: highlight.w }}
            />
          )}
          {SORT_TABS.map((s) => (
            <button
              key={s.key}
              ref={(el) => {
                tabRefs.current[s.key] = el;
              }}
              type="button"
              onClick={() => setSortKey(s.key)}
              className={`relative z-10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200 ${
                sortKey === s.key
                  ? 'text-bg'
                  : 'text-ink-dim hover:text-acid'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

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