'use client';

import { useState, useCallback } from 'react';
import HeroCube from './HeroCube';
import GlitchText from './GlitchText';
import type { Game, Vote } from '@/lib/db';

export default function HeroCubeWithLabel({
  games,
  votesByGameId,
}: {
  games: Game[];
  votesByGameId: Record<number, Vote[]>;
}) {
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  const handleActiveGameChange = useCallback((game: Game | null) => {
    setActiveGame(game);
  }, []);

  return (
    <div className="relative h-full w-full">
      <HeroCube
        games={games}
        votesByGameId={votesByGameId}
        onActiveGameChange={handleActiveGameChange}
      />
      <div className="pointer-events-none absolute bottom-2 right-2 text-right">
        {activeGame ? (
          <div
            key={activeGame.id}
            className="animate-fade-in"
          >
            <GlitchText
              text={activeGame.name.toUpperCase()}
              className="font-[family-name:var(--font-dharma)] text-2xl sm:text-3xl text-acid leading-none block"
            />
            <div className="mt-1 text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-ink-dim">
              {activeGame.vote_count} vote{activeGame.vote_count === 1 ? '' : 's'}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}