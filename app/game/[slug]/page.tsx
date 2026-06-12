import { getGameBySlug } from '@/lib/db';
import VoteSliders from '@/components/VoteSliders';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-100">Game not found</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-cyan-400 hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  const empty = game.vote_count === 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-slate-300">
          {game.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{game.name}</h1>
          {game.genre_tag ? <p className="text-sm text-slate-500">{game.genre_tag}</p> : null}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
          Community Averages
        </h2>
        <div className="space-y-3">
          <BigBar label="Execution" value={game.exec_avg} color="#22d3ee" empty={empty} />
          <BigBar label="Info" value={game.info_avg} color="#fbbf24" empty={empty} />
          <BigBar label="Mental" value={game.mental_avg} color="#e879f9" empty={empty} />
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {empty ? 'Be the first to vote.' : `${game.vote_count} vote${game.vote_count === 1 ? '' : 's'}`}
        </div>
      </div>

      <VoteSliders
        slug={game.slug}
        initialExec={Math.round(game.exec_avg)}
        initialInfo={Math.round(game.info_avg)}
        initialMental={Math.round(game.mental_avg)}
      />

      <div className="mt-6">
        <Link href="/" className="text-sm text-cyan-400 hover:underline">
          ← Back to catalog
        </Link>
      </div>
    </div>
  );
}

function BigBar({
  label,
  value,
  color,
  empty,
}: {
  label: string;
  value: number;
  color: string;
  empty?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className={`tabular-nums ${empty ? 'text-slate-500' : 'text-slate-200'}`}>
          {empty ? '—' : Math.round(value)}
        </span>
      </div>
      <div className="h-3 w-full rounded bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            opacity: empty ? 0.35 : 1,
          }}
        />
      </div>
    </div>
  );
}
