'use client';

import { Game } from '@/lib/db';
import Link from 'next/link';

const COLORS = {
  exec: '#d5ff00',
  info: '#00f0ff',
  mental: '#ff2a00',
};

function Bar({ label, value, color, empty }: { label: string; value: number; color: string; empty?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-10 text-ink-muted text-[10px] uppercase tracking-widest font-semibold font-[family-name:var(--font-mono)]">{label}</span>
      <div className="bar-track flex-1">
        <div
          className="bar-fill"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            opacity: empty ? 0.12 : 1,
            boxShadow: empty ? 'none' : `0 0 12px ${color}30`,
          }}
        />
      </div>
      <span className={`w-8 text-right tabular-nums text-xs font-bold font-[family-name:var(--font-mono)] ${empty ? 'text-ink-muted' : 'text-ink'}`}>
        {empty ? '—' : Math.round(value)}
      </span>
    </div>
  );
}

export default function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const empty = game.vote_count === 0;

  const nameSum = game.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = (nameSum * 137.5) % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <Link
      href={`/game/${game.slug}`}
      className="group block relative grunge-card p-5 overflow-hidden opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s`, animationFillMode: 'forwards' }}
    >
      {/* Hover scan fill */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${COLORS.exec}08 0%, transparent 50%)`,
        }}
      />

      <div className="mb-4 flex items-center gap-4">
        <div
          className="relative flex h-12 w-12 items-center justify-center border border-stroke overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hue1} 70% 35%), hsl(${hue2} 60% 25%))`,
          }}
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(0,0,0,0.2)_3px,rgba(0,0,0,0.2)_6px)]" />
          <span className="relative text-sm font-bold text-ink font-[family-name:var(--font-dharma)] tracking-wider">
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-bold text-ink group-hover:text-acid transition-colors text-sm font-[family-name:var(--font-body)]">
            {game.name}
          </h3>
          {game.genre_tag ? (
            <p className="text-[10px] text-ink-muted uppercase tracking-wider mt-0.5 font-[family-name:var(--font-mono)]">{game.genre_tag}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5">
        <Bar label="Exec" value={game.exec_avg} color={COLORS.exec} empty={empty} />
        <Bar label="Info" value={game.info_avg} color={COLORS.info} empty={empty} />
        <Bar label="Mind" value={game.mental_avg} color={COLORS.mental} empty={empty} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-stroke pt-3">
        <div className="text-[10px] text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
          {empty ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-red animate-pulse" />
              Be the first to vote
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 bg-acid" />
              {game.vote_count} vote{game.vote_count === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="text-ink-muted opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 -translate-x-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
