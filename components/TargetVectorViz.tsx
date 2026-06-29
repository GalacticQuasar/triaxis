'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '@/lib/db';
import type { TargetVector } from '@/lib/similarity';
import { Target } from 'lucide-react';

const COLORS = {
  exec: '#d5ff00',
  info: '#00f0ff',
  mental: '#ff2a00',
};

type AxisKey = 'exec_avg' | 'info_avg' | 'mental_avg';

const AXES: { key: AxisKey; label: string; short: string; color: string }[] = [
  { key: 'exec_avg', label: 'Execution', short: 'Exec', color: COLORS.exec },
  { key: 'info_avg', label: 'Information', short: 'Info', color: COLORS.info },
  { key: 'mental_avg', label: 'Mental', short: 'Mind', color: COLORS.mental },
];

function gameHue(name: string): number {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (sum * 137.5) % 360;
}

const POP_OUT_MS = 200;

export default function TargetVectorViz({
  target,
  pickGames,
  mode,
}: {
  target: TargetVector | null;
  pickGames: Game[];
  mode: 'pick' | 'manual';
}) {
  const showDots = mode === 'pick' && pickGames.length > 0;

  return (
    <div className="grunge-card p-5 mb-6">
      <div className="mb-4 flex items-center justify-between border-b border-stroke pb-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-acid" />
          <h2 className="font-[family-name:var(--font-dharma)] text-2xl font-normal uppercase tracking-wide text-ink">
            Target Vector
          </h2>
          <span className="tag ml-2">{mode === 'pick' ? 'Pick' : 'Manual'}</span>
        </div>
        <span className="text-[10px] text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-widest">
          {showDots ? `${pickGames.length} seed${pickGames.length === 1 ? '' : 's'}` : 'Direct input'}
        </span>
      </div>

      {!target ? (
        <div className="py-6 text-center">
          <p className="text-xs text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
            {mode === 'pick' ? 'Select at least one game to build a target' : 'Set your target'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {AXES.map((ax) => (
            <AxisRow
              key={ax.key}
              axis={ax}
              avg={target[ax.key]}
              games={showDots ? pickGames : []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type DotItem = { id: number; name: string; value: number; hue: number };

function usePresence(items: DotItem[]) {
  const [rendered, setRendered] = useState(items);
  const [exiting, setExiting] = useState<DotItem[]>([]);
  const prevRef = useRef(items);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const prev = prevRef.current;
    const nextMap = new Map(items.map((it) => [it.id, it]));
    const prevMap = new Map(prev.map((it) => [it.id, it]));

    const kept = prev.filter((it) => nextMap.has(it.id));
    const added = items.filter((it) => !prevMap.has(it.id));

    const stillKeptIds = new Set(kept.map((it) => it.id));
    const removed = prev.filter((it) => !stillKeptIds.has(it.id));

    if (removed.length === 0 && added.length === 0) {
      setRendered(items);
      prevRef.current = items;
      return;
    }

    setRendered([...kept, ...added]);
    setExiting((cur) => [...cur, ...removed]);

    removed.forEach((it) => {
      const existing = timers.current.get(it.id);
      if (existing) clearTimeout(existing);
      timers.current.set(
        it.id,
        setTimeout(() => {
          setExiting((cur) => cur.filter((e) => e.id !== it.id));
          timers.current.delete(it.id);
        }, POP_OUT_MS),
      );
    });

    prevRef.current = items;
  }, [items]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return { rendered, exiting };
}

function AxisRow({
  axis,
  avg,
  games,
}: {
  axis: { key: AxisKey; label: string; short: string; color: string };
  avg: number;
  games: Game[];
}) {
  const items = useMemo<DotItem[]>(
    () =>
      games.map((g) => ({
        id: g.id,
        name: g.name,
        value: g[axis.key],
        hue: gameHue(g.name),
      })),
    [games, axis.key],
  );

  const { rendered, exiting } = usePresence(items);

  // Smoothly transition the target avg marker position.
  const avgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!avgRef.current) return;
    avgRef.current.style.left = `${Math.max(0, Math.min(100, avg))}%`;
  }, [avg]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-dim font-[family-name:var(--font-body)] uppercase tracking-wider">
          <span className="h-1.5 w-1.5" style={{ backgroundColor: axis.color }} />
          {axis.label}
        </span>
        <span
          className="tabular-nums text-base font-bold font-[family-name:var(--font-dharma)] leading-none transition-colors duration-300"
          style={{ color: axis.color }}
        >
          {Math.round(avg)}
        </span>
      </div>

      <div className="relative h-16">
        {/* track */}
        <div className="absolute inset-x-0 top-3 h-2 bg-bg-raised border border-stroke">
          {/* tick marks */}
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {[0, 25, 50, 75, 100].map((t) => (
              <span
                key={t}
                className="w-px bg-stroke-light/60"
                style={{ height: t % 50 === 0 ? '100%' : '50%', alignSelf: 'center' }}
              />
            ))}
          </div>
        </div>

        {/* game dots — entering (rendered) + exiting */}
        {rendered.map((d) => (
          <Dot key={d.id} item={d} state="in" />
        ))}
        {exiting.map((d) => (
          <Dot key={`out-${d.id}`} item={d} state="out" />
        ))}

        {/* target avg marker — position transitions via ref */}
        <div
          ref={avgRef}
          className="absolute top-0 bottom-0 -translate-x-1/2 z-20 flex items-center pointer-events-none"
          style={{ left: `${Math.max(0, Math.min(100, avg))}%`, top: '3px', height: '16px', transition: 'left 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <div className="relative flex flex-col items-center">
            <span
              className="block w-0.5 h-7"
              style={{
                backgroundColor: axis.color,
                boxShadow: `0 0 8px ${axis.color}`,
              }}
            />
            <span
              className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full h-1.5 w-1.5 rotate-45"
              style={{ backgroundColor: axis.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({
  item,
  state,
}: {
  item: DotItem;
  state: 'in' | 'out';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = Math.max(0, Math.min(100, item.value));

  // Animate horizontal position via transition (so an existing dot whose
  // value changes slides smoothly — e.g. when the same game stays selected
  // across axis rows, or in future when its score updates).
  useEffect(() => {
    if (ref.current) {
      ref.current.style.left = `${pos}%`;
    }
  }, [pos]);

  return (
    <div
      ref={ref}
      title={`${item.name}: ${Math.round(item.value)}`}
      className={`absolute top-3 -translate-x-1/2 z-10 flex flex-col items-center ${state === 'in' ? 'animate-pop-in' : 'animate-pop-out'}`}
      style={{
        left: `${pos}%`,
        transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span
        className="block h-3 w-3 border border-bg"
        style={{
          background: `hsl(${item.hue} 70% 45%)`,
          boxShadow: `0 0 6px hsl(${item.hue} 70% 45%)`,
        }}
      />
      <span
        className={`mt-1 max-w-[80px] truncate text-[8px] uppercase tracking-wider font-[family-name:var(--font-mono)] ${state === 'in' ? 'animate-fade-in' : 'animate-fade-out'}`}
        style={{ color: `hsl(${item.hue} 70% 65%)` }}
      >
        {item.name}
      </span>
    </div>
  );
}