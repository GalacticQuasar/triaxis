'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Game, Vote } from '@/lib/db';

const COLOR_INFO = new THREE.Color(0xef767a);
const COLOR_MENTAL = new THREE.Color(0x7d53de);

const VOTE_ANIMATION_DURATION_SECONDS = 0.75;

function avgToPosition(
  avg: Pick<Game, 'exec_avg' | 'info_avg' | 'mental_avg'>
): THREE.Vector3 {
  return new THREE.Vector3(
    (avg.exec_avg / 100) * 10 - 5,
    (avg.info_avg / 100) * 10 - 5,
    (avg.mental_avg / 100) * 10 - 5
  );
}

function voteToPosition(vote: Vote): THREE.Vector3 {
  return new THREE.Vector3(
    (vote.exec_score / 100) * 10 - 5,
    (vote.info_score / 100) * 10 - 5,
    (vote.mental_score / 100) * 10 - 5
  );
}

function gameColor(game: Game): THREE.Color {
  return new THREE.Color(0x2ec4b6)
    .lerp(COLOR_INFO, game.info_avg / 100)
    .lerp(COLOR_MENTAL, game.mental_avg / 100);
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

function ClusterDot({
  start,
  end,
  tRef,
  baseColor,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  tRef: React.MutableRefObject<number>;
  baseColor: THREE.Color;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.BufferGeometry>(null);

  const initialPositions = useMemo(
    () =>
      new Float32Array([
        start.x,
        start.y,
        start.z,
        start.x,
        start.y,
        start.z,
      ]),
    [start]
  );

  useFrame(() => {
    if (!meshRef.current) return;

    meshRef.current.position.lerpVectors(start, end, tRef.current);

    if (lineRef.current) {
      const pos = lineRef.current.attributes.position;
      pos.setXYZ(0, start.x, start.y, start.z);
      pos.setXYZ(
        1,
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z
      );
      pos.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[start.x, start.y, start.z]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      <line>
        <bufferGeometry ref={lineRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[initialPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={baseColor} transparent opacity={0.4} />
      </line>
    </group>
  );
}

function VoteCluster({
  game,
  votes,
  reverse,
  onExited,
}: {
  game: Game;
  votes: Vote[];
  reverse: boolean;
  onExited?: () => void;
}) {
  const start = useMemo(() => avgToPosition(game), [game]);
  const baseColor = useMemo(() => gameColor(game), [game]);

  const tRef = useRef(reverse ? 1 : 0);
  const fromT = useRef(reverse ? 1 : 0);
  const toT = useRef(reverse ? 0 : 1);
  const startTime = useRef<number | null>(null);
  const completed = useRef(false);

  useEffect(() => {
    startTime.current = null;
    fromT.current = tRef.current;
    toT.current = reverse ? 0 : 1;
    completed.current = false;
  }, [reverse]);

  useFrame((state) => {
    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTime.current;
    const rawT = Math.min(
      elapsed / VOTE_ANIMATION_DURATION_SECONDS,
      1
    );
    const eased = easeOutQuint(rawT);
    tRef.current = fromT.current + (toT.current - fromT.current) * eased;

    if (
      reverse &&
      Math.abs(tRef.current - toT.current) < 0.001 &&
      !completed.current
    ) {
      completed.current = true;
      onExited?.();
    }
  });

  return (
    <group>
      {votes.map((vote) => (
        <ClusterDot
          key={vote.id}
          start={start}
          end={voteToPosition(vote)}
          tRef={tRef}
          baseColor={baseColor}
        />
      ))}
    </group>
  );
}

function GameDot({
  game,
  onHover,
  onSelect,
}: {
  game: Game;
  onHover: (game: Game | null) => void;
  onSelect: (game: Game) => void;
}) {
  const position = useMemo(() => avgToPosition(game), [game]);
  const [hovered, setHovered] = useState(false);
  const baseColor = useMemo(() => gameColor(game), [game]);

  return (
    <group>
      <mesh
        position={position.toArray()}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(game);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(game);
        }}
      >
        <sphereGeometry args={[hovered ? 0.35 : 0.25, 32, 32]} />
        <meshStandardMaterial
          color={new THREE.Color(0xffffff)}
          emissive={baseColor}
          emissiveIntensity={hovered ? 1.5 : 0.7}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {hovered ? (
        <mesh position={position.toArray()}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.15} />
        </mesh>
      ) : null}
    </group>
  );
}

function Axes() {
  const color = '#1a3a4a';
  const lines: [THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-5, -5, -5), new THREE.Vector3(5, -5, -5)],
    [new THREE.Vector3(-5, -5, -5), new THREE.Vector3(-5, 5, -5)],
    [new THREE.Vector3(-5, -5, -5), new THREE.Vector3(-5, -5, 5)],
  ];

  for (const n of [-5, 0, 5]) {
    lines.push(
      [new THREE.Vector3(n, -5, -5), new THREE.Vector3(n, 5, -5)],
      [new THREE.Vector3(-5, n, -5), new THREE.Vector3(5, n, -5)],
      [new THREE.Vector3(n, -5, -5), new THREE.Vector3(n, -5, 5)],
      [new THREE.Vector3(-5, -5, n), new THREE.Vector3(5, -5, n)],
      [new THREE.Vector3(-5, n, -5), new THREE.Vector3(-5, n, 5)],
      [new THREE.Vector3(-5, -5, n), new THREE.Vector3(-5, 5, n)]
    );
  }

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1} />
      ))}
      <Text
        position={[5.8, -5, -5]}
        fontSize={0.4}
        color="#2ec4b6"
        anchorX="left"
      >
        Execution (X)
      </Text>
      <Text
        position={[-5, 5.8, -5]}
        fontSize={0.4}
        color="#ef767a"
        anchorX="center"
        anchorY="bottom"
      >
        Info (Y)
      </Text>
      <Text
        position={[-5, -5, 5.8]}
        fontSize={0.4}
        color="#7d53de"
        anchorX="center"
        anchorY="bottom"
      >
        Mental (Z)
      </Text>
    </group>
  );
}

