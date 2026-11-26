import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OPEN_WORLD_CHAPTERS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { ChapterMonument } from '../../types/game';
import { engineAudio } from '../../utils/engineAudio';
import { distance2D, normalizeAngle } from '../../utils/gameMath';
import { gameRuntime } from '../../utils/runtime';

const MAX_SKID_SEGMENTS = 360;

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

    ctx.fillStyle = '#a1a1aa';
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
        ? 0.24 + Math.sin(state.clock.elapsedTime * 3) * 0.08
        : isUnlocked
          ? 0.08
          : 0.12;
    }
  });

  const ringColor = isUnlocked ? '#16a34a' : chapter.accentColor;

  return (
    <group position={[chapter.position.x, 0, chapter.position.z]}>
      {/* Base glow trigger ring on arena floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[12.8, 14.5, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={isTarget ? 0.9 : 0.45} />
      </mesh>

      {/* Vertical sky beacon */}
      <mesh position={[0, 42, 0]}>
        <cylinderGeometry args={[0.45, 2.2, 84, 16, 1, true]} />
        <meshBasicMaterial
          ref={beaconRef}
          color={ringColor}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Signboard */}
      <mesh position={[0, 12.2, 0]}>
        <planeGeometry args={[10.5, 3.9]} />
        <meshBasicMaterial map={signTexture} side={THREE.DoubleSide} />
      </mesh>

      {/* Visual Theme per Chapter */}
      {chapter.visualType === 'kart' && (
        <group>
          {/* Illuminated yellow kart track oval */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <ringGeometry args={[8.4, 9.2, 36]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          {/* Stylized miniature kart */}
          <group position={[0, 0.45, 0]} scale={[1.6, 1.6, 1.6]}>
            <mesh castShadow>
              <boxGeometry args={[1.1, 0.28, 1.9]} />
              <meshStandardMaterial color="#facc15" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.35, 0.1]}>
              <boxGeometry args={[0.55, 0.35, 0.5]} />
              <meshStandardMaterial color="#18181b" />
            </mesh>
          </group>
        </group>
      )}

      {chapter.visualType === 'toleman_lotus' && (
        <group>
          {/* Twin Toleman & Lotus stylized monoliths */}
          <mesh position={[-5.5, 4.2, 0]} castShadow>
            <boxGeometry args={[1.4, 8.4, 1.4]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh position={[5.5, 4.2, 0]} castShadow>
            <boxGeometry args={[1.4, 8.4, 1.4]} />
            <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, 8.5, 0]}>
            <boxGeometry args={[12.8, 0.55, 1.2]} />
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
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
              </mesh>
              <mesh position={[6.5, 4.5, 0]}>
                <boxGeometry args={[0.9, 9, 0.9]} />
                <meshStandardMaterial color="#ef4444" roughness={0.3} />
              </mesh>
              <mesh position={[0, 9.2, 0]}>
                <boxGeometry args={[14, 0.9, 0.9]} />
                <meshStandardMaterial color={idx === 1 ? '#ef4444' : '#f8fafc'} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {chapter.visualType === 'monaco_water' && (
        <group>
          {/* Reflective Monaco water sheet */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[12.5, 40]} />
            <meshStandardMaterial color="#0369a1" roughness={0.08} metalness={0.85} />
          </mesh>
          <mesh position={[-6.8, 4.4, 0]}>
            <boxGeometry args={[0.9, 8.8, 0.9]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
          <mesh position={[6.8, 4.4, 0]}>
            <boxGeometry args={[0.9, 8.8, 0.9]} />
            <meshStandardMaterial color="#facc15" />
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
              position={[0, 0.04, 0]}
            >
              <planeGeometry args={[0.25, 22]} />
              <meshBasicMaterial color="#fde047" transparent opacity={0.75} />
            </mesh>
          ))}
        </group>
      )}

      {chapter.visualType === 'eternal_helmet' && (
        <group>
          {/* Grand pedestal */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[4.5, 5.6, 2.4, 32]} />
            <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.65} />
          </mesh>
          {/* Giant illuminated Senna helmet */}
          <group position={[0, 5.0, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[2.5, 32, 24]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#eab308"
                emissiveIntensity={0.45}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[2.55, 2.55, 0.44, 32]} />
              <meshStandardMaterial color="#16a34a" roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.42, 0]}>
              <cylinderGeometry args={[2.54, 2.54, 0.34, 32]} />
              <meshStandardMaterial color="#1d4ed8" roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.25, 1.95]}>
              <boxGeometry args={[3.2, 0.95, 1.2]} />
              <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
            </mesh>
          </group>
          {/* Infinite vanishing runway beyond Chapter 6 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -260]}>
            <planeGeometry args={[12, 480]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.22} />
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
  const skidCursorRef = useRef(0);
  const skidCooldownRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!skidMeshRef.current) {
      return;
    }
    dummy.position.set(0, -100, 0);
    dummy.scale.set(0.001, 0.001, 0.001);
    dummy.updateMatrix();
    for (let i = 0; i < MAX_SKID_SEGMENTS; i++) {
      skidMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    skidMeshRef.current.instanceMatrix.needsUpdate = true;
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

    // 1. Update Compass & Nearest Target Monument telemetry
    if (nextTargetChapter) {
      const dist = distance2D(px, pz, nextTargetChapter.position.x, nextTargetChapter.position.z);
      gameRuntime.nearestMonumentId = nextTargetChapter.id;
      gameRuntime.nearestMonumentDistance = dist;

      const worldAngleToTarget = Math.atan2(
        nextTargetChapter.position.x - px,
        -(nextTargetChapter.position.z - pz)
      );
      gameRuntime.compassAngle = normalizeAngle(worldAngleToTarget + gameRuntime.heading);

      // Unlock monument sequentially when driving through it
      if (dist < 14.5) {
        engineAudio.playChapterUnlock();
        unlockChapter(nextTargetChapter.id);
      }
    } else {
      gameRuntime.nearestMonumentId = null;
      gameRuntime.nearestMonumentDistance = 0;
    }

    // 2. Dynamic Tire Skidmarks during drift / handbrake (capped ring buffer)
    if (skidMeshRef.current && (gameRuntime.drift > 0.25 || gameRuntime.handbrake) && Math.abs(gameRuntime.speed) > 30) {
      skidCooldownRef.current -= dt;
      if (skidCooldownRef.current <= 0) {
        skidCooldownRef.current = 0.025;
        const cosH = Math.cos(gameRuntime.heading);
        const sinH = Math.sin(gameRuntime.heading);

        for (const wheelSide of [-0.96, 0.96] as const) {
          const idx = skidCursorRef.current % MAX_SKID_SEGMENTS;
          skidCursorRef.current += 1;

          const wx = px + wheelSide * cosH + sinH * 1.48;
          const wz = pz - wheelSide * sinH + cosH * 1.48;

          dummy.position.set(wx, 0.025, wz);
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
      {/* Vast Panoramic Golden Arena Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -3900]} receiveShadow>
        <planeGeometry args={[1200, 1700]} />
        <meshStandardMaterial color="#141418" roughness={0.78} metalness={0.2} />
      </mesh>

      {/* Architectural Concentric Arena Rings */}
      {[120, 260, 420].map((radius) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3850]}>
          <ringGeometry args={[radius - 0.6, radius, 72]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.18} />
        </mesh>
      ))}

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
