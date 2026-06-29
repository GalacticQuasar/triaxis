import Link from 'next/link';
import type { Neighbor } from '@/lib/similarity';

const COLORS = {
  exec: '#d5ff00',
  info: '#00f0ff',
  mental: '#ff2a00',
};

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="bar-track h-1.5 flex-1">
      <div
        className="bar-fill"
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}30` }}
      />
    </div>
  );
}

// Compact row used in the /game/[slug] "Similar games" cluster and the
// /cube stats card "Similar games" list. Distance is shown numerically so a
// visitor can read how far the neighbor is in 3-axis space.
export default function SimilarGameRow({
  neighbor,
  index = 0,
}: {
  neighbor: Neighbor;
  index?: number;
}) {
  const { distance, ...game } = neighbor;

  const nameSum = game.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = (nameSum * 137.5) % 360;
  const hue2 = (hue1 + 40) % 360;

  return (
    <Link
      href={`/game/${game.slug}`}
      className="group block relative border border-stroke bg-bg-raised p-3 transition-colors hover:border-acid opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-stroke overflow-hidden"
          style={{ background: `linear-gradient(135deg, hsl(${hue1} 70% 35%), hsl(${hue2} 60% 25%))` }}
        >
          <span className="relative text-[10px] font-bold text-ink font-[family-name:var(--font-dharma)] tracking-wider">
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs font-semibold text-ink group-hover:text-acid transition-colors font-[family-name:var(--font-body)]">
            {game.name}
          </h4>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-8 text-[9px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)]">Exec</span>
            <MiniBar value={game.exec_avg} color={COLORS.exec} />
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-8 text-[9px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)]">Info</span>
            <MiniBar value={game.info_avg} color={COLORS.info} />
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-8 text-[9px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)]">Mind</span>
            <MiniBar value={game.mental_avg} color={COLORS.mental} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] uppercase tracking-widest text-ink-muted font-[family-name:var(--font-mono)]">Δ</div>
          <div className="text-xs tabular-nums text-ink-dim font-[family-name:var(--font-mono)]">
            {distance.toFixed(1)}
          </div>
        </div>
      </div>
    </Link>
  );
}