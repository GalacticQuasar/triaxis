'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Game } from '@/lib/db';
import { nearestNeighbors, meanVector, type AxisWeights, type TargetVector } from '@/lib/similarity';
import GameCard from '@/components/GameCard';
import TargetVectorViz from '@/components/TargetVectorViz';
import { Search, X, Target, Plus, Check, Info } from 'lucide-react';

const COLORS = {
  exec: '#d5ff00',
  info: '#00f0ff',
  mental: '#ff2a00',
};

type Mode = 'pick' | 'manual';

const STORAGE_KEY = 'triaxis.discover';

const DEFAULT_MANUAL: TargetVector = { exec_avg: 50, info_avg: 50, mental_avg: 50 };
const DEFAULT_WEIGHTS: AxisWeights = { exec: 1, info: 1, mental: 1 };

type PersistedState = {
  mode: Mode;
  pickIds: number[];
  manual: TargetVector;
  weights: AxisWeights;
};

function loadState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      mode: parsed.mode === 'manual' ? 'manual' : 'pick',
      pickIds: Array.isArray(parsed.pickIds) ? parsed.pickIds : [],
      manual: parsed.manual ?? DEFAULT_MANUAL,
      weights: parsed.weights ?? DEFAULT_WEIGHTS,
    };
  } catch {
    return null;
  }
}

export default function DiscoverClient({ games }: { games: Game[] }) {
  const [emphasisHelpOpen, setEmphasisHelpOpen] = useState(false);
  // Lazy initializers read from localStorage synchronously on the client during
  // the first render, so no effect-based setState is needed (avoids the
  // react-hooks/set-state-in-effect cascading-render concern). SSR returns
  // defaults since localStorage isn't available server-side.
  const [mode, setMode] = useState<Mode>(() => loadState()?.mode ?? 'pick');
  const [pickIds, setPickIds] = useState<number[]>(() => loadState()?.pickIds ?? []);
  const [manual, setManual] = useState<TargetVector>(() => loadState()?.manual ?? DEFAULT_MANUAL);
  const [weights, setWeights] = useState<AxisWeights>(() => loadState()?.weights ?? DEFAULT_WEIGHTS);
  const [search, setSearch] = useState('');

  // Persist whenever any control changes.
  useEffect(() => {
    const state: PersistedState = { mode, pickIds, manual, weights };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota/availability errors
    }
  }, [mode, pickIds, manual, weights]);

  const pickGames = useMemo(
    () => pickIds.map((id) => games.find((g) => g.id === id)).filter((g): g is Game => Boolean(g)),
    [pickIds, games],
  );

  const target = useMemo<TargetVector | null>(() => {
    if (mode === 'pick') return meanVector(pickGames);
    return manual;
  }, [mode, pickGames, manual]);

  const filteredSearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.genre_tag?.toLowerCase().includes(q) ?? false),
    );
  }, [search, games]);

  const excludeIds = useMemo(() => new Set(pickIds), [pickIds]);

  const results = useMemo(() => {
    if (!target) return [];
    const seed = { id: -1, ...target };
    return nearestNeighbors(seed, games, 12, weights, excludeIds);
  }, [target, games, weights, excludeIds]);

  function togglePick(id: number) {
    setPickIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function clearPicks() {
    setPickIds([]);
  }

  const hasTarget = mode === 'pick' ? pickGames.length > 0 : true;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 animate-fade-in">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <Link href="/" className="glitch-link text-xs text-ink-muted group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" className="transition-transform group-hover:-translate-x-0.5 inline mr-1">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to catalog
          </Link>
          <h1 className="mt-4 font-[family-name:var(--font-dharma)] text-5xl font-normal uppercase tracking-wide text-ink">
            Discover
          </h1>
          <p className="mt-1 text-xs text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
            Find games positioned near your taste across Execution, Info, and Mental.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="relative flex items-center gap-1 border border-stroke bg-panel p-1 w-fit shrink-0">
          <ModeButton active={mode === 'pick'} onClick={() => setMode('pick')} label="Pick" />
          <ModeButton active={mode === 'manual'} onClick={() => setMode('manual')} label="Manual" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Left: input panel */}
        <div className="grunge-card p-5">
          {mode === 'pick' ? (
            <PickPanel
              games={games}
              filteredSearch={filteredSearch}
              search={search}
              setSearch={setSearch}
              pickIds={pickIds}
              togglePick={togglePick}
              clearPicks={clearPicks}
            />
          ) : (
            <ManualPanel manual={manual} setManual={setManual} />
          )}

          {/* Per-axis weights */}
          <div className="mt-5 border-t border-stroke pt-4">
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)] font-semibold">
                Axis Emphasis
              </span>
              <button
                type="button"
                onClick={() => setEmphasisHelpOpen(true)}
                aria-label="How axis emphasis works"
                className="text-ink-muted hover:text-acid transition-colors"
              >
                <Info size={12} />
              </button>
              <button
                type="button"
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="ml-auto text-[10px] uppercase tracking-wider text-ink-muted hover:text-red font-[family-name:var(--font-mono)] transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="space-y-3">
              <WeightRow label="Execution" color={COLORS.exec} value={weights.exec} onChange={(v) => setWeights((w) => ({ ...w, exec: v }))} />
              <WeightRow label="Information" color={COLORS.info} value={weights.info} onChange={(v) => setWeights((w) => ({ ...w, info: v }))} />
              <WeightRow label="Mental" color={COLORS.mental} value={weights.mental} onChange={(v) => setWeights((w) => ({ ...w, mental: v }))} />
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div>
          {mode === 'pick' && <TargetVectorViz target={target} pickGames={pickGames} mode={mode} />}

          <div className="mb-5 flex items-center justify-between border-b border-stroke pb-3">
            <h2 className="font-[family-name:var(--font-dharma)] text-3xl font-normal uppercase tracking-wide text-ink">
              Matches
            </h2>
            <span className="text-[10px] text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
              {hasTarget && target ? `${results.length} results` : 'No target set'}
            </span>
          </div>

          {!hasTarget || !target ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-stroke bg-panel/40 py-20 text-center">
              <Target size={28} className="text-ink-muted mb-3" />
              <p className="text-xs text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
                {mode === 'pick' ? 'Pick games to find neighbors' : 'Set your target'}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="border border-dashed border-stroke bg-panel/40 py-16 text-center text-xs text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
              No matches. Try adjusting weights or selecting different games.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {results.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {emphasisHelpOpen ? (
        <EmphasisHelpModal onClose={() => setEmphasisHelpOpen(false)} />
      ) : null}
    </div>
  );
}

