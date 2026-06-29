import { ensureSchema, getAllGames, getAllVotesByGameId } from '@/lib/db';
import CatalogSearch from '@/components/CatalogSearch';
import HeroCubeWithLabel from '@/components/HeroCubeWithLabel';
import Link from 'next/link';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await ensureSchema();

  // Parallel: games + all votes in 2 round-trips instead of 1 + N sequential.
  const [games, votesByGameId] = await Promise.all([
    getAllGames(),
    getAllVotesByGameId(),
  ]);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-stroke bg-bg-raised">
        <div className="scan-streak" />
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
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
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/cube" className="btn btn-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  Explore 3D Cube
                </Link>
                <Link href="/discover" className="btn">
                  <Search size={14} strokeWidth={2} />
                  Find Your Matches
                </Link>
              </div>
            </div>

            {/* Rotating mini data cube */}
            <Link
              href="/cube"
              aria-label="Explore the 3D cube"
              className="group relative block h-64 sm:h-80 lg:h-96 w-full cursor-pointer"
            >
              <div className="pointer-events-none absolute inset-0">
                <HeroCubeWithLabel games={games} votesByGameId={votesByGameId} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="mx-auto max-w-6xl px-6 py-10 scroll-mt-16">
        <CatalogSearch games={games} />
      </section>
    </div>
  );
}
