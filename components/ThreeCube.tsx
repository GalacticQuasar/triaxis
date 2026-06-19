'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Move, ZoomIn, MousePointerClick } from 'lucide-react';
import CubeStatsCard from './CubeStatsCard';
import * as THREE from 'three';
import { Game, Vote } from '@/lib/db';

const COLOR_EXEC = new THREE.Color(0xd5ff00);
const COLOR_INFO = new THREE.Color(0x00f0ff);
const COLOR_MENTAL = new THREE.Color(0xff2a00);
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

const COLOR_GRAY = new THREE.Color(0x3a3a3a);

function GameDot({
  game,
  onHover,
  onSelect,
  showLabel,
  selectedId,
}: {
  game: Game;
  onHover: (game: Game | null) => void;
  onSelect: (game: Game) => void;
  showLabel: boolean;
  selectedId: number | null;
}) {
  const position = useMemo(() => avgToPosition(game), [game]);
  const [hovered, setHovered] = useState(false);
  const baseColor = useMemo(() => gameColor(game), [game]);
  const isDimmed = selectedId !== null && selectedId !== game.id;
  const labelVisible =
    showLabel && (selectedId === null || selectedId === game.id || hovered);

  const dotRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const labelRef = useRef<THREE.Mesh | null>(null);
  const labelMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const dotTarget = useMemo(() => new THREE.Vector3(hovered ? 1.4 : 1, hovered ? 1.4 : 1, hovered ? 1.4 : 1), [hovered]);
  const glowTarget = useMemo(() => new THREE.Vector3(hovered ? 1 : 0, hovered ? 1 : 0, hovered ? 1 : 0), [hovered]);
  const opacityTarget = hovered ? 0.15 : 0;
  const labelOpacityTarget = labelVisible ? 1 : 0;
  const LABEL_FADE_SPEED = 0.08;

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
    if (labelMatRef.current) {
      labelMatRef.current.opacity = THREE.MathUtils.lerp(labelMatRef.current.opacity, labelOpacityTarget, LABEL_FADE_SPEED);
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
          color={isDimmed ? COLOR_GRAY : COLOR_WHITE}
          emissive={isDimmed ? COLOR_GRAY : baseColor}
          emissiveIntensity={hovered ? 1.5 : 0.7}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh ref={glowRef} position={position.toArray()} scale={[0, 0, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={isDimmed ? COLOR_GRAY : baseColor}
          transparent
          opacity={0}
        />
      </mesh>
      <Billboard
        position={[position.x, position.y - 0.42, position.z]}
        visible={labelVisible || true}
      >
        <Text
          ref={(ref) => {
            labelRef.current = ref;
            const mat = ref?.material;
            labelMatRef.current = mat instanceof THREE.MeshBasicMaterial ? mat : null;
          }}
          fontSize={0.24}
          color="#8c8c8c"
          anchorX="center"
          anchorY="top"
          visible={true}
        >
          {game.name}
        </Text>
      </Billboard>
    </group>
  );
}

const TARGET_LERP_SPEED = 0.04;
const INITIAL_TARGET = new THREE.Vector3(0, 0, 0);
const INITIAL_CAMERA = new THREE.Vector3(12, 12, 12);
const INITIAL_DISTANCE = INITIAL_CAMERA.distanceTo(INITIAL_TARGET);
const SELECTED_DISTANCE = INITIAL_DISTANCE * 0.6;
const ZOOM_LERP_SPEED = 0.04;

function CameraTarget({
  target,
}: {
  target: THREE.Vector3 | null;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const current = useRef(new THREE.Vector3(0, 0, 0));
  const desired = useMemo(() => (target ? target.clone() : new THREE.Vector3(0, 0, 0)), [target]);

  const prevTarget = useRef<THREE.Vector3 | null>(null);
  const resettingZoom = useRef(false);
  const desiredDistance = useRef(INITIAL_DISTANCE);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => {
      resettingZoom.current = false;
    };
    controls.addEventListener('start', onStart);
    return () => {
      controls.removeEventListener('start', onStart);
    };
  }, []);

  useFrame(() => {
    const justSelected =
      prevTarget.current === null && target !== null;
    const justDeselected =
      prevTarget.current !== null && target === null;
    prevTarget.current = target;
    if (justSelected) {
      desiredDistance.current = SELECTED_DISTANCE;
      resettingZoom.current = true;
    }
    if (justDeselected) {
      desiredDistance.current = INITIAL_DISTANCE;
      resettingZoom.current = true;
    }

    const prev = current.current.clone();
    current.current.lerp(desired, TARGET_LERP_SPEED);
    const delta = current.current.clone().sub(prev);
    camera.position.add(delta);

    if (resettingZoom.current) {
      const controls = controlsRef.current;
      const t = current.current;
      const offset = camera.position.clone().sub(t);
      const dist = offset.length();
      if (dist !== 0) {
        const easedDist = THREE.MathUtils.lerp(dist, desiredDistance.current, ZOOM_LERP_SPEED);
        offset.multiplyScalar(easedDist / dist);
        camera.position.copy(t.clone().add(offset));
      }
      if (controls) {
        controls.target.copy(current.current);
        controls.update();
      }
      if (Math.abs(dist - desiredDistance.current) < 0.01) resettingZoom.current = false;
    } else {
      const controls = controlsRef.current;
      if (controls) {
        controls.target.copy(current.current);
        controls.update();
      } else {
        camera.lookAt(current.current);
      }
    }
  });

  return (
    <OrbitControls ref={controlsRef} makeDefault />
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
  const color = '#262626';
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
        color="#d5ff00"
        anchorX="left"
      >
        Execution (X)
      </Text>
      <Text
        position={[-5, 5.8, -5]}
        fontSize={0.4}
        color="#00f0ff"
        anchorX="center"
        anchorY="bottom"
      >
        Info (Y)
      </Text>
      <Text
        position={[-5, -5, 5.8]}
        fontSize={0.4}
        color="#ff2a00"
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
  const [hoveredGame, setHoveredGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [exitingGames, setExitingGames] = useState<Game[]>([]);
  const [showLabels, setShowLabels] = useState(true);
  const mountedRef = useRef(false);

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
    <div className="relative h-[calc(100vh-64px)] w-full animate-fade-in">
      <Canvas
        camera={{ position: [12, 12, 12], fov: 50 }}
        onPointerMissed={deselect}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 15, 35]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-10, -5, -5]} intensity={0.3} color="#d5ff00" />
        <pointLight position={[5, 10, -5]} intensity={0.3} color="#00f0ff" />
        <pointLight position={[-5, -10, 10]} intensity={0.3} color="#ff2a00" />

        <Axes />
        {gamesWithVotes.map((game) => (
          <GameDot
            key={game.id}
            game={game}
            onHover={setHoveredGame}
            onSelect={selectGame}
            showLabel={showLabels}
            selectedId={selectedGame?.id ?? null}
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

        <CameraTarget target={selectedGame ? avgToPosition(selectedGame) : null} />
      </Canvas>

      {hoveredGame ? (
        <div className="pointer-events-none absolute left-4 top-4 border border-stroke bg-bg/95 px-4 py-3 text-sm animate-fade-in z-20">
          <div className="font-[family-name:var(--font-dharma)] text-lg font-normal uppercase text-ink leading-none">
            {hoveredGame.name}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs font-[family-name:var(--font-mono)] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-acid" />
              Exec {Math.round(hoveredGame.exec_avg)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-cyan" />
              Info {Math.round(hoveredGame.info_avg)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-red" />
              Mental {Math.round(hoveredGame.mental_avg)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-ink-muted font-[family-name:var(--font-mono)] uppercase tracking-wider">
            {hoveredGame.vote_count} vote
            {hoveredGame.vote_count === 1 ? '' : 's'}
          </div>
        </div>
      ) : null}

      {selectedGame ? (
        <CubeStatsCard
          key={selectedGame.id}
          game={selectedGame}
          votes={votesByGameId[selectedGame.id] ?? []}
          allGames={games}
        />
      ) : null}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-ink-muted flex items-center gap-4 font-[family-name:var(--font-mono)] uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Move size={12} />
          Drag to rotate
        </span>
        <span className="h-2 w-px bg-stroke" />
        <span className="flex items-center gap-1.5">
          <ZoomIn size={12} />
          Scroll to zoom
        </span>
        <span className="h-2 w-px bg-stroke" />
        <span className="flex items-center gap-1.5">
          <MousePointerClick size={12} />
          Click a dot to expand votes
        </span>
      </div>

      <button
        onClick={() => {
          const next = !showLabels;
          setShowLabels(next);
          if (typeof window !== 'undefined') {
            if (!mountedRef.current) {
              mountedRef.current = true;
              const saved = localStorage.getItem('triaxis.showLabels');
              if (saved === 'false') {
                setShowLabels(false);
              }
            }
            localStorage.setItem('triaxis.showLabels', String(next));
          }
        }}
        className="absolute bottom-6 left-6 flex items-center gap-3 border border-stroke bg-bg/95 px-3 py-2 text-[11px] font-semibold text-ink-dim font-[family-name:var(--font-mono)] uppercase tracking-wider transition-all hover:text-acid hover:border-acid"
        aria-pressed={showLabels}
      >
        <span
          className={`relative h-4 w-8 border border-stroke transition-colors ${
            showLabels ? 'bg-acid' : 'bg-bg-raised'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-2.5 w-2.5 bg-ink transition-transform ${
              showLabels ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
        Labels
      </button>
    </div>
  );
}
