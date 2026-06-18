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
      <section className="relative overflow-hidden border-b border-border-subtle hero-glow">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised/60 px-3 py-1 text-xs font-medium text-text-secondary backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sea animate-pulse" />
              Community-Powered Rankings
            </div>

            <h1 className="font-[family-name:var(--font-rajdhani)] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
              Rate games on
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-sea via-accent-coral to-accent-purple">
                three axes
              </span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed mb-8">
              Execution. Information. Mental. Map competitive games in 3D space and discover
              where your favorites stand.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/?sort=votes"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-sea/10 border border-accent-sea/30 px-5 py-2.5 text-sm font-semibold text-accent-sea hover:bg-accent-sea/20 transition-colors"
              >
                Browse Catalog
              </Link>
              <Link
                href="/cube"
                className="inline-flex items-center gap-2 rounded-lg border border-border-default px-5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-border-default/80 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                Explore 3D Cube
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 hidden lg:block pointer-events-none"
        >
          <div className="relative w-48 h-48 opacity-20">
            <div className="absolute inset-0 border border-accent-sea/40 rotate-45" />
            <div className="absolute inset-4 border border-accent-coral/40" />
            <div className="absolute inset-8 border border-accent-purple/40 rotate-45" />
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-rajdhani)] text-xl font-semibold tracking-wide uppercase text-text-primary"
            >
              Game Catalog
            </h2>
            <p className="text-sm text-text-muted mt-1">
              {games.length} games rated by the community
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm rounded-lg border border-border-subtle bg-surface-raised/50 p-1"
          >
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  sortKey === s.key
                    ? 'bg-surface-raised border border-border-default text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
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
