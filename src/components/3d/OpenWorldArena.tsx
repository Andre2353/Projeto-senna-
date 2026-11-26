import { useEffect, useMemo, useRef } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OPEN_WORLD_CHAPTERS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { ChapterMonument } from '../../types/game';
import { engineAudio } from '../../utils/engineAudio';
import { distance2D, normalizeAngle } from '../../utils/gameMath';
import { getToonGradientMap } from '../../utils/performance';
import { gameRuntime } from '../../utils/runtime';

const MAX_SKID_SEGMENTS = 360;
const KERB_COUNT = 120;
const MOUNTAIN_COUNT = 24;
const TREE_COUNT = 80;

function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#15803d';
    for (let y = 0; y < 256; y += 32) {
      ctx.fillRect(0, y, 256, 16);
    }
    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    for (let i = 0; i < 180; i++) {
      const rx = (i * 53) % 256;
      const ry = (i * 97) % 256;
      ctx.fillRect(rx, ry, 4, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 40);
  tex.needsUpdate = true;
  return tex;
}

function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const x = (i * 73) % 256;
      const y = (i * 137) % 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.needsUpdate = true;
  return tex;
}

function createChapterSignTexture(chapter: ChapterMonument, isUnlocked: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 512, 192);

    ctx.strokeStyle = isUnlocked ? '#16a34a' : chapter.accentColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 176);

    ctx.fillStyle = isUnlocked ? '#16a34a' : chapter.accentColor;
    ctx.font = 'bold 26px monospace';
    ctx.fillText(`CAPÍTULO 0${chapter.id} // ${chapter.period}`, 26, 54);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(chapter.title.replace(/^CAPÍTULO \d+ — /, ''), 26, 114);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '600 22px monospace';
    ctx.fillText(isUnlocked ? 'DESBLOQUEADO' : 'ATRAVESSE O MONUMENTO', 26, 158);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function MonumentStructure({
  chapter,
  isTarget,
  isUnlocked,
}: {
  chapter: ChapterMonument;
  isTarget: boolean;
  isUnlocked: boolean;
}) {
  const beaconRef = useRef<THREE.MeshBasicMaterial>(null);
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const signTexture = useMemo(
    () => createChapterSignTexture(chapter, isUnlocked),
    [chapter, isUnlocked]
  );

  useEffect(() => {
    return () => {
      signTexture.dispose();
    };
  }, [signTexture]);

  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.opacity = isTarget
        ? 0.28 + Math.sin(state.clock.elapsedTime * 3) * 0.08
        : isUnlocked
          ? 0.08
          : 0.14;
    }
  });

  const ringColor = isUnlocked ? '#16a34a' : chapter.accentColor;

  return (
    <group position={[chapter.position.x, 0, chapter.position.z]}>
      {/* Base glow trigger ring on arena floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[12.8, 14.6, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={isTarget ? 0.92 : 0.55} />
      </mesh>

      {/* Vertical sky beacon */}
      <mesh position={[0, 42, 0]}>
        <cylinderGeometry args={[0.45, 2.2, 84, 16, 1, true]} />
        <meshBasicMaterial
          ref={beaconRef}
          color={ringColor}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Billboard Signboard: always faces the camera cleanly, never mirrored */}
      <Billboard position={[0, 12.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <planeGeometry args={[11, 4.1]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>
      </Billboard>

      {/* Visual Theme per Chapter */}
      {chapter.visualType === 'kart' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <ringGeometry args={[8.4, 9.2, 36]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <group position={[0, 0.45, 0]} scale={[1.65, 1.65, 1.65]}>
            <mesh castShadow>
              <boxGeometry args={[1.1, 0.28, 1.9]} />
              <meshToonMaterial color="#facc15" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, 0.35, 0.1]}>
              <boxGeometry args={[0.55, 0.35, 0.5]} />
              <meshToonMaterial color="#18181b" gradientMap={gradientMap} />
            </mesh>
          </group>
        </group>
      )}

      {chapter.visualType === 'toleman_lotus' && (
        <group>
          <mesh position={[-5.5, 4.2, 0]} castShadow>
            <boxGeometry args={[1.4, 8.4, 1.4]} />
            <meshToonMaterial color="#1d4ed8" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[5.5, 4.2, 0]} castShadow>
            <boxGeometry args={[1.4, 8.4, 1.4]} />
            <meshToonMaterial color="#09090b" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 8.5, 0]}>
            <boxGeometry args={[12.8, 0.65, 1.2]} />
            <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={1.6} />
          </mesh>
        </group>
      )}

      {chapter.visualType === 'mclaren_arches' && (
        <group>
          {[-4.5, 0, 4.5].map((offsetZ, idx) => (
            <group key={idx} position={[0, 0, offsetZ]}>
              <mesh position={[-6.5, 4.5, 0]}>
                <boxGeometry args={[0.9, 9, 0.9]} />
                <meshToonMaterial color="#f8fafc" gradientMap={gradientMap} />
              </mesh>
              <mesh position={[6.5, 4.5, 0]}>
                <boxGeometry args={[0.9, 9, 0.9]} />
                <meshToonMaterial color="#ef4444" gradientMap={gradientMap} />
              </mesh>
              <mesh position={[0, 9.2, 0]}>
                <boxGeometry args={[14, 0.9, 0.9]} />
                <meshToonMaterial
                  color={idx === 1 ? '#ef4444' : '#f8fafc'}
                  gradientMap={gradientMap}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {chapter.visualType === 'monaco_water' && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <circleGeometry args={[12.5, 40]} />
            <meshStandardMaterial color="#0284c7" roughness={0.12} metalness={0.75} />
          </mesh>
          <mesh position={[-6.8, 4.4, 0]}>
            <boxGeometry args={[0.9, 8.8, 0.9]} />
            <meshToonMaterial color="#1d4ed8" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[6.8, 4.4, 0]}>
            <boxGeometry args={[0.9, 8.8, 0.9]} />
            <meshToonMaterial color="#facc15" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 8.8, 0]}>
            <boxGeometry args={[14.6, 0.8, 0.9]} />
            <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}

      {chapter.visualType === 'instituto_sun' && (
        <group>
          <mesh position={[0, 5.2, 0]}>
            <torusGeometry args={[6.4, 0.45, 16, 48, Math.PI]} />
            <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.8} />
          </mesh>
          {[-3, -1.5, 0, 1.5, 3].map((ang, idx) => (
            <mesh
              key={idx}
              rotation={[-Math.PI / 2, 0, ang * 0.35]}
              position={[0, 0.06, 0]}
            >
              <planeGeometry args={[0.28, 22]} />
              <meshBasicMaterial color="#fde047" transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      )}

      {chapter.visualType === 'eternal_helmet' && (
        <group>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[4.5, 5.6, 2.4, 32]} />
            <meshToonMaterial color="#27272a" gradientMap={gradientMap} />
          </mesh>
          <group position={[0, 5.0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[2.5, 32, 24]} />
              <meshToonMaterial color="#facc15" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[2.55, 2.55, 0.44, 32]} />
              <meshToonMaterial color="#16a34a" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, -0.42, 0]}>
              <cylinderGeometry args={[2.54, 2.54, 0.34, 32]} />
              <meshToonMaterial color="#1d4ed8" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, 0.25, 1.95]}>
              <boxGeometry args={[3.2, 0.95, 1.2]} />
              <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
            </mesh>
          </group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -220]}>
            <planeGeometry args={[12, 420]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function OpenWorldArena() {
  const mode = useGameStore((state) => state.mode);
  const unlockedChapters = useGameStore((state) => state.unlockedChapters);
  const unlockChapter = useGameStore((state) => state.unlockChapter);

  const skidMeshRef = useRef<THREE.InstancedMesh>(null);
  const kerbMeshRef = useRef<THREE.InstancedMesh>(null);
  const mountainMeshRef = useRef<THREE.InstancedMesh>(null);
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeCrownRef = useRef<THREE.InstancedMesh>(null);
  const skidCursorRef = useRef(0);
  const skidCooldownRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const grassTexture = useMemo(() => createGrassTexture(), []);
  const asphaltTexture = useMemo(() => createAsphaltTexture(), []);

  useEffect(() => {
    return () => {
      grassTexture.dispose();
      asphaltTexture.dispose();
    };
  }, [asphaltTexture, grassTexture]);

  useEffect(() => {
    if (skidMeshRef.current) {
      dummy.position.set(0, -100, 0);
      dummy.scale.set(0.001, 0.001, 0.001);
      dummy.updateMatrix();
      for (let i = 0; i < MAX_SKID_SEGMENTS; i++) {
        skidMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      skidMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Ring kerbs around main open-world oval loop (center 0, -1500)
    if (kerbMeshRef.current) {
      const color = new THREE.Color();
      for (let i = 0; i < KERB_COUNT; i++) {
        const angle = (i / KERB_COUNT) * Math.PI * 2;
        const radius = i % 2 === 0 ? 185 : 158;
        dummy.position.set(Math.cos(angle) * radius, 0.04, -1500 + Math.sin(angle) * 390);
        dummy.rotation.set(0, -angle, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        kerbMeshRef.current.setMatrixAt(i, dummy.matrix);
        color.set(i % 2 === 0 ? '#ef4444' : '#f8fafc');
        kerbMeshRef.current.setColorAt(i, color);
      }
      kerbMeshRef.current.instanceMatrix.needsUpdate = true;
      if (kerbMeshRef.current.instanceColor) kerbMeshRef.current.instanceColor.needsUpdate = true;
    }

    // Low-poly mountains encircling the horizon
    if (mountainMeshRef.current) {
      for (let i = 0; i < MOUNTAIN_COUNT; i++) {
        const angle = (i / MOUNTAIN_COUNT) * Math.PI * 2;
        const dist = 510 + (i % 3) * 45;
        const height = 65 + ((i * 19) % 70);
        const radius = 65 + ((i * 13) % 40);
        dummy.position.set(Math.cos(angle) * dist, height * 0.48, -1500 + Math.sin(angle) * (dist * 1.3));
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(radius, height, radius);
        dummy.updateMatrix();
        mountainMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      mountainMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Stylized low-poly trees around outer autodrome perimeter
    if (treeTrunkRef.current && treeCrownRef.current) {
      for (let i = 0; i < TREE_COUNT; i++) {
        const angle = (i / TREE_COUNT) * Math.PI * 2 + (i % 5) * 0.03;
        const distX = 245 + (i % 7) * 28;
        const distZ = 480 + (i % 6) * 45;
        const tx = Math.cos(angle) * distX;
        const tz = -1500 + Math.sin(angle) * distZ;
        const scale = 0.85 + (i % 4) * 0.25;

        dummy.position.set(tx, 1.8 * scale, tz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        treeTrunkRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx, 5.4 * scale, tz);
        dummy.updateMatrix();
        treeCrownRef.current.setMatrixAt(i, dummy.matrix);
      }
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeCrownRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy, mode]);

  const nextTargetChapter = useMemo(
    () =>
      OPEN_WORLD_CHAPTERS.find((chapter) => !unlockedChapters.includes(chapter.id)) ?? null,
    [unlockedChapters]
  );

  useFrame((_, delta) => {
    if (mode !== 'open_world') {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const px = gameRuntime.position.x;
    const pz = gameRuntime.position.z;

    if (nextTargetChapter) {
      const dist = distance2D(px, pz, nextTargetChapter.position.x, nextTargetChapter.position.z);
      gameRuntime.nearestMonumentId = nextTargetChapter.id;
      gameRuntime.nearestMonumentDistance = dist;

      const worldAngleToTarget = Math.atan2(
        nextTargetChapter.position.x - px,
        -(nextTargetChapter.position.z - pz)
      );
      gameRuntime.compassAngle = normalizeAngle(worldAngleToTarget + gameRuntime.heading);

      if (dist < 14.5) {
        engineAudio.playChapterUnlock();
        unlockChapter(nextTargetChapter.id);
      }
    } else {
      gameRuntime.nearestMonumentId = null;
      gameRuntime.nearestMonumentDistance = 0;
    }

    if (
      skidMeshRef.current &&
      (gameRuntime.drift > 0.25 || gameRuntime.handbrake) &&
      Math.abs(gameRuntime.speed) > 30
    ) {
      skidCooldownRef.current -= dt;
      if (skidCooldownRef.current <= 0) {
        skidCooldownRef.current = 0.025;
        const cosH = Math.cos(gameRuntime.heading);
        const sinH = Math.sin(gameRuntime.heading);

        for (const wheelSide of [-0.98, 0.98] as const) {
          const idx = skidCursorRef.current % MAX_SKID_SEGMENTS;
          skidCursorRef.current += 1;

          const wx = px + wheelSide * cosH + sinH * 1.48;
          const wz = pz - wheelSide * sinH + cosH * 1.48;

          dummy.position.set(wx, 0.045, wz);
          dummy.rotation.set(-Math.PI / 2, 0, gameRuntime.heading);
          dummy.scale.set(0.42, 1.35, 1);
          dummy.updateMatrix();
          skidMeshRef.current.setMatrixAt(idx, dummy.matrix);
        }
        skidMeshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  if (mode !== 'open_world' && mode !== 'credits') {
    return null;
  }

  return (
    <group>
      {/* Vibrant Green Autodrome Turf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -1550]} receiveShadow>
        <planeGeometry args={[1400, 1700]} />
        <meshToonMaterial map={grassTexture} gradientMap={gradientMap} />
      </mesh>

      {/* Entry Runway Asphalt connecting Z = -950 into the Arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1420]} receiveShadow>
        <planeGeometry args={[28, 1020]} />
        <meshStandardMaterial map={asphaltTexture} roughness={0.78} metalness={0.1} />
      </mesh>

      {/* Gravel Runoff Apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, -1500]} scale={[1, 2.2, 1]}>
        <ringGeometry args={[142, 206, 64]} />
        <meshToonMaterial color="#a8a29e" gradientMap={gradientMap} />
      </mesh>

      {/* Stylized Main Circuit Asphalt Loop */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, -1500]}
        scale={[1, 2.2, 1]}
        receiveShadow
      >
        <ringGeometry args={[154, 192, 64]} />
        <meshStandardMaterial map={asphaltTexture} roughness={0.75} metalness={0.12} />
      </mesh>

      {/* Segmented Red/White Kerbs */}
      <instancedMesh ref={kerbMeshRef} args={[undefined, undefined, KERB_COUNT]}>
        <boxGeometry args={[2.2, 0.05, 8.5]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>

      {/* Low-Poly Horizon Mountains */}
      <instancedMesh ref={mountainMeshRef} args={[undefined, undefined, MOUNTAIN_COUNT]}>
        <coneGeometry args={[1, 1, 6]} />
        <meshToonMaterial color="#312e81" gradientMap={gradientMap} />
      </instancedMesh>

      {/* Low-Poly Stylized Trees */}
      <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, TREE_COUNT]}>
        <cylinderGeometry args={[0.35, 0.5, 3.6, 6]} />
        <meshToonMaterial color="#78350f" gradientMap={gradientMap} />
      </instancedMesh>
      <instancedMesh ref={treeCrownRef} args={[undefined, undefined, TREE_COUNT]}>
        <coneGeometry args={[2.6, 6.2, 7]} />
        <meshToonMaterial color="#15803d" gradientMap={gradientMap} />
      </instancedMesh>

      {/* Capped Instanced Tire Skidmarks */}
      <instancedMesh
        ref={skidMeshRef}
        args={[undefined, undefined, MAX_SKID_SEGMENTS]}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#09090b" transparent opacity={0.62} />
      </instancedMesh>

      {/* 6 Narrative Monuments */}
      {OPEN_WORLD_CHAPTERS.map((chapter) => (
        <MonumentStructure
          key={chapter.id}
          chapter={chapter}
          isTarget={nextTargetChapter?.id === chapter.id}
          isUnlocked={unlockedChapters.includes(chapter.id)}
        />
      ))}
    </group>
  );
}
