import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CORRIDOR_END_Z,
  CORRIDOR_HALF_WIDTH,
  PORTAL_Z_POSITIONS,
  STAGES,
} from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import {
  createAsphaltTextureSet,
  createBrakeBoardTexture,
  createGrassTextureSet,
  createRetroSponsorTexture,
  createStartingGridTexture,
} from '../../utils/proceduralTextures';
import { gameRuntime } from '../../utils/runtime';
import { PortalGate } from './PortalGate';

function createAsphaltTextTexture(line1: string, line2: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(156, 150);
    ctx.lineTo(256, 56);
    ctx.lineTo(356, 150);
    ctx.stroke();

    ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(line1, 256, 260);

    ctx.fillStyle = 'rgba(250, 204, 21, 0.95)';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(line2, 256, 315);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createHorizonThresholdTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MODO MUNDO ABERTO // Z = -950M', 512, 92);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText('A TRAJETÓRIA DE AYRTON SENNA', 512, 178);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function CorridorTrack() {
  const mode = useGameStore((state) => state.mode);
  const completedStages = useGameStore((state) => state.completedStages);
  const enterOpenWorld = useGameStore((state) => state.enterOpenWorld);

  const dashMeshRef = useRef<THREE.InstancedMesh>(null);
  const pylonLeftRef = useRef<THREE.InstancedMesh>(null);
  const pylonRightRef = useRef<THREE.InstancedMesh>(null);
  const lampHeadRef = useRef<THREE.InstancedMesh>(null);
  const railPostRef = useRef<THREE.InstancedMesh>(null);
  const tireStackRef = useRef<THREE.InstancedMesh>(null);
  const bgHillRef = useRef<THREE.InstancedMesh>(null);
  const crossedEndRef = useRef(false);

  const asphaltSet = useMemo(() => createAsphaltTextureSet(true, 2, 36), []);
  const grassSet = useMemo(() => createGrassTextureSet(36, 48), []);
  const gridTex = useMemo(() => createStartingGridTexture(), []);
  const asphaltSignTexture = useMemo(
    () => createAsphaltTextTexture('SIGA EM FRENTE', 'A TRAJETÓRIA'),
    []
  );
  const thresholdTexture = useMemo(() => createHorizonThresholdTexture(), []);
  const sponsorTextures = useMemo(
    () => [0, 1, 2, 3].map((idx) => createRetroSponsorTexture(idx)),
    []
  );
  const brake50Tex = useMemo(() => createBrakeBoardTexture('50M'), []);

  useEffect(() => {
    return () => {
      asphaltSet.map.dispose();
      asphaltSet.roughnessMap.dispose();
      asphaltSet.bumpMap.dispose();
      grassSet.map.dispose();
      grassSet.bumpMap.dispose();
      gridTex.dispose();
      asphaltSignTexture.dispose();
      thresholdTexture.dispose();
      brake50Tex.dispose();
      sponsorTextures.forEach((t) => t.dispose());
    };
  }, [
    asphaltSet,
    asphaltSignTexture,
    brake50Tex,
    grassSet,
    gridTex,
    sponsorTextures,
    thresholdTexture,
  ]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    if (dashMeshRef.current) {
      for (let i = 0; i < 42; i++) {
        dummy.position.set(0, 0.014, -i * 23 - 12);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dashMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      dashMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (pylonLeftRef.current && pylonRightRef.current && lampHeadRef.current) {
      for (let i = 0; i < 12; i++) {
        const z = -i * 80 - 40;
        dummy.position.set(-18.5, 4.5, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pylonLeftRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(18.5, 4.5, z);
        dummy.updateMatrix();
        pylonRightRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(-17.8, 8.9, z);
        dummy.updateMatrix();
        lampHeadRef.current.setMatrixAt(i * 2, dummy.matrix);

        dummy.position.set(17.8, 8.9, z);
        dummy.updateMatrix();
        lampHeadRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);
      }
      pylonLeftRef.current.instanceMatrix.needsUpdate = true;
      pylonRightRef.current.instanceMatrix.needsUpdate = true;
      lampHeadRef.current.instanceMatrix.needsUpdate = true;
    }

    // Guard-rail vertical metal posts
    if (railPostRef.current) {
      let idx = 0;
      for (let z = 30; z >= -940; z -= 16) {
        for (const side of [-1, 1] as const) {
          if (idx >= 130) break;
          dummy.position.set(side * (CORRIDOR_HALF_WIDTH + 0.9), 0.55, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          railPostRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      railPostRef.current.count = idx;
      railPostRef.current.instanceMatrix.needsUpdate = true;
    }

    // Stacked tire barriers near portal bays
    if (tireStackRef.current) {
      let idx = 0;
      for (const stage of STAGES) {
        const s = stage.portalSide === 'left' ? -1 : 1;
        for (const offsetZ of [-22, 22]) {
          for (let h = 0; h < 2; h++) {
            dummy.position.set(s * 15.8, 0.38 + h * 0.55, stage.portalZ + offsetZ);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            tireStackRef.current.setMatrixAt(idx, dummy.matrix);
            color.set((idx + h) % 2 === 0 ? '#ef4444' : '#f8fafc');
            tireStackRef.current.setColorAt(idx, color);
            idx += 1;
          }
        }
      }
      tireStackRef.current.instanceMatrix.needsUpdate = true;
      if (tireStackRef.current.instanceColor) {
        tireStackRef.current.instanceColor.needsUpdate = true;
      }
    }

    // Horizon closing hills along corridor sides
    if (bgHillRef.current) {
      for (let i = 0; i < 32; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const z = -(Math.floor(i / 2) * 75) + 80;
        const radius = 58 + (i % 4) * 18;
        const height = 28 + (i % 5) * 14;
        dummy.position.set(side * (160 + (i % 3) * 45), height * 0.45, z);
        dummy.rotation.set(0, i * 0.5, 0);
        dummy.scale.set(radius, height, radius);
        dummy.updateMatrix();
        bgHillRef.current.setMatrixAt(i, dummy.matrix);
      }
      bgHillRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [mode]);

  useFrame(() => {
    if (mode !== 'corridor') {
      crossedEndRef.current = false;
      return;
    }
    if (
      !crossedEndRef.current &&
      gameRuntime.previousPosition.z > CORRIDOR_END_Z &&
      gameRuntime.position.z <= CORRIDOR_END_Z
    ) {
      crossedEndRef.current = true;
      enterOpenWorld();
    }
  });

  const barrierSegments = useMemo(() => {
    const segments: Array<{ side: -1 | 1; zStart: number; zEnd: number }> = [];
    for (const side of [-1, 1] as const) {
      const sidePortals = STAGES.filter(
        (s) => (s.portalSide === 'left' ? -1 : 1) === side
      ).map((s) => s.portalZ);

      let cursor = 40;
      for (const pz of sidePortals) {
        const openStart = pz + 22;
        const openEnd = pz - 22;
        if (cursor > openStart) {
          segments.push({ side, zStart: cursor, zEnd: openStart });
        }
        cursor = openEnd;
      }
      if (cursor > CORRIDOR_END_Z) {
        segments.push({ side, zStart: cursor, zEnd: CORRIDOR_END_Z });
      }
    }
    return segments;
  }, []);

  if (mode !== 'landing' && mode !== 'corridor') {
    return null;
  }

  const roadSignsZ = [-42, -150, -270, -390, -510, -630, -750, -870];

  return (
    <group>
      {/* Layer 3: Vast Turf Ground closing the horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -500]} receiveShadow>
        <planeGeometry args={[1800, 1800]} />
        <meshStandardMaterial
          map={grassSet.map}
          bumpMap={grassSet.bumpMap}
          bumpScale={0.04}
          roughness={0.92}
        />
      </mesh>

      {/* Layer 3: Horizon Hills */}
      <instancedMesh ref={bgHillRef} args={[undefined, undefined, 32]}>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </instancedMesh>

      {/* Main Corridor Asphalt with Puddles & Micro-Bump */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -480]} receiveShadow>
        <planeGeometry args={[CORRIDOR_HALF_WIDTH * 2, 1060]} />
        <meshStandardMaterial
          map={asphaltSet.map}
          roughnessMap={asphaltSet.roughnessMap}
          bumpMap={asphaltSet.bumpMap}
          bumpScale={0.03}
          roughness={0.85}
          metalness={0.22}
        />
      </mesh>

      {/* Starting Grid Boxes at Z = -10 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -10]}>
        <planeGeometry args={[20, 26]} />
        <meshBasicMaterial map={gridTex} transparent opacity={0.85} />
      </mesh>

      {/* Pit Lane Yellow Edge Stripe + White Track Edge Lines */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`line-${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * (CORRIDOR_HALF_WIDTH - 0.5), 0.01, -480]}
        >
          <planeGeometry args={[0.35, 1060]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.2, 0.01, -480]}>
        <planeGeometry args={[0.24, 1060]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.55} />
      </mesh>

      {/* Dashed Center Lane Markings (Instanced) */}
      <instancedMesh ref={dashMeshRef} args={[undefined, undefined, 42]}>
        <planeGeometry args={[0.28, 9]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.62} />
      </instancedMesh>

      {/* Layer 2: Trackside Floodlight Pylons + Emissive Lamps */}
      <instancedMesh ref={pylonLeftRef} args={[undefined, undefined, 12]}>
        <boxGeometry args={[0.45, 9, 0.45]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={pylonRightRef} args={[undefined, undefined, 12]}>
        <boxGeometry args={[0.45, 9, 0.45]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lampHeadRef} args={[undefined, undefined, 24]}>
        <boxGeometry args={[1.4, 0.35, 0.7]} />
        <meshBasicMaterial color={[2.5, 2.2, 1.4]} toneMapped={false} />
      </instancedMesh>

      {/* Layer 1: Guard-rails + Vertical Metal Posts + Tire Stacks */}
      {barrierSegments.map((seg, idx) => {
        const length = Math.abs(seg.zStart - seg.zEnd);
        const centerZ = (seg.zStart + seg.zEnd) / 2;
        return (
          <mesh
            key={`barrier-${idx}`}
            position={[seg.side * (CORRIDOR_HALF_WIDTH + 0.8), 0.55, centerZ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.35, 0.72, length]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.35} metalness={0.75} />
          </mesh>
        );
      })}
      <instancedMesh ref={railPostRef} args={[undefined, undefined, 130]}>
        <boxGeometry args={[0.22, 1.1, 0.22]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={tireStackRef} args={[undefined, undefined, 28]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.52, 14]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>

      {/* Layer 1: Retro Sponsor Hoardings & 50m Approach Boards before Portals */}
      {STAGES.map((stage, idx) => {
        const s = stage.portalSide === 'left' ? -1 : 1;
        return (
          <group key={`trackside-${stage.id}`}>
            <mesh
              position={[s * -16.5, 1.4, stage.portalZ + 32]}
              rotation={[0, s * -0.15, 0]}
            >
              <planeGeometry args={[7.2, 1.8]} />
              <meshBasicMaterial map={sponsorTextures[idx % sponsorTextures.length]} />
            </mesh>
            <mesh position={[s * 14.2, 1.3, stage.portalZ + 50]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake50Tex} />
            </mesh>
          </group>
        );
      })}

      {/* Center Lane Asphalt Signs: SIGA EM FRENTE — A TRAJETÓRIA */}
      {roadSignsZ.map((zPos) => (
        <mesh
          key={`sign-${zPos}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.015, zPos]}
        >
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial map={asphaltSignTexture} transparent />
        </mesh>
      ))}

      {/* 7 Lateral Optional Portals */}
      {PORTAL_Z_POSITIONS.map((_, idx) => {
        const stage = STAGES[idx];
        if (!stage) return null;
        return (
          <PortalGate
            key={stage.id}
            stage={stage}
            completed={completedStages.includes(stage.id)}
          />
        );
      })}

      {/* Grand Horizon Arch at Z = -950 leading into Open World */}
      <group position={[0, 0, CORRIDOR_END_Z]}>
        <mesh position={[-15.5, 6, 0]}>
          <boxGeometry args={[1.4, 12, 1.8]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[15.5, 6, 0]}>
          <boxGeometry args={[1.4, 12, 1.8]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 11.6, 0]}>
          <boxGeometry args={[32.5, 1.6, 2]} />
          <meshStandardMaterial color="#09090b" roughness={0.35} metalness={0.65} />
        </mesh>
        <mesh position={[0, 8.6, 1.05]}>
          <planeGeometry args={[21, 5.2]} />
          <meshBasicMaterial map={thresholdTexture} />
        </mesh>
      </group>
    </group>
  );
}
