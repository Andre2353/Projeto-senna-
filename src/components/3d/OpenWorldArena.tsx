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
import {
  createAsphaltTextureSet,
  createGrassTextureSet,
  createRetroSponsorTexture,
} from '../../utils/proceduralTextures';
import { gameRuntime } from '../../utils/runtime';

const MAX_SKID_SEGMENTS = 360;
const KERB_COUNT = 120;
const MOUNTAIN_COUNT = 32;
const TREE_COUNT = 96;
const GRANDSTAND_COUNT = 14;
const POLE_COUNT = 28;

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
  texture.colorSpace = THREE.SRGBColorSpace;
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[12.8, 14.6, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={isTarget ? 0.92 : 0.55} />
      </mesh>

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

      <Billboard position={[0, 12.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <planeGeometry args={[11, 4.1]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>
      </Billboard>

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
            <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.82} />
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
              <meshPhysicalMaterial
                color="#facc15"
                roughness={0.14}
                metalness={0.25}
                clearcoat={1.0}
              />
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
              <meshStandardMaterial color="#09090b" roughness={0.08} metalness={0.92} />
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
  const grandstandRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const skidCursorRef = useRef(0);
  const skidCooldownRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const grassSet = useMemo(() => createGrassTextureSet(56, 64), []);
  const asphaltSet = useMemo(() => createAsphaltTextureSet(false, 12, 12), []);
  const sponsorTex0 = useMemo(() => createRetroSponsorTexture(0), []);
  const sponsorTex1 = useMemo(() => createRetroSponsorTexture(2), []);

  useEffect(() => {
    return () => {
      grassSet.map.dispose();
      grassSet.bumpMap.dispose();
      asphaltSet.map.dispose();
      asphaltSet.roughnessMap.dispose();
      asphaltSet.bumpMap.dispose();
      sponsorTex0.dispose();
      sponsorTex1.dispose();
    };
  }, [asphaltSet, grassSet, sponsorTex0, sponsorTex1]);

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

    // Layer 2: Covered Grandstands & Lighting Poles along the oval circuit
    if (grandstandRef.current && canopyRef.current) {
      for (let i = 0; i < GRANDSTAND_COUNT; i++) {
        const angle = (i / GRANDSTAND_COUNT) * Math.PI * 2 + 0.18;
        const gx = Math.cos(angle) * 218;
        const gz = -1500 + Math.sin(angle) * 440;
        dummy.position.set(gx, 4.2, gz);
        dummy.rotation.set(0, -angle + Math.PI / 2, 0);
        dummy.scale.set(28, 8.4, 10);
        dummy.updateMatrix();
        grandstandRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(gx, 9.2, gz);
        dummy.scale.set(29, 0.7, 13);
        dummy.updateMatrix();
        canopyRef.current.setMatrixAt(i, dummy.matrix);
      }
      grandstandRef.current.instanceMatrix.needsUpdate = true;
      canopyRef.current.instanceMatrix.needsUpdate = true;
    }

    if (poleRef.current) {
      for (let i = 0; i < POLE_COUNT; i++) {
        const angle = (i / POLE_COUNT) * Math.PI * 2;
        dummy.position.set(Math.cos(angle) * 198, 5, -1500 + Math.sin(angle) * 412);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poleRef.current.setMatrixAt(i, dummy.matrix);
      }
      poleRef.current.instanceMatrix.needsUpdate = true;
    }

    // Layer 3: Encircling Low-Poly Horizon Mountains closing 100% of perimeter
    if (mountainMeshRef.current) {
      for (let i = 0; i < MOUNTAIN_COUNT; i++) {
        const angle = (i / MOUNTAIN_COUNT) * Math.PI * 2;
        const dist = 540 + (i % 3) * 50;
        const height = 85 + ((i * 19) % 80);
        const radius = 85 + ((i * 13) % 45);
        dummy.position.set(
          Math.cos(angle) * dist,
          height * 0.48,
          -1500 + Math.sin(angle) * (dist * 1.25)
        );
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(radius, height, radius);
        dummy.updateMatrix();
        mountainMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      mountainMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (treeTrunkRef.current && treeCrownRef.current) {
      for (let i = 0; i < TREE_COUNT; i++) {
        const angle = (i / TREE_COUNT) * Math.PI * 2 + (i % 5) * 0.03;
        const distX = 248 + (i % 7) * 28;
        const distZ = 485 + (i % 6) * 45;
        const tx = Math.cos(angle) * distX;
        const tz = -1500 + Math.sin(angle) * distZ;
        const scale = 0.9 + (i % 4) * 0.28;

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

        for (const wheelSide of [-0.99, 0.99] as const) {
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
      {/* Layer 3: Wide Vibrant Autodrome Turf closing horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -1550]} receiveShadow>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial
          map={grassSet.map}
          bumpMap={grassSet.bumpMap}
          bumpScale={0.04}
          roughness={0.88}
        />
      </mesh>

      {/* Entry Runway Asphalt connecting Z = -950 into the Arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1420]} receiveShadow>
        <planeGeometry args={[28, 1020]} />
        <meshStandardMaterial
          map={asphaltSet.map}
          roughnessMap={asphaltSet.roughnessMap}
          bumpMap={asphaltSet.bumpMap}
          bumpScale={0.03}
          roughness={0.82}
        />
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
        <meshStandardMaterial
          map={asphaltSet.map}
          roughnessMap={asphaltSet.roughnessMap}
          bumpMap={asphaltSet.bumpMap}
          bumpScale={0.03}
          roughness={0.8}
        />
      </mesh>

      {/* Segmented Red/White Kerbs */}
      <instancedMesh ref={kerbMeshRef} args={[undefined, undefined, KERB_COUNT]}>
        <boxGeometry args={[2.2, 0.06, 8.5]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>

      {/* Retro Entry Hoardings */}
      <mesh position={[-18, 2.2, -1040]} rotation={[0, 0.35, 0]}>
        <planeGeometry args={[9, 2.2]} />
        <meshBasicMaterial map={sponsorTex0} />
      </mesh>
      <mesh position={[18, 2.2, -1040]} rotation={[0, -0.35, 0]}>
        <planeGeometry args={[9, 2.2]} />
        <meshBasicMaterial map={sponsorTex1} />
      </mesh>

      {/* Layer 2: Covered Grandstands & Floodlight Poles */}
      <instancedMesh ref={grandstandRef} args={[undefined, undefined, GRANDSTAND_COUNT]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial color="#334155" gradientMap={gradientMap} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, GRANDSTAND_COUNT]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={poleRef} args={[undefined, undefined, POLE_COUNT]}>
        <boxGeometry args={[0.4, 10, 0.4]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.65} />
      </instancedMesh>

      {/* Layer 3: Low-Poly Horizon Mountains & Trees */}
      <instancedMesh ref={mountainMeshRef} args={[undefined, undefined, MOUNTAIN_COUNT]}>
        <coneGeometry args={[1, 1, 6]} />
        <meshToonMaterial color="#312e81" gradientMap={gradientMap} />
      </instancedMesh>
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
