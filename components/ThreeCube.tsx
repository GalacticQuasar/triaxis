'use client';

import { useState, useRef, useMemo, useEffect, useSyncExternalStore } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { Move, ZoomIn, MousePointerClick } from 'lucide-react';
import * as THREE from 'three';
import { Game, Vote } from '@/lib/db';

const COLOR_EXEC = new THREE.Color(0x2ec4b6);
const COLOR_INFO = new THREE.Color(0xef767a);
const COLOR_MENTAL = new THREE.Color(0x7d53de);
const COLOR_WHITE = new THREE.Color(0xffffff);

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
  const exec = game.exec_avg / 100;
  const info = game.info_avg / 100;
  const mental = game.mental_avg / 100;
  const total = exec + info + mental || 1;

  return new THREE.Color(
    (COLOR_EXEC.r * exec + COLOR_INFO.r * info + COLOR_MENTAL.r * mental) / total,
    (COLOR_EXEC.g * exec + COLOR_INFO.g * info + COLOR_MENTAL.g * mental) / total,
    (COLOR_EXEC.b * exec + COLOR_INFO.b * info + COLOR_MENTAL.b * mental) / total
  );
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
  showLabel,
}: {
  game: Game;
  onHover: (game: Game | null) => void;
  onSelect: (game: Game) => void;
  showLabel: boolean;
}) {
  const position = useMemo(() => avgToPosition(game), [game]);
  const [hovered, setHovered] = useState(false);
  const baseColor = useMemo(() => gameColor(game), [game]);

  const dotRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const dotTarget = useMemo(() => new THREE.Vector3(hovered ? 1.4 : 1, hovered ? 1.4 : 1, hovered ? 1.4 : 1), [hovered]);
  const glowTarget = useMemo(() => new THREE.Vector3(hovered ? 1 : 0, hovered ? 1 : 0, hovered ? 1 : 0), [hovered]);
  const opacityTarget = hovered ? 0.15 : 0;

  useFrame(() => {
    if (dotRef.current) {
      dotRef.current.scale.lerp(dotTarget, 0.15);
    }
    if (glowRef.current) {
      glowRef.current.scale.lerp(glowTarget, 0.15);
    }
    if (glowMatRef.current) {
      glowMatRef.current.opacity = THREE.MathUtils.lerp(glowMatRef.current.opacity, opacityTarget, 0.15);
    }
  });

  return (
    <group>
      <mesh
        ref={dotRef}
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
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={COLOR_WHITE}
          emissive={baseColor}
          emissiveIntensity={hovered ? 1.5 : 0.7}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh ref={glowRef} position={position.toArray()} scale={[0, 0, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={baseColor}
          transparent
          opacity={0}
        />
      </mesh>
      <Billboard
        position={[position.x, position.y - 0.42, position.z]}
        visible={showLabel}
      >
        <Text
          fontSize={0.24}
          color="#8daab8"
          anchorX="center"
          anchorY="top"
          visible={showLabel}
        >
          {game.name}
        </Text>
      </Billboard>
    </group>
  );
}

function GradientAxisLines() {
  const group = useMemo(() => {
    const axes: [THREE.Vector3, THREE.Color][] = [
      [new THREE.Vector3(-5, -5, -5), COLOR_EXEC],
      [new THREE.Vector3(-5, -5, -5), COLOR_INFO],
      [new THREE.Vector3(-5, -5, -5), COLOR_MENTAL],
    ];

    const g = new THREE.Group();
    const originColor = new THREE.Color(0xffffff);

    for (const [start, color] of axes) {
      const end = new THREE.Vector3(
        start.x + (color === COLOR_EXEC ? 10 : 0),
        start.y + (color === COLOR_INFO ? 10 : 0),
        start.z + (color === COLOR_MENTAL ? 10 : 0)
      );
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const vertexColors = new Float32Array([
        originColor.r, originColor.g, originColor.b,
        color.r, color.g, color.b,
      ]);
      geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
      });
      g.add(new THREE.Line(geometry, material));
    }

    return g;
  }, []);

  return <primitive object={group} />;
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
      <GradientAxisLines />
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
  const router = useRouter();
  const [hoveredGame, setHoveredGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [exitingGames, setExitingGames] = useState<Game[]>([]);
  const [showLabels, setShowLabels] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('triaxis.showLabels');
    return saved === null || saved === 'true';
  });
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const gamesWithVotes = games.filter((g) => g.vote_count > 0);

  function selectGame(game: Game) {
    if (selectedGame?.id === game.id) {
      if (selectedGame) {
        setExitingGames((prev) =>
          prev.some((g) => g.id === selectedGame.id) ? prev : [...prev, selectedGame]
        );
      }
      setSelectedGame(null);
      return;
    }

    if (selectedGame) {
      setExitingGames((prev) =>
        prev.some((g) => g.id === selectedGame.id) ? prev : [...prev, selectedGame]
      );
    }
    // If this game is currently animating out, cancel that exit so it can re-enter cleanly.
    setExitingGames((prev) => prev.filter((g) => g.id !== game.id));
    setSelectedGame(game);
  }

  function deselect() {
    if (selectedGame) {
      setExitingGames((prev) =>
        prev.some((g) => g.id === selectedGame.id) ? prev : [...prev, selectedGame]
      );
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
            showLabel={showLabels}
          />
        ))}

        {selectedGame ? (
          <VoteCluster
            key={`selected-${selectedGame.id}`}
            game={selectedGame}
            votes={votesByGameId[selectedGame.id] ?? []}
            reverse={false}
          />
        ) : null}

        {exitingGames.map((game) => (
          <VoteCluster
            key={`exiting-${game.id}`}
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
            onClick={() => router.push(`/game/${selectedGame.slug}`)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-text-primary px-3 py-1.5 text-xs font-medium text-background hover:bg-text-primary/90 transition-colors"
          >
            Open game page
          </button>
        </div>
      ) : null}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-text-muted flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Move size={12} />
          Drag to rotate
        </span>
        <span className="h-1 w-1 rounded-full bg-border-default" />
        <span className="flex items-center gap-1.5">
          <ZoomIn size={12} />
          Scroll to zoom
        </span>
        <span className="h-1 w-1 rounded-full bg-border-default" />
        <span className="flex items-center gap-1.5">
          <MousePointerClick size={12} />
          Click a dot to expand votes
        </span>
      </div>

      <button
        onClick={() => {
          const next = !showLabels;
          setShowLabels(next);
          if (mounted) localStorage.setItem('triaxis.showLabels', String(next));
        }}
        className="absolute bottom-6 left-6 flex items-center gap-3 rounded-full border border-border-default bg-background/90 px-4 py-2 text-xs font-medium text-text-secondary shadow-2xl backdrop-blur-xl transition-all hover:text-text-primary hover:border-text-secondary/30"
        aria-pressed={showLabels}
      >
        <span
          className={`relative h-5 w-9 rounded-full transition-colors ${
            showLabels ? 'bg-accent-sea' : 'bg-surface-raised'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              showLabels ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
        Labels
      </button>
    </div>
  );
}
