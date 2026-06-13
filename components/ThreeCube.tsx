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

  // Generate color from the three axes
  const baseColor = new THREE.Color(0x2ec4b6)
    .lerp(new THREE.Color(0xef767a), game.info_avg / 100)
    .lerp(new THREE.Color(0x7d53de), game.mental_avg / 100);

  return (
    <group>
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
          emissive={baseColor}
          emissiveIntensity={hovered ? 1.5 : 0.7}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {hovered ? (
        <mesh position={position}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.15}
          />
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
      <Text position={[5.8, -5, -5]} fontSize={0.4} color="#2ec4b6" anchorX="left">
        Execution (X)
      </Text>
      <Text position={[-5, 5.8, -5]} fontSize={0.4} color="#ef767a" anchorX="center" anchorY="bottom">
        Info (Y)
      </Text>
      <Text position={[-5, -5, 5.8]} fontSize={0.4} color="#7d53de" anchorX="center" anchorY="bottom">
        Mental (Z)
      </Text>
    </group>
  );
}

export default function ThreeCube({ games }: { games: Game[] }) {
  const [hoveredGame, setHoveredGame] = useState<Game | null>(null);

  return (
    <div className="relative h-[calc(100vh-64px)] w-full">
      <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
        <color attach="background" args={['#011627']} />
        <fog attach="fog" args={['#011627', 15, 35]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-10, -5, -5]} intensity={0.3} color="#2ec4b6" />
        <pointLight position={[5, 10, -5]} intensity={0.3} color="#ef767a" />
        <pointLight position={[-5, -10, 10]} intensity={0.3} color="#7d53de" />

        <Axes />
        {games.filter((g) => g.vote_count > 0).map((game) => (
          <GameDot key={game.id} game={game} onHover={setHoveredGame} />
        ))}
        <OrbitControls makeDefault />
      </Canvas>

      {hoveredGame ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-border-default bg-background/90 px-5 py-4 text-sm shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <div className="font-semibold text-text-primary text-base">{hoveredGame.name}</div>
          <div className="mt-2 flex items-center gap-3 text-xs"
          >
            <span className="flex items-center gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#2ec4b6' }} />
              Exec {Math.round(hoveredGame.exec_avg)}
            </span>
            <span className="flex items-center gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#ef767a' }} />
              Info {Math.round(hoveredGame.info_avg)}
            </span>
            <span className="flex items-center gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#7d53de' }} />
              Mental {Math.round(hoveredGame.mental_avg)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-text-muted"
          >
            {hoveredGame.vote_count} vote{hoveredGame.vote_count === 1 ? '' : 's'}
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-text-muted flex items-center gap-4"
      >
        <span className="flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
          Drag to rotate
        </span>
        <span className="h-1 w-1 rounded-full bg-border-default" />
        <span className="flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
          Scroll to zoom
        </span>
        <span className="h-1 w-1 rounded-full bg-border-default" />
        <span className="flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm0-3V7" />
          </svg>
          Click a dot to open
        </span>
      </div>
    </div>
  );
}
