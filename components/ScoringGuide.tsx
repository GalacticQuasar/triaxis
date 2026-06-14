'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const EXAMPLES = [
  {
    axis: 'Execution',
    color: '#2ec4b6',
    what: 'Aim, timing, movement, muscle memory, inputs.',
    cheat: 'Aimbot / perfect inputs every time',
    games: 'Osu!, Tetris, Quake, Geometry Dash, Smash Melee',
  },
  {
    axis: 'Information',
    color: '#ef767a',
    what: 'Knowing things your opponent does not: hidden state, map awareness, economy tracking.',
    cheat: 'Wallhack / seeing hidden information',
    games: 'CS2 (info reads), Poker (hole cards), Hearthstone (deck tracking), StarCraft (scouting)',
  },
  {
    axis: 'Mental',
    color: '#7d53de',
    what: 'Reading people, adapting on the fly, managing variance, long-term strategy, tilt control.',
    cheat: 'Seeing the future / perfect reads every time',
    games: 'Poker, Chess, Dota 2, League of Legends, Fighting Games (mind games)',
  },
];

export default function ScoringGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors border border-transparent hover:border-border-subtle"
        aria-label="Open scoring guide"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How to score
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-12 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative w-full max-w-2xl rounded-2xl border border-border-default bg-surface p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-rajdhani)] text-xl font-bold tracking-wide text-text-primary">
                  How to Score Games
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Rate each game from 0 to 100 on three independent axes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors border border-transparent hover:border-border-subtle"
                aria-label="Close guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {EXAMPLES.map((ex) => (
                <div
                  key={ex.axis}
                  className="rounded-xl border border-border-subtle bg-surface-raised/50 p-5"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ex.color, boxShadow: `0 0 8px ${ex.color}60` }}
                    />
                    <span className="text-sm font-bold font-[family-name:var(--font-rajdhani)] uppercase tracking-wider" style={{ color: ex.color }}>
                      {ex.axis}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-text-secondary leading-relaxed">
                    <p>
                      <span className="text-text-muted font-medium">What it tests:</span> {ex.what}
                    </p>
                    <p>
                      <span className="text-text-muted font-medium">Cheat test:</span> {ex.cheat}
                    </p>
                    <p>
                      <span className="text-text-muted font-medium">High-score examples:</span> {ex.games}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
