import { ensureSchema, getGameBySlug } from '@/lib/db';
import VoteSliders from '@/components/VoteSliders';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSchema();
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center animate-fade-in"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center border border-stroke bg-panel mb-6"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="text-ink-muted"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-dharma)] text-4xl font-normal uppercase text-ink mb-3"
        >Game not found</h1>
        <p className="text-sm text-ink-dim mb-8"
        >The game you&apos;re looking for doesn&apos;t exist in the catalog.</p>
        <Link href="/" className="btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </Link>
      </div>
    );
  }

  const nameSum = game.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = (nameSum * 137.5) % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 animate-fade-in"
    >
      {/* Back link */}
      <div className="mb-6"
      >
        <Link href="/" className="glitch-link text-xs text-ink-muted group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="transition-transform group-hover:-translate-x-0.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </Link>
      </div>

      {/* Game Header */}
      <div className="mb-8 flex items-center gap-5"
      >
        <div
          className="relative flex h-20 w-20 items-center justify-center border border-stroke overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1} 70% 35%), hsl(${hue2} 60% 25%))`,
          }}
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.15)_4px,rgba(0,0,0,0.15)_8px)]" />
          <span className="relative text-2xl font-bold text-ink font-[family-name:var(--font-dharma)] tracking-wider"
          >
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink font-[family-name:var(--font-body)] mb-2">{game.name}</h1>
          <span className="tag">{game.genre_tag || 'Unknown Genre'}</span>
        </div>
      </div>

      <VoteSliders
        slug={game.slug}
        initialExec={Math.round(game.exec_avg)}
        initialInfo={Math.round(game.info_avg)}
        initialMental={Math.round(game.mental_avg)}
        initialExecAvg={game.exec_avg}
        initialInfoAvg={game.info_avg}
        initialMentalAvg={game.mental_avg}
        initialVoteCount={game.vote_count}
      />
    </div>
  );
}
