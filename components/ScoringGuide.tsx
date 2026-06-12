'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const EXAMPLES = [
  {
    axis: 'Execution',
    color: '#22d3ee',
    what: 'Aim, timing, movement, muscle memory, inputs.',
    cheat: 'Aimbot / perfect inputs every time',
    games: 'Osu!, Tetris, Quake, Geometry Dash, Smash Melee',
  },
  {
    axis: 'Info',
    color: '#fbbf24',
    what: 'Knowing things your opponent does not: hidden state, map awareness, economy tracking.',
    cheat: 'Wallhack / seeing hidden information',
    games: 'CS2 (info reads), Poker (hole cards), Hearthstone (deck tracking), StarCraft (scouting)',
  },
  {
    axis: 'Mental',
    color: '#e879f9',
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
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        aria-label="Open scoring guide"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How to score
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 py-12 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">How to Score Games</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Rate each game from 0 to 100 on three independent axes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Close guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {EXAMPLES.map((ex) => (
                <div
                  key={ex.axis}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ex.color }}
                    />
                    <span className="text-sm font-semibold" style={{ color: ex.color }}>
                      {ex.axis}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p><span className="text-slate-500">What it tests:</span> {ex.what}</p>
                    <p><span className="text-slate-500">Cheat test:</span> {ex.cheat}</p>
                    <p><span className="text-slate-500">High-score examples:</span> {ex.games}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
              <strong className="block mb-1 text-slate-200">Important rules</strong>
              <ul className="list-disc space-y-1 pl-4">
                <li>These are three independent bars, not a triangle. A game can max all three at once.</li>
                <li>Only rate competitive PvP or ranked PvE games.</li>
                <li>Vote based on the skill ceiling at high-level play, not how you personally feel.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
