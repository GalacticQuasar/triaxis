'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Game, Vote } from '@/lib/db';
import {
  avgToPosition,
  gameColor,
  VoteCluster,
} from './cube-viz';

const SIZE = 5;
const CYCLE_INTERVAL_MS = 2200;
const VOTE_DOT_RADIUS = 0.06;
const GRID_COLOR = '#262626';
const ACID = '#d5ff00';
const DIM_GRAY = new THREE.Color(0x7a7a7a);

function CubeFrame() {
  const corners = useMemo(() => {
    const s = SIZE / 2;
    return [
      new THREE.Vector3(-s, -s, -s),
      new THREE.Vector3(s, -s, -s),
      new THREE.Vector3(s, s, -s),
      new THREE.Vector3(-s, s, -s),
      new THREE.Vector3(-s, -s, s),
      new THREE.Vector3(s, -s, s),
      new THREE.Vector3(s, s, s),
      new THREE.Vector3(-s, s, s),
    ];
  }, []);

  // Corner 6 = (+,+,+), the positive-in-all-axes corner. Edges that touch it
  // fade from acid at that corner to gray at the other end; all other edges
  // are solid gray.
  const POSITIVE_CORNER = 6;

  const edges = useMemo(() => {
    const list: {
      points: [THREE.Vector3, THREE.Vector3];
      vertexColors: [THREE.Color, THREE.Color];
    }[] = [
      [corners[0], corners[1]],
      [corners[1], corners[2]],
      [corners[2], corners[3]],
      [corners[3], corners[0]],
      [corners[4], corners[5]],
      [corners[5], corners[6]],
      [corners[6], corners[7]],
      [corners[7], corners[4]],
      [corners[0], corners[4]],
      [corners[1], corners[5]],
      [corners[2], corners[6]],
      [corners[3], corners[7]],
    ].map(([a, b]) => {
      const aTouchesPositive = corners.indexOf(a) === POSITIVE_CORNER;
      const bTouchesPositive = corners.indexOf(b) === POSITIVE_CORNER;
      const gray = new THREE.Color(GRID_COLOR);
      const acid = new THREE.Color(ACID);
      return {
        points: [a, b] as [THREE.Vector3, THREE.Vector3],
        vertexColors: [
          aTouchesPositive ? acid : gray,
          bTouchesPositive ? acid : gray,
        ] as [THREE.Color, THREE.Color],
      };
    });
    return list;
  }, [corners]);

  return (
    <group>
      {edges.map((e, i) => (
        <Line
          key={i}
          points={e.points}
          vertexColors={e.vertexColors}
          lineWidth={1.5}
        />
      ))}
    </group>
  );
}

function GameDots({ games, activeGameId }: { games: Game[]; activeGameId: number | null }) {
  const dots = useMemo(
    () =>
      games
        .filter((g) => g.vote_count > 0)
        .map((g) => ({
          id: g.id,
          position: avgToPosition(g, SIZE).toArray() as [number, number, number],
          color: gameColor(g),
          isActive: activeGameId === g.id,
        })),
    [games, activeGameId]
  );

  return (
    <group>
      {dots.map((d) => (
        <mesh key={d.id} position={d.position}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color={d.isActive ? d.color : DIM_GRAY}
            emissive={d.isActive ? d.color : DIM_GRAY}
            emissiveIntensity={d.isActive ? 0.7 : 0.25}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function RotatingScene({
  games,
  votesByGameId,
  onActiveGameChange,
}: {
  games: Game[];
  votesByGameId: Record<number, Vote[]>;
  onActiveGameChange?: (game: Game | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const topGames = useMemo(
    () =>
      [...games]
        .filter((g) => g.vote_count > 0)
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 10),
    [games]
  );

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [exitingGameId, setExitingGameId] = useState<number | null>(null);

  useEffect(() => {
    if (topGames.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        setExitingGameId(topGames[prev].id);
        return (prev + 1) % topGames.length;
      });
    }, CYCLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [topGames]);

  const activeGame = topGames[activeIndex] ?? null;

  useEffect(() => {
    onActiveGameChange?.(activeGame);
  }, [activeGame, onActiveGameChange]);

  const exitingGame = exitingGameId
    ? topGames.find((g) => g.id === exitingGameId) ?? null
    : null;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <CubeFrame />
      <GameDots games={games} activeGameId={activeGame?.id ?? null} />
      {activeGame ? (
        <VoteCluster
          key={`active-${activeGame.id}-${activeIndex}`}
          game={activeGame}
          votes={votesByGameId[activeGame.id] ?? []}
          reverse={false}
          dotRadius={VOTE_DOT_RADIUS}
          size={SIZE}
        />
      ) : null}
      {exitingGame ? (
        <VoteCluster
          key={`exiting-${exitingGame.id}`}
          game={exitingGame}
          votes={votesByGameId[exitingGame.id] ?? []}
          reverse={true}
          dotRadius={VOTE_DOT_RADIUS}
          size={SIZE}
          onExited={() => setExitingGameId(null)}
        />
      ) : null}
    </group>
  );
}

export default function HeroCube({
  games,
  votesByGameId,
  onActiveGameChange,
}: {
  games: Game[];
  votesByGameId: Record<number, Vote[]>;
  onActiveGameChange?: (game: Game | null) => void;
}) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.45} />
        <pointLight position={[8, 8, 8]} intensity={0.7} color="#ffffff" />
        <pointLight position={[-6, -4, -4]} intensity={0.35} color="#d5ff00" />
        <pointLight position={[4, 6, -4]} intensity={0.3} color="#00f0ff" />
        <pointLight position={[-4, -6, 4]} intensity={0.3} color="#ff2a00" />
        <RotatingScene
          games={games}
          votesByGameId={votesByGameId}
          onActiveGameChange={onActiveGameChange}
        />
      </Canvas>
    </div>
  );
}