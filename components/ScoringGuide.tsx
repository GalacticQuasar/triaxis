'use client';

import { useEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const EXAMPLES = [
  {
    axis: 'Execution',
    color: '#d5ff00',
    what: 'Aim, timing, movement, muscle memory, inputs.',
    cheat: 'Aimbot / perfect inputs every time',
    games: 'Osu!, Tetris, Quake, Geometry Dash, Smash Melee',
  },
  {
    axis: 'Information',
    color: '#00f0ff',
    what: 'Knowing things your opponent does not: hidden state, map awareness, economy tracking.',
    cheat: 'Wallhack / seeing hidden information',
    games: 'CS2 (info reads), Poker (hole cards), Hearthstone (deck tracking), StarCraft (scouting)',
  },
  {
    axis: 'Mental',
    color: '#ff2a00',
    what: 'Reading people, adapting on the fly, managing variance, long-term strategy, tilt control.',
    cheat: 'Seeing the future / perfect reads every time',
    games: 'Poker, Chess, Dota 2, League of Legends, Fighting Games (mind games)',
  },
];

export default function ScoringGuide() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const FADE_MS = 250;

  function dismiss() {
    if (closing) return;
    setClosing(true);
  }

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [closing]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn py-2 px-3"
        aria-label="Open scoring guide"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How to score
      </button>

      {open ? (
        <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-12 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className="absolute inset-0 bg-bg/90" onClick={dismiss} />

          <div className="relative w-full max-w-2xl border border-stroke bg-panel p-6 sm:p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
            <div className="mb-6 flex items-start justify-between border-b border-stroke pb-3">
              <div>
                <h2 className="font-[family-name:var(--font-dharma)] text-3xl font-normal uppercase tracking-wide text-ink">
                  How to Score Games
                </h2>
                <p className="mt-1 text-sm text-ink-dim font-[family-name:var(--font-mono)] uppercase tracking-wider">
                  Rate each game from 0 to 100 on three independent axes.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="btn p-2"
                aria-label="Close guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {EXAMPLES.map((ex) => (
                <div
                  key={ex.axis}
                  className="border border-stroke bg-bg-raised p-4 notch-left"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{ backgroundColor: ex.color, boxShadow: `0 0 10px ${ex.color}60` }}
                    />
                    <span className="text-sm font-bold font-[family-name:var(--font-dharma)] uppercase tracking-wider" style={{ color: ex.color }}>
                      {ex.axis}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-ink-dim leading-relaxed">
                    <p>
                      <span className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">What it tests:</span> {ex.what}
                    </p>
                    <p>
                      <span className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">Cheat test:</span> {ex.cheat}
                    </p>
                    <p>
                      <span className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">High-score examples:</span> {ex.games}
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
