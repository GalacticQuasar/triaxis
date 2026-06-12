'use client';

import { Game } from '@/lib/db';
import Link from 'next/link';

const COLORS = {
  exec: '#22d3ee',
  info: '#fbbf24',
  mental: '#e879f9',
};

function Bar({ label, value, color, empty }: { label: string; value: number; color: string; empty?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-slate-400 text-xs uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2.5 rounded bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            opacity: empty ? 0.4 : 1,
          }}
        />
      </div>
      <span className={`w-10 text-right tabular-nums ${empty ? 'text-slate-500' : 'text-slate-200'}`}>
        {empty ? '—' : Math.round(value)}
      </span>
    </div>
  );
}

export default function GameCard({ game }: { game: Game }) {
  const empty = game.vote_count === 0;

  return (
    <Link
      href={`/game/${game.slug}`}
      className="group block rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:border-slate-700 transition-colors"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-300">
          {game.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-medium text-slate-100 group-hover:text-cyan-300 transition-colors">
            {game.name}
          </h3>
          {game.genre_tag ? (
            <p className="text-xs text-slate-500">{game.genre_tag}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Bar label="Exec" value={game.exec_avg} color={COLORS.exec} empty={empty} />
        <Bar label="Info" value={game.info_avg} color={COLORS.info} empty={empty} />
        <Bar label="Mental" value={game.mental_avg} color={COLORS.mental} empty={empty} />
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {empty ? 'Be the first to vote.' : `${game.vote_count} vote${game.vote_count === 1 ? '' : 's'}`}
      </div>
    </Link>
  );
}
