'use client';

import { useState } from 'react';

const COLORS = {
  exec: '#d5ff00',
  info: '#00f0ff',
  mental: '#ff2a00',
};

const AXIS_DETAILS = {
  Execution: {
    what: 'Aim, timing, movement, muscle memory, inputs.',
    cheat: 'Aimbot / perfect inputs every time',
    games: 'Osu!, Tetris, Quake, Geometry Dash, Smash Melee',
  },
  Information: {
    what: 'Knowing things your opponent does not: hidden state, map awareness, economy tracking.',
    cheat: 'Wallhack / seeing hidden information',
    games: 'CS2 (info reads), Poker (hole cards), Hearthstone (deck tracking), StarCraft (scouting)',
  },
  Mental: {
    what: 'Reading people, adapting on the fly, managing variance, long-term strategy, tilt control.',
    cheat: 'Seeing the future / perfect reads every time',
    games: 'Poker, Chess, Dota 2, League of Legends, Fighting Games (mind games)',
  },
};

type Averages = {
  exec: number;
  info: number;
  mental: number;
  voteCount: number;
};

export default function VoteSliders({
  slug,
  initialExec,
  initialInfo,
  initialMental,
  initialExecAvg,
  initialInfoAvg,
  initialMentalAvg,
  initialVoteCount,
}: {
  slug: string;
  initialExec: number;
  initialInfo: number;
  initialMental: number;
  initialExecAvg: number;
  initialInfoAvg: number;
  initialMentalAvg: number;
  initialVoteCount: number;
}) {
  const [exec, setExec] = useState(initialExec);
  const [info, setInfo] = useState(initialInfo);
  const [mental, setMental] = useState(initialMental);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [averages, setAverages] = useState<Averages>({
    exec: initialExecAvg,
    info: initialInfoAvg,
    mental: initialMentalAvg,
    voteCount: initialVoteCount,
  });

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, exec, info, mental }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Vote failed (${res.status})`);
      }
      if (data.game) {
        setAverages({
          exec: data.game.exec_avg,
          info: data.game.info_avg,
          mental: data.game.mental_avg,
          voteCount: data.game.vote_count,
        });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const empty = averages.voteCount === 0;

  return (
    <>
      {/* Community Averages */}
      <div className="mb-6 grunge-card p-6 lg:p-8">
        <div className="flex items-center justify-between mb-5 border-b border-stroke pb-3">
          <h2 className="font-[family-name:var(--font-dharma)] text-2xl font-normal uppercase tracking-wide text-ink">
            Community Averages
          </h2>
          <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-[family-name:var(--font-mono)] uppercase tracking-wider">
            {empty ? (
              <>
                <span className="h-1.5 w-1.5 bg-red animate-pulse" />
                No votes yet
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 bg-acid" />
                {averages.voteCount} vote{averages.voteCount === 1 ? '' : 's'}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <BigBar label="Execution" value={averages.exec} color={COLORS.exec} empty={empty} />
          <BigBar label="Information" value={averages.info} color={COLORS.info} empty={empty} />
          <BigBar label="Mental" value={averages.mental} color={COLORS.mental} empty={empty} />
        </div>
      </div>

      {/* Vote panel */}
      <div className="space-y-6 grunge-card p-6 lg:p-8">
        <div className="flex items-center justify-between border-b border-stroke pb-3">
          <div>
            <h3 className="font-[family-name:var(--font-dharma)] text-2xl font-normal uppercase tracking-wide text-ink">
              Rate this game
            </h3>
            <p className="text-xs text-ink-muted mt-1 font-[family-name:var(--font-mono)] uppercase tracking-wider">
              Drag sliders to assign scores from 0 to 100
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Slider label="Execution" value={exec} color={COLORS.exec} onChange={setExec} disabled={submitted} />
          <Slider label="Information" value={info} color={COLORS.info} onChange={setInfo} disabled={submitted} />
          <Slider label="Mental" value={mental} color={COLORS.mental} onChange={setMental} disabled={submitted} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || submitted}
          className={`relative w-full btn transition-all duration-300 overflow-hidden group disabled:cursor-not-allowed ${
            submitted ? 'border-acid text-acid' : saving ? 'border-red text-red' : 'btn-primary'
          }`}
        >
          <span className="relative flex items-center justify-center gap-2">
            {submitted ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Vote Submitted
              </>
            ) : saving ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" strokeLinecap="round"/>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Vote'
            )}
          </span>
        </button>

        {submitted ? (
          <div className="flex items-center gap-2 text-xs text-acid animate-fade-in font-[family-name:var(--font-mono)] uppercase tracking-wider">
            <span className="h-1 w-1 bg-acid animate-pulse" />
            Averages updated above
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center gap-2 text-xs text-red animate-fade-in font-[family-name:var(--font-mono)] uppercase tracking-wider">
            <span className="h-1 w-1 bg-red animate-pulse" />
            {error}
          </div>
        ) : null}
      </div>
    </>
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
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}60` }} />
          <span className="text-sm font-semibold text-ink font-[family-name:var(--font-body)]">{label}</span>
        </div>
        <span className={`tabular-nums text-2xl font-bold font-[family-name:var(--font-dharma)] ${empty ? 'text-ink-muted' : 'text-ink'}`}>
          {empty ? '—' : Math.round(value)}
        </span>
      </div>
      <div className="bar-track w-full">
        <div
          className="bar-fill"
          style={{
            width: `${value}%`,
            backgroundColor: color,
            opacity: empty ? 0.12 : 1,
            boxShadow: empty ? 'none' : `0 0 16px ${color}40, 0 0 32px ${color}20`,
          }}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  color,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const details = AXIS_DETAILS[label as keyof typeof AXIS_DETAILS];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}60` }}
          />
          <span className="text-sm font-semibold text-ink font-[family-name:var(--font-body)]">{label}</span>
        </div>
        <span
          className="tabular-nums text-lg font-bold font-[family-name:var(--font-dharma)]"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <div className="relative">
        <input
          aria-label={label}
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          style={{
            accentColor: color,
            background: `linear-gradient(to right, ${color}40 0%, ${color}40 ${value}%, rgba(242,242,242,0.05) ${value}%, rgba(242,242,242,0.05) 100%)`,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
      <div className="mt-3 border border-stroke bg-bg-raised p-3 text-xs leading-relaxed text-ink-dim">
        <p className="mb-1.5">
          <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">What it tests:</span> {details.what}
        </p>
        <p className="mb-1.5">
          <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">Cheat test:</span> {details.cheat}
        </p>
        <p>
          <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">High-score examples:</span> {details.games}
        </p>
      </div>
    </div>
  );
}
