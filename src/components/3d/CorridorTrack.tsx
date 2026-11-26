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
import { gameRuntime } from '../../utils/runtime';
import { PortalGate } from './PortalGate';

function createAsphaltTextTexture(line1: string, line2: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Directional chevron
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(156, 150);
    ctx.lineTo(256, 56);
    ctx.lineTo(356, 150);
    ctx.stroke();

    ctx.fillStyle = 'rgba(248, 250, 252, 0.82)';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(line1, 256, 260);

    ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(line2, 256, 315);
  }

  const texture = new THREE.CanvasTexture(canvas);
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
    ctx.fillText('MODO MUNDO ABERTO // Z = -3250M', 512, 92);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText('A TRAJETÓRIA DE AYRTON SENNA', 512, 178);
  }

  const texture = new THREE.CanvasTexture(canvas);
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
  const crossedEndRef = useRef(false);

  const asphaltSignTexture = useMemo(
    () => createAsphaltTextTexture('SIGA EM FRENTE', 'A TRAJETÓRIA'),
    []
  );
  const thresholdTexture = useMemo(() => createHorizonThresholdTexture(), []);

  useEffect(() => {
    return () => {
      asphaltSignTexture.dispose();
      thresholdTexture.dispose();
    };
  }, [asphaltSignTexture, thresholdTexture]);

  // Populate instanced center dashed markings and lateral light pylons
  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (dashMeshRef.current) {
      const count = 130;
      for (let i = 0; i < count; i++) {
        dummy.position.set(0, 0.012, -i * 25 - 12);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        dashMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      dashMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    const pylonCount = 32;
    if (pylonLeftRef.current && pylonRightRef.current) {
      for (let i = 0; i < pylonCount; i++) {
        const z = -i * 100 - 50;
        dummy.position.set(-18.5, 4.5, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        pylonLeftRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(18.5, 4.5, z);
        dummy.updateMatrix();
        pylonRightRef.current.setMatrixAt(i, dummy.matrix);
      }
      pylonLeftRef.current.instanceMatrix.needsUpdate = true;
      pylonRightRef.current.instanceMatrix.needsUpdate = true;
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

  // Build barrier segments leaving openings at portal bays
  const barrierSegments = useMemo(() => {
    const segments: Array<{ side: -1 | 1; zStart: number; zEnd: number }> = [];
    for (const side of [-1, 1] as const) {
      const sidePortals = STAGES.filter(
        (s) => (s.portalSide === 'left' ? -1 : 1) === side
      ).map((s) => s.portalZ);

      let cursor = 40;
      for (const pz of sidePortals) {
        const openStart = pz + 34;
        const openEnd = pz - 34;
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

  const roadSignsZ = [-95, -580, -1030, -1480, -1930, -2380, -2830];

  return (
    <group>
      {/* Surrounding dark desert/tarmac apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -1625]} receiveShadow>
        <planeGeometry args={[900, 3600]} />
        <meshStandardMaterial color="#09090b" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Main Corridor Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1625]} receiveShadow>
        <planeGeometry args={[CORRIDOR_HALF_WIDTH * 2, 3400]} />
        <meshStandardMaterial color="#18181b" roughness={0.62} metalness={0.22} />
      </mesh>

      {/* White Track Edge Lines */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`line-${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * (CORRIDOR_HALF_WIDTH - 0.5), 0.01, -1625]}
        >
          <planeGeometry args={[0.35, 3400]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
      ))}

      {/* Dashed Center Lane Markings (Instanced) */}
      <instancedMesh ref={dashMeshRef} args={[undefined, undefined, 130]}>
        <planeGeometry args={[0.28, 10]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.45} />
      </instancedMesh>

      {/* Trackside Light Pylons (Instanced) */}
      <instancedMesh ref={pylonLeftRef} args={[undefined, undefined, 32]}>
        <boxGeometry args={[0.45, 9, 0.45]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={pylonRightRef} args={[undefined, undefined, 32]}>
        <boxGeometry args={[0.45, 9, 0.45]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.6} />
      </instancedMesh>

      {/* Guard-rails with clean openings at portal bays */}
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
            <boxGeometry args={[0.45, 1.1, length]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.4} metalness={0.65} />
          </mesh>
        );
      })}

      {/* Center Lane Asphalt Signs: SIGA EM FRENTE — A TRAJETÓRIA */}
      {roadSignsZ.map((zPos) => (
        <mesh
          key={`sign-${zPos}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.015, zPos]}
        >
          <planeGeometry args={[10.5, 10.5]} />
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

      {/* Grand Horizon Arch at Z = -3250 leading into Open World */}
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
