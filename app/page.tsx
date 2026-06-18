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
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-stroke bg-bg-raised">
        <div className="scan-streak" />
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-stroke bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              <span className="h-1.5 w-1.5 bg-acid animate-pulse" />
              Community-Powered Rankings
            </div>

            <h1 className="font-[family-name:var(--font-dharma)] text-6xl sm:text-7xl lg:text-8xl font-normal uppercase tracking-tight text-ink leading-[0.9] mb-6">
              Rate games on
              <br />
              <span className="text-acid">three axes</span>
            </h1>
            <p className="text-base sm:text-lg text-ink-dim max-w-lg leading-relaxed mb-8 font-[family-name:var(--font-body)]">
              Execution. Information. Mental. Map competitive games in 3D space and discover
              where your favorites stand.
            </p>
            <div className="flex items-center gap-4">
              <a href="#catalog" className="btn btn-primary">
                Browse Catalog
              </a>
              <Link href="/cube" className="btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                Explore 3D Cube
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative glyph */}
        <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden lg:block pointer-events-none opacity-20">
          <div className="relative w-56 h-56 rotate-3">
            <div className="absolute inset-0 border border-acid/60" />
            <div className="absolute inset-5 border border-cyan/40 rotate-45" />
            <div className="absolute inset-12 border border-red/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-[family-name:var(--font-dharma)] text-[10rem] text-stroke leading-none">3D</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="mx-auto max-w-6xl px-6 py-10 scroll-mt-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-stroke pb-5">
          <div>
            <h2 className="font-[family-name:var(--font-dharma)] text-4xl font-normal uppercase tracking-wide text-ink">
              Game Catalog
            </h2>
            <p className="text-xs text-ink-muted mt-1 font-[family-name:var(--font-mono)] uppercase tracking-wider">
              {games.length} games rated by the community
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm border border-stroke bg-panel p-1">
            {[
              { key: 'votes', label: 'Most Voted' },
              { key: 'exec', label: 'Execution' },
              { key: 'info', label: 'Info' },
              { key: 'mental', label: 'Mental' },
            ].map((s) => (
              <Link
                key={s.key}
                href={`/?sort=${s.key}`}
                scroll={false}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                  sortKey === s.key
                    ? 'bg-acid text-bg'
                    : 'text-ink-dim hover:text-acid'
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