function EmphasisHelpModal({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  const FADE_MS = 250;

  function dismiss() {
    if (closing) return;
    setClosing(true);
  }

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(onClose, FADE_MS);
    return () => clearTimeout(t);
  }, [closing, onClose]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-12 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="absolute inset-0 bg-bg/90" onClick={dismiss} />

      <div className="relative w-full max-w-2xl border border-stroke bg-panel p-6 sm:p-8 shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
        <div className="mb-6 flex items-start justify-between border-b border-stroke pb-3">
          <div>
            <h2 className="font-[family-name:var(--font-dharma)] text-3xl font-normal uppercase tracking-wide text-ink">
              How Axis Emphasis Works
            </h2>
            <p className="mt-1 text-sm text-ink-dim font-[family-name:var(--font-mono)] uppercase tracking-wider">
              Bend the metric toward what you care about.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="btn p-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 text-sm text-ink-dim leading-relaxed">
          <p>
            Every game sits in 3D space at <span className="text-ink font-semibold">(Execution, Information, Mental)</span>.
            By default, matches are ranked by raw distance from your target — all three axes count equally.
            Emphasis lets you tell the search which axes matter most <em className="text-ink not-italic">to you</em>.
          </p>

          <div className="border border-stroke bg-bg-raised p-4 notch-left space-y-2">
            <p className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">How the math changes</p>
            <p>
              Distance is{' '}
              <span className="font-[family-name:var(--font-mono)] text-ink">
                √((ΔExec·w<sub>exec</sub>)² + (ΔInfo·w<sub>info</sub>)² + (ΔMental·w<sub>mental</sub>)²)
              </span>
              . Doubling an axis&apos;s weight <span className="text-ink">doubles how much a gap on it counts</span> toward distance,
              so a 10-point gap on Mental at 2× weighs the same as a 20-point gap on Execution at 1×.
            </p>
          </div>

          <div className="border border-stroke bg-bg-raised p-4 notch-left space-y-2">
            <p className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">In practice</p>
            <p>
              Say your target is a high-info puzzle game like{' '}
              <span className="text-info" style={{ color: '#00f0ff' }}>Tetris</span>. With equal weights you get a mix of
              nearby games — some close because they share Tetris&apos;s info demands, others close only because they happen
              to score similarly on Execution or Mental. Push the{' '}
              <span style={{ color: '#00f0ff' }}>Information</span> weight up and the others down, and results tilt toward
              games that match what you actually liked about the seed: the information-management character, not just
              the overall location.
            </p>
          </div>

          <div className="border border-stroke bg-bg-raised p-4 notch-left space-y-2">
            <p className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">Reading the slider</p>
            <ul className="space-y-1.5">
              <li><span className="font-[family-name:var(--font-mono)] text-ink">1.0×</span> — default, axis counts normally.</li>
              <li><span className="font-[family-name:var(--font-mono)] text-ink">2.0×</span> — axis matters twice as much. Gap here pushes games down the rankings faster.</li>
              <li><span className="font-[family-name:var(--font-mono)] text-ink">0.0×</span> — axis ignored entirely. Matches ranked purely by the other two.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active ? 'bg-acid text-bg' : 'text-ink-dim hover:text-acid'
      }`}
    >
      {label}
    </button>
  );
}

function WeightRow({ label, color, value, onChange }: { label: string; color: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="flex items-center gap-1.5 font-semibold text-ink-dim font-[family-name:var(--font-body)]">
          <span className="h-1.5 w-1.5" style={{ backgroundColor: color }} />
          {label}
        </span>
        <span className="tabular-nums text-ink-muted font-[family-name:var(--font-mono)]">
          {value.toFixed(1)}×
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ accentColor: color }}
      />
    </div>
  );
}

function PickPanel({
  games,
  filteredSearch,
  search,
  setSearch,
  pickIds,
  togglePick,
  clearPicks,
}: {
  games: Game[];
  filteredSearch: Game[];
  search: string;
  setSearch: (v: string) => void;
  pickIds: number[];
  togglePick: (id: number) => void;
  clearPicks: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)] font-semibold">
          Select Games You Like
        </span>
        {pickIds.length > 0 ? (
          <button
            type="button"
            onClick={clearPicks}
            className="text-[10px] uppercase tracking-wider text-ink-muted hover:text-red font-[family-name:var(--font-mono)] transition-colors"
          >
            Clear ({pickIds.length})
          </button>
        ) : null}
      </div>

      {/* Selected chips */}
      {pickIds.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {pickIds.map((id) => {
            const g = games.find((x) => x.id === id);
            if (!g) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => togglePick(id)}
                className="flex items-center gap-1.5 border border-acid bg-acid/10 px-2 py-1 text-[10px] uppercase tracking-wider text-ink font-[family-name:var(--font-mono)] hover:bg-acid/20 transition-colors"
              >
                {g.name}
                <X size={10} />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative mb-3">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search games"
          className="w-full bg-bg-raised border border-stroke pl-7 pr-8 py-1.5 text-xs text-ink placeholder:text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider focus:border-acid transition-[border-color] duration-200"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-acid transition-colors"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>

      <div className="max-h-72 overflow-y-auto border border-stroke bg-bg-raised">
        {filteredSearch.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
            No matches
          </div>
        ) : (
          filteredSearch.map((g) => {
            const selected = pickIds.includes(g.id);
            const nameSum = g.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const hue1 = (nameSum * 137.5) % 360;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => togglePick(g.id)}
                className={`group flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                  selected ? 'bg-acid/10 border-l-2 border-l-acid' : 'hover:bg-bg/60 border-l-2 border-l-transparent'
                }`}
              >
                <span
                  className="h-6 w-6 shrink-0 border border-stroke flex items-center justify-center text-[9px] font-bold text-ink font-[family-name:var(--font-dharma)] tracking-wider"
                  style={{ background: `linear-gradient(135deg, hsl(${hue1} 70% 35%), hsl(${(hue1 + 40) % 360} 60% 25%))` }}
                >
                  {g.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-[11px] font-semibold text-ink group-hover:text-acid font-[family-name:var(--font-body)]">
                  {g.name}
                </span>
                {g.vote_count > 0 ? (
                  <span className="text-[9px] tabular-nums text-ink-muted font-[family-name:var(--font-mono)]">
                    {g.vote_count}
                  </span>
                ) : null}
                {selected ? (
                  <Check size={12} className="text-acid shrink-0" />
                ) : (
                  <Plus size={12} className="text-ink-muted opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ManualPanel({
  manual,
  setManual,
}: {
  manual: TargetVector;
  setManual: (v: TargetVector) => void;
}) {
  const axes: { key: keyof TargetVector; label: string; color: string; short: string }[] = [
    { key: 'exec_avg', label: 'Execution', color: COLORS.exec, short: 'Exec' },
    { key: 'info_avg', label: 'Information', color: COLORS.info, short: 'Info' },
    { key: 'mental_avg', label: 'Mental', color: COLORS.mental, short: 'Mind' },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)] font-semibold">
          Set Target Manually
        </span>
        <button
          type="button"
          onClick={() => setManual(DEFAULT_MANUAL)}
          className="text-[10px] uppercase tracking-wider text-ink-muted hover:text-red font-[family-name:var(--font-mono)] transition-colors"
        >
          Reset
        </button>
      </div>
      <p className="mb-4 text-[11px] text-ink-muted font-[family-name:var(--font-mono)] leading-relaxed">
        Drag each axis to the score you want. We&apos;ll find games near this point.
      </p>
      <div className="space-y-5">
        {axes.map((ax) => (
          <div key={ax.key}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-ink font-[family-name:var(--font-body)]">
                <span className="h-1.5 w-1.5" style={{ backgroundColor: ax.color }} />
                {ax.label}
              </span>
              <span className="tabular-nums text-sm font-[family-name:var(--font-dharma)]" style={{ color: ax.color }}>
                {Math.round(manual[ax.key])}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={manual[ax.key]}
              onChange={(e) => setManual({ ...manual, [ax.key]: parseInt(e.target.value, 10) })}
              style={{ accentColor: ax.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}