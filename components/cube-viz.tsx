import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Game, Vote } from '@/lib/db';

export const COLOR_EXEC = new THREE.Color(0xd5ff00);
export const COLOR_INFO = new THREE.Color(0x00f0ff);
export const COLOR_MENTAL = new THREE.Color(0xff2a00);
export const COLOR_WHITE = new THREE.Color(0xffffff);
export const COLOR_GRAY = new THREE.Color(0x3a3a3a);

export const VOTE_ANIMATION_DURATION_SECONDS = 0.75;

export function avgToPosition(
  avg: Pick<Game, 'exec_avg' | 'info_avg' | 'mental_avg'>,
  size = 10
): THREE.Vector3 {
  const half = size / 2;
  return new THREE.Vector3(
    (avg.exec_avg / 100) * size - half,
    (avg.info_avg / 100) * size - half,
    (avg.mental_avg / 100) * size - half
  );
}

export function voteToPosition(vote: Vote, size = 10): THREE.Vector3 {
  const half = size / 2;
  return new THREE.Vector3(
    (vote.exec_score / 100) * size - half,
    (vote.info_score / 100) * size - half,
    (vote.mental_score / 100) * size - half
  );
}

export function gameColor(game: Game): THREE.Color {
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

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function ClusterDot({
  start,
  end,
  tRef,
  baseColor,
  radius = 0.14,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  tRef: React.MutableRefObject<number>;
  baseColor: THREE.Color;
  radius?: number;
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
        <sphereGeometry args={[radius, 16, 16]} />
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

export function VoteCluster({
  game,
  votes,
  reverse,
  onExited,
  dotRadius = 0.14,
  duration = VOTE_ANIMATION_DURATION_SECONDS,
  size = 10,
}: {
  game: Game;
  votes: Vote[];
  reverse: boolean;
  onExited?: () => void;
  dotRadius?: number;
  duration?: number;
  size?: number;
}) {
  const start = useMemo(
    () => avgToPosition(game, size),
    [game, size]
  );
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
    const rawT = Math.min(elapsed / duration, 1);
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
          end={voteToPosition(vote, size)}
          tRef={tRef}
          baseColor={baseColor}
          radius={dotRadius}
        />
      ))}
    </group>
  );
}