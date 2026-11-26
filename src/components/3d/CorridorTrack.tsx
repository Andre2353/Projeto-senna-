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
  createGravelTexture,
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

    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
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
  const kerbLeftRef = useRef<THREE.InstancedMesh>(null);
  const kerbRightRef = useRef<THREE.InstancedMesh>(null);
  const pylonLeftRef = useRef<THREE.InstancedMesh>(null);
  const pylonRightRef = useRef<THREE.InstancedMesh>(null);
  const lampHeadRef = useRef<THREE.InstancedMesh>(null);
  const railPostRef = useRef<THREE.InstancedMesh>(null);
  const tireStackRef = useRef<THREE.InstancedMesh>(null);
  const standBaseRef = useRef<THREE.InstancedMesh>(null);
  const standRoofRef = useRef<THREE.InstancedMesh>(null);
  const crowdRef = useRef<THREE.InstancedMesh>(null);
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeCanopyRef = useRef<THREE.InstancedMesh>(null);
  const bgHillRef = useRef<THREE.InstancedMesh>(null);
  const crossedEndRef = useRef(false);

  const asphaltSet = useMemo(() => createAsphaltTextureSet(false, 2, 42), []);
  const grassSet = useMemo(() => createGrassTextureSet(38, 52), []);
  const gravelTex = useMemo(() => createGravelTexture(3, 42), []);
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
  const brake150Tex = useMemo(() => createBrakeBoardTexture('150M'), []);
  const brake100Tex = useMemo(() => createBrakeBoardTexture('100M'), []);
  const brake50Tex = useMemo(() => createBrakeBoardTexture('50M'), []);

  useEffect(() => {
    return () => {
      asphaltSet.map.dispose();
      asphaltSet.roughnessMap.dispose();
      asphaltSet.bumpMap.dispose();
      grassSet.map.dispose();
      grassSet.bumpMap.dispose();
      gravelTex.dispose();
      gridTex.dispose();
      asphaltSignTexture.dispose();
      thresholdTexture.dispose();
      brake150Tex.dispose();
      brake100Tex.dispose();
      brake50Tex.dispose();
      sponsorTextures.forEach((t) => t.dispose());
    };
  }, [
    asphaltSet,
    asphaltSignTexture,
    brake100Tex,
    brake150Tex,
    brake50Tex,
    grassSet,
    gravelTex,
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

    // Layer 1: Raised 3D Kerbs (red/white) along both edges (skip portal bay openings)
    if (kerbLeftRef.current && kerbRightRef.current) {
      let lIdx = 0;
      let rIdx = 0;
      for (let k = 0; k < 100; k++) {
        const z = 40 - k * 10;
        const nearLeftPortal = STAGES.some((s) => s.portalSide === 'left' && Math.abs(z - s.portalZ) < 25);
        const nearRightPortal = STAGES.some((s) => s.portalSide === 'right' && Math.abs(z - s.portalZ) < 25);

        color.set(k % 2 === 0 ? '#ef4444' : '#f8fafc');

        if (!nearLeftPortal && lIdx < 100) {
          dummy.position.set(-13.1, 0.03, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          kerbLeftRef.current.setMatrixAt(lIdx, dummy.matrix);
          kerbLeftRef.current.setColorAt(lIdx, color);
          lIdx += 1;
        }
        if (!nearRightPortal && !(z <= 25 && z >= -150) && rIdx < 100) {
          dummy.position.set(13.1, 0.03, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          kerbRightRef.current.setMatrixAt(rIdx, dummy.matrix);
          kerbRightRef.current.setColorAt(rIdx, color);
          rIdx += 1;
        }
      }
      kerbLeftRef.current.count = lIdx;
      kerbRightRef.current.count = rIdx;
      kerbLeftRef.current.instanceMatrix.needsUpdate = true;
      kerbRightRef.current.instanceMatrix.needsUpdate = true;
      if (kerbLeftRef.current.instanceColor) kerbLeftRef.current.instanceColor.needsUpdate = true;
      if (kerbRightRef.current.instanceColor) kerbRightRef.current.instanceColor.needsUpdate = true;
    }

    // Floodlight Pylons & Lamps
    if (pylonLeftRef.current && pylonRightRef.current && lampHeadRef.current) {
      for (let i = 0; i < 12; i++) {
        const z = -i * 80 - 40;
        dummy.position.set(-22, 4.8, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pylonLeftRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(22, 4.8, z);
        dummy.updateMatrix();
        pylonRightRef.current.setMatrixAt(i, dummy.matrix);

        dummy.position.set(-21.2, 9.5, z);
        dummy.updateMatrix();
        lampHeadRef.current.setMatrixAt(i * 2, dummy.matrix);

        dummy.position.set(21.2, 9.5, z);
        dummy.updateMatrix();
        lampHeadRef.current.setMatrixAt(i * 2 + 1, dummy.matrix);
      }
      pylonLeftRef.current.instanceMatrix.needsUpdate = true;
      pylonRightRef.current.instanceMatrix.needsUpdate = true;
      lampHeadRef.current.instanceMatrix.needsUpdate = true;
    }

    // Guard-rail Metal Posts
    if (railPostRef.current) {
      let idx = 0;
      for (let z = 36; z >= -944; z -= 14) {
        for (const side of [-1, 1] as const) {
          if (idx >= 150) break;
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

    // Stacked Tire Barriers along Track & Portal Bays
    if (tireStackRef.current) {
      let idx = 0;
      for (const stage of STAGES) {
        const s = stage.portalSide === 'left' ? -1 : 1;
        for (const offsetZ of [-22, 22]) {
          for (let h = 0; h < 2; h++) {
            dummy.position.set(s * 16.0, 0.36 + h * 0.5, stage.portalZ + offsetZ);
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
      tireStackRef.current.count = idx;
      tireStackRef.current.instanceMatrix.needsUpdate = true;
      if (tireStackRef.current.instanceColor) {
        tireStackRef.current.instanceColor.needsUpdate = true;
      }
    }

    // Layer 2: Covered Grandstands (18m..65m) & Multicolored Crowd Spectators (InstancedMesh)
    if (standBaseRef.current && standRoofRef.current && crowdRef.current) {
      const standZList = [-36, -155, -270, -390, -510, -630, -750, -870];
      let sIdx = 0;
      let cIdx = 0;
      const crowdPalette = ['#facc15', '#ef4444', '#f8fafc', '#38bdf8', '#16a34a', '#fb923c'];

      for (let i = 0; i < standZList.length; i++) {
        const z = standZList[i]!;
        for (const side of [-1, 1] as const) {
          // Keep initial right side free for Pit Lane & Team Garages
          if (side === 1 && z > -160) continue;

          const sx = side * 34;
          dummy.position.set(sx, 3.8, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(11, 7.6, 36);
          dummy.updateMatrix();
          standBaseRef.current.setMatrixAt(sIdx, dummy.matrix);

          dummy.position.set(sx - side * 1.4, 8.6, z);
          dummy.rotation.set(0, 0, side * 0.14);
          dummy.scale.set(13.5, 0.55, 37);
          dummy.updateMatrix();
          standRoofRef.current.setMatrixAt(sIdx, dummy.matrix);
          sIdx += 1;

          // Populate 32 spectator figures on grandstand tiers
          for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 8; col++) {
              if (cIdx >= 500) break;
              const cz = z - 15 + col * 4.2 + (row % 2) * 0.8;
              const cx = sx - side * (5.2 - row * 1.45);
              const cy = 2.6 + row * 1.35;
              dummy.position.set(cx, cy, cz);
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(0.7, 1.05, 0.7);
              dummy.updateMatrix();
              crowdRef.current.setMatrixAt(cIdx, dummy.matrix);
              color.set(crowdPalette[(cIdx + row + col) % crowdPalette.length]!);
              crowdRef.current.setColorAt(cIdx, color);
              cIdx += 1;
            }
          }
        }
      }
      standBaseRef.current.count = sIdx;
      standRoofRef.current.count = sIdx;
      crowdRef.current.count = cIdx;
      standBaseRef.current.instanceMatrix.needsUpdate = true;
      standRoofRef.current.instanceMatrix.needsUpdate = true;
      crowdRef.current.instanceMatrix.needsUpdate = true;
      if (crowdRef.current.instanceColor) crowdRef.current.instanceColor.needsUpdate = true;
    }

    // Layer 3: Varied Autodrome Woods & Rolling Hills closing the horizon completely
    if (treeTrunkRef.current && treeCanopyRef.current) {
      let idx = 0;
      const treeColors = ['#15803d', '#166534', '#16a34a', '#14532d'];
      for (let z = 60; z >= -1020; z -= 24) {
        for (const side of [-1, 1] as const) {
          for (let row = 0; row < 2; row++) {
            if (idx >= 180) break;
            const x = side * (62 + row * 22 + ((idx * 7) % 14));
            const s = 0.85 + (idx % 4) * 0.35;
            dummy.position.set(x, 2.0 * s, z + (row % 2) * 8);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            treeTrunkRef.current.setMatrixAt(idx, dummy.matrix);

            dummy.position.set(x, 5.6 * s, z + (row % 2) * 8);
            dummy.scale.set(s * 1.15, s * 1.25, s * 1.15);
            dummy.updateMatrix();
            treeCanopyRef.current.setMatrixAt(idx, dummy.matrix);
            color.set(treeColors[idx % treeColors.length]!);
            treeCanopyRef.current.setColorAt(idx, color);
            idx += 1;
          }
        }
      }
      treeTrunkRef.current.count = idx;
      treeCanopyRef.current.count = idx;
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeCanopyRef.current.instanceMatrix.needsUpdate = true;
      if (treeCanopyRef.current.instanceColor) treeCanopyRef.current.instanceColor.needsUpdate = true;
    }

    if (bgHillRef.current) {
      for (let i = 0; i < 36; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const z = -(Math.floor(i / 2) * 68) + 80;
        const radius = 64 + (i % 4) * 20;
        const height = 26 + (i % 5) * 14;
        dummy.position.set(side * (165 + (i % 3) * 44), height * 0.42, z);
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
        const openStart = pz + 24;
        const openEnd = pz - 24;
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
  const bridgePositionsZ = [-155, -405, -645];
  const garageColors = ['#ef4444', '#1d4ed8', '#eab308', '#16a34a', '#e2e8f0'];

  return (
    <group>
      {/* Layer 3: Vast Cut-Grass Autodrome Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -500]} receiveShadow>
        <planeGeometry args={[1800, 1800]} />
        <meshStandardMaterial
          map={grassSet.map}
          bumpMap={grassSet.bumpMap}
          bumpScale={0.04}
          roughness={0.92}
        />
      </mesh>

      {/* Layer 3: Rolling Green Horizon Hills + Autodrome Woods */}
      <instancedMesh ref={bgHillRef} args={[undefined, undefined, 36]}>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, 180]}>
        <cylinderGeometry args={[0.35, 0.5, 4.0, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={treeCanopyRef} args={[undefined, undefined, 180]}>
        <dodecahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>

      {/* Layer 1: Warm Gravel Runoff Traps along Track Edges */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`gravel-${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * 19.5, -0.025, -540]}
          receiveShadow
        >
          <planeGeometry args={[7, 820]} />
          <meshStandardMaterial map={gravelTex} roughness={0.95} />
        </mesh>
      ))}

      {/* Main Corridor Racing Asphalt (map + roughnessMap + bumpMap) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -480]} receiveShadow>
        <planeGeometry args={[CORRIDOR_HALF_WIDTH * 2, 1080]} />
        <meshStandardMaterial
          map={asphaltSet.map}
          roughnessMap={asphaltSet.roughnessMap}
          bumpMap={asphaltSet.bumpMap}
          bumpScale={0.03}
          roughness={0.85}
          metalness={0.14}
        />
      </mesh>

      {/* Starting Grid Boxes, Checkered Line & Pit Exit Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -10]}>
        <planeGeometry args={[22, 34]} />
        <meshBasicMaterial map={gridTex} transparent opacity={0.9} />
      </mesh>

      {/* Main Start/Finish Gantry with 5 F1 Starting Lights */}
      <group position={[0, 0, -8]}>
        <mesh position={[-15.2, 4.8, 0]} castShadow>
          <boxGeometry args={[0.9, 9.6, 1.1]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[15.2, 4.8, 0]} castShadow>
          <boxGeometry args={[0.9, 9.6, 1.1]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 8.9, 0]} castShadow>
          <boxGeometry args={[31.4, 1.5, 1.4]} />
          <meshStandardMaterial color="#09090b" roughness={0.35} metalness={0.65} />
        </mesh>
        <mesh position={[0, 8.9, 0.72]}>
          <planeGeometry args={[18, 1.2]} />
          <meshBasicMaterial map={sponsorTextures[0]} />
        </mesh>
        {/* Suspended 5-Light F1 Starting Pod */}
        <mesh position={[0, 7.2, 0]}>
          <boxGeometry args={[7.2, 1.1, 0.85]} />
          <meshStandardMaterial color="#09090b" roughness={0.4} metalness={0.7} />
        </mesh>
        {[-2.4, -1.2, 0, 1.2, 2.4].map((lx, idx) => (
          <mesh key={idx} position={[lx, 7.2, 0.45]}>
            <circleGeometry args={[0.3, 16]} />
            <meshStandardMaterial
              color="#7f1d1d"
              emissive="#ef4444"
              emissiveIntensity={0.65}
            />
          </mesh>
        ))}
      </group>

      {/* Layer 1: Pit Lane, Pit Wall Telemetry Booths, Garages & Race Control Tower (Right Side Initial Stretch) */}
      <group position={[0, 0, -65]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, 0.006, 0]} receiveShadow>
          <planeGeometry args={[11, 155]} />
          <meshStandardMaterial color="#1f2937" roughness={0.82} />
        </mesh>
        <mesh position={[14.7, 0.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.65, 1.3, 150]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
        </mesh>
        <mesh position={[14.7, 1.35, 0]}>
          <boxGeometry args={[0.72, 0.16, 150]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        {/* Team Garage Bays */}
        <mesh position={[28.5, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[9, 6.4, 145]} />
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
        <mesh position={[27.2, 6.6, 0]} castShadow>
          <boxGeometry args={[12, 0.6, 148]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.35} />
        </mesh>
        {garageColors.map((col, idx) => (
          <mesh key={col} position={[23.95, 2.4, -52 + idx * 26]}>
            <boxGeometry args={[0.2, 3.8, 20]} />
            <meshStandardMaterial color={col} roughness={0.5} />
          </mesh>
        ))}
        {/* Timing / Race Control Tower */}
        <group position={[29.5, 0, 42]}>
          <mesh position={[0, 11, 0]} castShadow>
            <boxGeometry args={[6.5, 22, 6.5]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.45} />
          </mesh>
          <mesh position={[0, 19.5, 0]}>
            <boxGeometry args={[7.2, 3.2, 7.2]} />
            <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, 22.8, 0]}>
            <boxGeometry args={[5.5, 1.4, 5.5]} />
            <meshStandardMaterial color="#dc2626" roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* Pit Lane Yellow Edge Stripe + White Track Borders + Center Guide */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`line-${side}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * (CORRIDOR_HALF_WIDTH - 0.5), 0.01, -480]}
        >
          <planeGeometry args={[0.35, 1080]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.2, 0.01, -480]}>
        <planeGeometry args={[0.24, 1080]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.55} />
      </mesh>
      <instancedMesh ref={dashMeshRef} args={[undefined, undefined, 42]}>
        <planeGeometry args={[0.28, 9]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.62} />
      </instancedMesh>

      {/* 3D Kerbs */}
      <instancedMesh ref={kerbLeftRef} args={[undefined, undefined, 100]}>
        <boxGeometry args={[1.3, 0.06, 9.8]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={kerbRightRef} args={[undefined, undefined, 100]}>
        <boxGeometry args={[1.3, 0.06, 9.8]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>

      {/* Layer 2: Covered Grandstands, Spectators & Floodlight Towers */}
      <instancedMesh ref={standBaseRef} args={[undefined, undefined, 20]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={standRoofRef} args={[undefined, undefined, 20]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={crowdRef} args={[undefined, undefined, 500]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={pylonLeftRef} args={[undefined, undefined, 12]}>
        <boxGeometry args={[0.45, 9.6, 0.45]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={pylonRightRef} args={[undefined, undefined, 12]}>
        <boxGeometry args={[0.45, 9.6, 0.45]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lampHeadRef} args={[undefined, undefined, 24]}>
        <boxGeometry args={[1.4, 0.35, 0.7]} />
        <meshBasicMaterial color={[2.5, 2.2, 1.4]} toneMapped={false} />
      </instancedMesh>

      {/* Layer 2: Overhead Crossover Bridges */}
      {bridgePositionsZ.map((bz, idx) => (
        <group key={bz} position={[0, 0, bz]}>
          <mesh position={[-16.5, 5.2, 0]} castShadow>
            <boxGeometry args={[2.0, 10.4, 6.2]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[16.5, 5.2, 0]} castShadow>
            <boxGeometry args={[2.0, 10.4, 6.2]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 9.8, 0]} castShadow>
            <boxGeometry args={[35, 2.2, 6.8]} />
            <meshStandardMaterial color="#18181b" roughness={0.55} />
          </mesh>
          <mesh position={[0, 9.8, 3.45]}>
            <planeGeometry args={[20, 2.0]} />
            <meshBasicMaterial map={sponsorTextures[(idx + 1) % sponsorTextures.length]} />
          </mesh>
        </group>
      ))}

      {/* Layer 1: Guard-rails + Posts + Tire Stacks */}
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
      <instancedMesh ref={railPostRef} args={[undefined, undefined, 150]}>
        <boxGeometry args={[0.22, 1.1, 0.22]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={tireStackRef} args={[undefined, undefined, 28]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.52, 14]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>

      {/* Trackside Braking Distance Boards (150m, 100m, 50m) & Sponsor Hoardings */}
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
            <mesh position={[s * 14.2, 1.3, stage.portalZ + 70]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake150Tex} />
            </mesh>
            <mesh position={[s * 14.2, 1.3, stage.portalZ + 55]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake100Tex} />
            </mesh>
            <mesh position={[s * 14.2, 1.3, stage.portalZ + 40]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake50Tex} />
            </mesh>
          </group>
        );
      })}

      {/* Center Lane Asphalt Signs */}
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

      {/* 7 Lateral Optional Circuit Portals */}
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
