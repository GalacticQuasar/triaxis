'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Game, Vote } from '@/lib/db';
import { ArrowUpRight, Sigma, TrendingUp, Activity } from 'lucide-react';

const COLORS = {
  exec: '#d5ff00',
  info: '#00f0ff',
  mental: '#ff2a00',
};

const METRICS = [
  { key: 'exec_score' as const, label: 'Execution', short: 'Exec', color: COLORS.exec },
  { key: 'info_score' as const, label: 'Info', short: 'Info', color: COLORS.info },
  { key: 'mental_score' as const, label: 'Mental', short: 'Mind', color: COLORS.mental },
];

type MetricScores = {
  values: number[];
  mean: number;
  stdDev: number;
  min: number;
  max: number;
};

function calculateStats(values: number[]): MetricScores | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return {
    values,
    mean,
    stdDev: Math.sqrt(variance),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function percentileRank(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 0;
  const below = allValues.filter((v) => v < value).length;
  const equal = allValues.filter((v) => v === value).length;
  return (below + equal / 2) / allValues.length;
}

function MetricStripPlot({
  stats,
  color,
  label,
  short,
  gameAvg,
}: {
  stats: MetricScores;
  color: string;
  label: string;
  short: string;
  gameAvg: number;
}) {
  const width = 240;
  const height = 32;
  const padding = 8;
  const trackY = height / 2;

  const dots = useMemo(() => {
    return stats.values.map((value, i) => ({
      x: padding + (value / 100) * (width - padding * 2),
      y: height / 2 + (Math.sin(i * 12.5 + value) * 4),
      value,
    }));
  }, [stats.values]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-ink font-[family-name:var(--font-body)]">
          <span className="h-1.5 w-1.5" style={{ backgroundColor: color }} />
          {label}
        </span>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted tabular-nums font-[family-name:var(--font-mono)] uppercase tracking-wider">
          <span title="Average">
            μ {Math.round(stats.mean)}
          </span>
          <span title="Standard deviation">
            σ {stats.stdDev.toFixed(1)}
          </span>
          <span title="Range">
            {Math.round(stats.min)}–{Math.round(stats.max)}
          </span>
        </div>
      </div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        preserveAspectRatio="none"
      >
        <line
          x1={padding}
          y1={trackY}
          x2={width - padding}
          y2={trackY}
          stroke="rgba(242,242,242,0.08)"
          strokeWidth={2}
          strokeLinecap="square"
        />

        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={2.5}
            fill={color}
            opacity={0.6}
          />
        ))}

        <line
          x1={padding + (gameAvg / 100) * (width - padding * 2)}
          y1={4}
          x2={padding + (gameAvg / 100) * (width - padding * 2)}
          y2={height - 4}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="3 2"
        />
        <circle
          cx={padding + (gameAvg / 100) * (width - padding * 2)}
          cy={trackY}
          r={3.5}
          fill="#f2f2f2"
          stroke={color}
          strokeWidth={2}
        />
      </svg>

      <div className="flex justify-between text-[10px] text-ink-muted tabular-nums font-[family-name:var(--font-mono)] uppercase tracking-wider">
        <span>0</span>
        <span className="text-ink-dim">
          avg {Math.round(gameAvg)} {short}
        </span>
        <span>100</span>
      </div>
    </div>
  );
}

function RankBadge({
  label,
  percentile,
  color,
}: {
  label: string;
  percentile: number;
  color: string;
}) {
  const pct = Math.round(percentile * 100);
  return (
    <div
      className="flex flex-col border bg-bg-raised px-2.5 py-2"
      style={{ borderColor: color, borderWidth: 1 }}
    >
      <span className="text-[10px] uppercase tracking-wider text-ink-muted font-[family-name:var(--font-mono)]">{label}</span>
      <span className="font-[family-name:var(--font-dharma)] text-xl font-normal tabular-nums" style={{ color }}>
        Top {pct}%
      </span>
    </div>
  );
}

