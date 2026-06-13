'use client';

import { Game } from '@/lib/db';
import Link from 'next/link';

const COLORS = {
  exec: '#2ec4b6',
  info: '#ef767a',
  mental: '#7d53de',
};

function Bar({ label, value, color, empty }: { label: string; value: number; color: string; empty?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-10 text-text-muted text-[10px] uppercase tracking-widest font-medium">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            opacity: empty ? 0.15 : 1,
            boxShadow: empty ? 'none' : `0 0 8px ${color}40`,
          }}
        />
      </div>
      <span className={`w-8 text-right tabular-nums text-xs font-medium ${empty ? 'text-text-muted' : 'text-text-secondary'}`}>
        {empty ? '—' : Math.round(value)}
      </span>
    </div>
  );
}

export default function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const empty = game.vote_count === 0;

  // Generate a deterministic gradient based on game name
  const nameSum = game.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = (nameSum * 137.5) % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <Link
      href={`/game/${game.slug}`}
      className="group block relative rounded-2xl glass-card p-5 overflow-hidden opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s`, animationFillMode: 'forwards' }}
    >
      {/* Hover glow */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${COLORS.exec}08, transparent 40%)`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${COLORS.exec}40, ${COLORS.info}40, ${COLORS.mental}40, transparent)`,
        }}
      />

      <div className="mb-4 flex items-center gap-4">
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border-default overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1} 60% 15% / 0.8), hsl(${hue2} 50% 10% / 0.8))`,
          }}
        >
          {/* Animated inner glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-accent-sea/10 to-transparent" />
          <span className="relative text-sm font-bold text-text-primary font-[family-name:var(--font-rajdhani)] tracking-wider">
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text-primary group-hover:text-accent-sea transition-colors text-sm">
            {game.name}
          </h3>
          {game.genre_tag ? (
            <p className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">{game.genre_tag}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5">
        <Bar label="Exec" value={game.exec_avg} color={COLORS.exec} empty={empty} />
        <Bar label="Info" value={game.info_avg} color={COLORS.info} empty={empty} />
        <Bar label="Mind" value={game.mental_avg} color={COLORS.mental} empty={empty} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-[11px] text-text-muted">
          {empty ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent-coral/60 animate-pulse" />
              Be the first to vote
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent-sea" />
              {game.vote_count} vote{game.vote_count === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="text-text-muted opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 -translate-x-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