export default function ThreeCube({
  games,
  votesByGameId,
}: {
  games: Game[];
  votesByGameId: Record<number, Vote[]>;
}) {
  const [hoveredGame, setHoveredGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [exitingGames, setExitingGames] = useState<Game[]>([]);

  const gamesWithVotes = games.filter((g) => g.vote_count > 0);

  function selectGame(game: Game) {
    const votes = votesByGameId[game.id] ?? [];
    if (votes.length <= 1) {
      window.location.href = `/game/${game.slug}`;
      return;
    }

    if (selectedGame?.id === game.id) {
      if (selectedGame) {
        setExitingGames((prev) => [...prev, selectedGame]);
      }
      setSelectedGame(null);
      return;
    }

    if (selectedGame) {
      setExitingGames((prev) => [...prev, selectedGame]);
    }
    setSelectedGame(game);
  }

  function deselect() {
    if (selectedGame) {
      setExitingGames((prev) => [...prev, selectedGame]);
    }
    setSelectedGame(null);
  }

  function removeExiting(gameId: number) {
    setExitingGames((prev) => prev.filter((g) => g.id !== gameId));
  }

  return (
    <div className="relative h-[calc(100vh-64px)] w-full">
      <Canvas
        camera={{ position: [12, 12, 12], fov: 50 }}
        onPointerMissed={deselect}
      >
        <color attach="background" args={['#011627']} />
        <fog attach="fog" args={['#011627', 15, 35]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-10, -5, -5]} intensity={0.3} color="#2ec4b6" />
        <pointLight position={[5, 10, -5]} intensity={0.3} color="#ef767a" />
        <pointLight position={[-5, -10, 10]} intensity={0.3} color="#7d53de" />

        <Axes />
        {gamesWithVotes.map((game) => (
          <GameDot
            key={game.id}
            game={game}
            onHover={setHoveredGame}
            onSelect={selectGame}
          />
        ))}

        {selectedGame ? (
          <VoteCluster
            key={selectedGame.id}
            game={selectedGame}
            votes={votesByGameId[selectedGame.id] ?? []}
            reverse={false}
          />
        ) : null}

        {exitingGames.map((game) => (
          <VoteCluster
            key={game.id}
            game={game}
            votes={votesByGameId[game.id] ?? []}
            reverse={true}
            onExited={() => removeExiting(game.id)}
          />
        ))}

        <OrbitControls makeDefault />
      </Canvas>

      {hoveredGame ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-border-default bg-background/90 px-5 py-4 text-sm shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="font-semibold text-text-primary text-base">
            {hoveredGame.name}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: '#2ec4b6' }}
              />
              Exec {Math.round(hoveredGame.exec_avg)}
            </span>
            <span className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: '#ef767a' }}
              />
              Info {Math.round(hoveredGame.info_avg)}
            </span>
            <span className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: '#7d53de' }}
              />
              Mental {Math.round(hoveredGame.mental_avg)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-text-muted">
            {hoveredGame.vote_count} vote
            {hoveredGame.vote_count === 1 ? '' : 's'}
          </div>
        </div>
      ) : null}

      {selectedGame ? (
        <div className="absolute right-4 top-4 rounded-xl border border-border-default bg-background/90 px-5 py-4 text-sm shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="font-semibold text-text-primary text-base">
            {selectedGame.name}
          </div>
          <div className="mt-1 text-[11px] text-text-muted">
            Showing {votesByGameId[selectedGame.id]?.length ?? 0} individual
            vote
            {(votesByGameId[selectedGame.id]?.length ?? 0) === 1 ? '' : 's'}
          </div>
          <button
            onClick={() =>
              (window.location.href = `/game/${selectedGame.slug}`)
            }
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-text-primary px-3 py-1.5 text-xs font-medium text-background hover:bg-text-primary/90 transition-colors"
          >
            Open game page
          </button>
        </div>
      ) : null}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-text-muted flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
          Drag to rotate
        </span>
        <span className="h-1 w-1 rounded-full bg-border-default" />
        <span className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
          Scroll to zoom
        </span>
        <span className="h-1 w-1 rounded-full bg-border-default" />
        <span className="flex items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
          Click a dot to expand votes
        </span>
      </div>
    </div>
  );
}