export default function CubeStatsCard({
  game,
  votes,
  allGames,
}: {
  game: Game;
  votes: Vote[];
  allGames: Game[];
}) {
  const router = useRouter();

  const execStats = useMemo(
    () => calculateStats(votes.map((v) => v.exec_score)),
    [votes]
  );
  const infoStats = useMemo(
    () => calculateStats(votes.map((v) => v.info_score)),
    [votes]
  );
  const mentalStats = useMemo(
    () => calculateStats(votes.map((v) => v.mental_score)),
    [votes]
  );

  const ranks = useMemo(() => {
    const execAvgs = allGames.map((g) => g.exec_avg);
    const infoAvgs = allGames.map((g) => g.info_avg);
    const mentalAvgs = allGames.map((g) => g.mental_avg);

    return {
      exec: percentileRank(game.exec_avg, execAvgs),
      info: percentileRank(game.info_avg, infoAvgs),
      mental: percentileRank(game.mental_avg, mentalAvgs),
    };
  }, [game, allGames]);

  const dominantAxis = useMemo(() => {
    const scores = [
      { key: 'exec', value: game.exec_avg, color: COLORS.exec, label: 'Execution' },
      { key: 'info', value: game.info_avg, color: COLORS.info, label: 'Info' },
      { key: 'mental', value: game.mental_avg, color: COLORS.mental, label: 'Mental' },
    ];
    return scores.reduce((max, s) => (s.value > max.value ? s : max), scores[0]);
  }, [game]);

  const isControversial = useMemo(() => {
    const stats = [execStats, infoStats, mentalStats].filter(Boolean) as MetricScores[];
    if (stats.length === 0) return false;
    const avgStdDev = stats.reduce((sum, s) => sum + s.stdDev, 0) / stats.length;
    return avgStdDev > 18;
  }, [execStats, infoStats, mentalStats]);

  const statRows = [
    { stats: execStats, ...METRICS[0], gameAvg: game.exec_avg, rank: ranks.exec },
    { stats: infoStats, ...METRICS[1], gameAvg: game.info_avg, rank: ranks.info },
    { stats: mentalStats, ...METRICS[2], gameAvg: game.mental_avg, rank: ranks.mental },
  ];

  return (
    <div className="absolute right-4 top-4 max-h-[calc(100vh-120px)] w-80 select-none overflow-y-auto border border-stroke bg-bg/95 px-4 py-4 text-sm animate-fade-in z-20">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-stroke pb-3">
        <div className="select-text">
          <h2 className="font-[family-name:var(--font-dharma)] text-2xl font-normal leading-none text-ink">
            {game.name}
          </h2>
          {game.genre_tag ? (
            <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-muted font-[family-name:var(--font-mono)]">
              {game.genre_tag}
            </p>
          ) : null}
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-stroke font-[family-name:var(--font-dharma)] text-xs font-normal tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${dominantAxis.color}20, transparent)`,
            color: dominantAxis.color,
          }}
        >
          {game.name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="tag">
          <Sigma size={11} />
          {votes.length} vote{votes.length === 1 ? '' : 's'}
        </span>
        <span
          className="tag"
          style={{ color: dominantAxis.color, borderColor: dominantAxis.color }}
        >
          <TrendingUp size={11} />
          Strongest in {dominantAxis.label}
        </span>
        {isControversial ? (
          <span className="tag" style={{ color: COLORS.mental, borderColor: COLORS.mental }}>
            <Activity size={11} />
            Divisive
          </span>
        ) : null}
      </div>

      <div className="mb-5 space-y-4">
        {statRows.map((row) =>
          row.stats ? (
            <MetricStripPlot
              key={row.key}
              stats={row.stats}
              color={row.color}
              label={row.label}
              short={row.short}
              gameAvg={row.gameAvg}
            />
          ) : null
        )}
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <RankBadge label="Exec" percentile={ranks.exec} color={COLORS.exec} />
        <RankBadge label="Info" percentile={ranks.info} color={COLORS.info} />
        <RankBadge label="Mental" percentile={ranks.mental} color={COLORS.mental} />
      </div>

      <button
        onClick={() => router.push(`/game/${game.slug}`)}
        className="group flex w-full cursor-pointer items-center justify-center gap-1.5 btn btn-primary"
      >
        Open game page
        <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
