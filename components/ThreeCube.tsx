'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Game } from '@/lib/db';

function GameDot({
  game,
  onHover,
}: {
  game: Game;
  onHover: (game: Game | null) => void;
}) {
  const position: [number, number, number] = [
    (game.exec_avg / 100) * 10 - 5,
    (game.info_avg / 100) * 10 - 5,
    (game.mental_avg / 100) * 10 - 5,
  ];

  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={position}
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
      onClick={() => {
        window.location.href = `/game/${game.slug}`;
      }}
    >
      <sphereGeometry args={[hovered ? 0.35 : 0.25, 32, 32]} />
      <meshStandardMaterial
        color={new THREE.Color(0xffffff)}
        emissive={new THREE.Color(0x22d3ee).lerp(new THREE.Color(0xfbbf24), game.info_avg / 100).lerp(new THREE.Color(0xe879f9), game.mental_avg / 100)}
        emissiveIntensity={hovered ? 1.2 : 0.6}
        roughness={0.3}
        metalness={0.6}
      />
    </mesh>
  );
}

function Axes() {
  const color = '#475569';
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
      <Text position={[5.6, -5, -5]} fontSize={0.4} color="#22d3ee" anchorX="left">
        Execution (X)
      </Text>
      <Text position={[-5, 5.6, -5]} fontSize={0.4} color="#fbbf24" anchorX="center" anchorY="bottom">
        Info (Y)
      </Text>
      <Text position={[-5, -5, 5.6]} fontSize={0.4} color="#e879f9" anchorX="center" anchorY="bottom">
        Mental (Z)
      </Text>
    </group>
  );
}

export default function ThreeCube({ games }: { games: Game[] }) {
  const [hoveredGame, setHoveredGame] = useState<Game | null>(null);

  return (
    <div className="relative h-screen w-full">
      <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Axes />
        {games.filter((g) => g.vote_count > 0).map((game) => (  // filter to only show games that have at least one vote
          <GameDot key={game.id} game={game} onHover={setHoveredGame} />
        ))}
        <OrbitControls makeDefault />
      </Canvas>

      {hoveredGame ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm shadow-lg backdrop-blur">
          <div className="font-semibold text-slate-100">{hoveredGame.name}</div>
          <div className="mt-1 text-xs text-slate-400">
            Exec {Math.round(hoveredGame.exec_avg)} · Info {Math.round(hoveredGame.info_avg)} · Mental {Math.round(hoveredGame.mental_avg)}
          </div>
          <div className="text-xs text-slate-500">
            {hoveredGame.vote_count} vote{hoveredGame.vote_count === 1 ? '' : 's'}
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-4 left-4 text-xs text-slate-500">
        Drag to rotate · Scroll to zoom · Click a dot to open game
      </div>
    </div>
  );
}
