import { getGameBySlug } from '@/lib/db';
import VoteSliders from '@/components/VoteSliders';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center animate-fade-in"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised border border-border-default mb-6"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
        </div>
        <h1 className="font-[family-name:var(--font-rajdhani)] text-2xl font-bold text-text-primary mb-3"
        >Game not found</h1>
        <p className="text-sm text-text-secondary mb-8"
        >The game you&apos;re looking for doesn&apos;t exist in the catalog.</p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg border border-border-default px-5 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-border-default/80 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </Link>
      </div>
    );
  }

  // Generate a deterministic gradient based on game name
  const nameSum = game.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = (nameSum * 137.5) % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 animate-fade-in"
    >
      {/* Back link */}
      <div className="mb-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5"
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
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border-default overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1} 60% 15% / 0.9), hsl(${hue2} 50% 10% / 0.9))`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-sea/10 to-transparent" />
          <span className="relative text-2xl font-bold text-text-primary font-[family-name:var(--font-rajdhani)] tracking-wider"
          >
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{game.name}</h1>
          {game.genre_tag ? <p className="text-sm text-text-muted mt-1">{game.genre_tag}</p> : null}
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
