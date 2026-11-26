import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { StageConfig } from '../../types/game';
import { engineAudio } from '../../utils/engineAudio';
import { getToonGradientMap } from '../../utils/performance';
import {
  createAsphaltTextureSet,
  createBrakeBoardTexture,
  createGrassTextureSet,
  createRetroSponsorTexture,
  createStartingGridTexture,
} from '../../utils/proceduralTextures';
import { buildRaceStandings, gameRuntime } from '../../utils/runtime';
import {
  createCurvedStripGeometry,
  createCurvedWallGeometry,
  getTrackHeading,
  getTrackOffsetX,
} from '../../utils/trackLayout';
import { OpponentCar } from './OpponentCar';

function createCheckeredBannerTexture(circuit: string, year: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const squareSize = 32;
    for (let y = 0; y < 256; y += squareSize) {
      for (let x = 0; x < 1024; x += squareSize) {
        const isWhite = (x / squareSize + y / squareSize) % 2 === 0;
        ctx.fillStyle = isWhite ? '#f8fafc' : '#09090b';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.fillRect(190, 54, 644, 148);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.strokeRect(190, 54, 644, 148);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LARGADA // CHEGADA', 512, 108);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`${circuit} ${year}`, 512, 166);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createBrazilFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(128, 18);
    ctx.lineTo(232, 80);
    ctx.lineTo(128, 142);
    ctx.lineTo(24, 80);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(128, 80, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function SuzukaFerrisWheel({ centerX }: { centerX: number }) {
  const wheelRef = useRef<THREE.Group>(null);
  const gradientMap = useMemo(() => getToonGradientMap(), []);

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += Math.min(delta, 0.05) * 0.14;
    }
  });

  const spokes = 12;

  return (
    <group position={[centerX - 82, 54, -760]}>
      <mesh position={[-16, -26, 0]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[2.6, 58, 2.6]} />
        <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[16, -26, 0]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[2.6, 58, 2.6]} />
        <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
      </mesh>

      <group ref={wheelRef}>
        <mesh>
          <torusGeometry args={[42, 1.3, 12, 48]} />
          <meshToonMaterial color="#f8fafc" gradientMap={gradientMap} />
        </mesh>
        <mesh>
          <torusGeometry args={[30, 0.7, 8, 36]} />
          <meshToonMaterial color="#ef4444" gradientMap={gradientMap} />
        </mesh>
        {Array.from({ length: spokes }).map((_, idx) => {
          const ang = (idx / spokes) * Math.PI * 2;
          return (
            <group key={idx} rotation={[0, 0, ang]}>
              <mesh>
                <boxGeometry args={[0.6, 84, 0.6]} />
                <meshToonMaterial color="#cbd5e1" gradientMap={gradientMap} />
              </mesh>
              <mesh position={[0, 42, 0]}>
                <boxGeometry args={[4.2, 4.8, 3.6]} />
                <meshToonMaterial
                  color={idx % 3 === 0 ? '#facc15' : idx % 3 === 1 ? '#ef4444' : '#38bdf8'}
                  gradientMap={gradientMap}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function CircuitScenery({ stage }: { stage: StageConfig }) {
  const leftBlocksRef = useRef<THREE.InstancedMesh>(null);
  const rightBlocksRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const kerbLeftRef = useRef<THREE.InstancedMesh>(null);
  const kerbRightRef = useRef<THREE.InstancedMesh>(null);
  const railPostsRef = useRef<THREE.InstancedMesh>(null);
  const tireWallRef = useRef<THREE.InstancedMesh>(null);
  const lampPolesRef = useRef<THREE.InstancedMesh>(null);
  const palmTrunksRef = useRef<THREE.InstancedMesh>(null);
  const palmTopsRef = useRef<THREE.InstancedMesh>(null);
  const hillsRef = useRef<THREE.InstancedMesh>(null);
  const bgTreesTrunkRef = useRef<THREE.InstancedMesh>(null);
  const bgTreesTopRef = useRef<THREE.InstancedMesh>(null);

  const zStart = 200;
  const zEnd = -stage.lapLength - 320;
  const totalRenderSpan = zStart - zEnd;

  const isStreet = stage.id === 1 || stage.id === 4 || stage.id === 6;
  const isMonaco = stage.id === 1 || stage.id === 6;
  const hasHarbor = stage.id === 6;
  const isEstoril = stage.id === 2;
  const isSuzuka = stage.id === 3;
  const isPhoenix = stage.id === 4;
  const isInterlagos = stage.id === 5;
  const isDonington = stage.id === 7;

  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const asphaltSet = useMemo(
    () => createAsphaltTextureSet(stage.weather.wetAsphalt, 1, 1),
    [stage.weather.wetAsphalt]
  );
  const grassSet = useMemo(() => createGrassTextureSet(56, 72), []);
  const gridTex = useMemo(() => createStartingGridTexture(), []);
  const finishTexture = useMemo(
    () => createCheckeredBannerTexture(stage.circuit, stage.year),
    [stage.circuit, stage.year]
  );
  const brazilFlagTexture = useMemo(() => createBrazilFlagTexture(), []);
  const brake150Tex = useMemo(() => createBrakeBoardTexture('150M'), []);
  const brake100Tex = useMemo(() => createBrakeBoardTexture('100M'), []);
  const brake50Tex = useMemo(() => createBrakeBoardTexture('50M'), []);
  const sponsorTextures = useMemo(
    () => [0, 1, 2, 3].map((idx) => createRetroSponsorTexture(idx)),
    []
  );

  // Curved ribbon geometries following getTrackOffsetX seamlessly past z=0 and z=-lapLength
  const roadGeo = useMemo(
    () => createCurvedStripGeometry(stage.id, stage.lapLength, zStart, zEnd, 26, 0, 0, 360, 20),
    [stage.id, stage.lapLength, zEnd]
  );
  const lineLeftGeo = useMemo(
    () => createCurvedStripGeometry(stage.id, stage.lapLength, zStart, zEnd, 0.34, -11.2, 0.012, 360, 20),
    [stage.id, stage.lapLength, zEnd]
  );
  const lineRightGeo = useMemo(
    () => createCurvedStripGeometry(stage.id, stage.lapLength, zStart, zEnd, 0.34, 11.2, 0.012, 360, 20),
    [stage.id, stage.lapLength, zEnd]
  );
  const pitLineGeo = useMemo(
    () => createCurvedStripGeometry(stage.id, stage.lapLength, zStart, zEnd, 0.24, -9.8, 0.012, 360, 20),
    [stage.id, stage.lapLength, zEnd]
  );
  const leftWallGeo = useMemo(
    () =>
      createCurvedWallGeometry(
        stage.id,
        stage.lapLength,
        zStart,
        zEnd,
        -(isStreet ? 12.9 : 14.8),
        isPhoenix ? 1.05 : 0.9,
        360
      ),
    [isPhoenix, isStreet, stage.id, stage.lapLength, zEnd]
  );
  const rightWallGeo = useMemo(
    () =>
      createCurvedWallGeometry(
        stage.id,
        stage.lapLength,
        zStart,
        zEnd,
        isStreet ? 12.9 : 14.8,
        isPhoenix ? 1.05 : 0.9,
        360
      ),
    [isPhoenix, isStreet, stage.id, stage.lapLength, zEnd]
  );

  useEffect(() => {
    return () => {
      roadGeo.dispose();
      lineLeftGeo.dispose();
      lineRightGeo.dispose();
      pitLineGeo.dispose();
      leftWallGeo.dispose();
      rightWallGeo.dispose();
      asphaltSet.map.dispose();
      asphaltSet.roughnessMap.dispose();
      asphaltSet.bumpMap.dispose();
      grassSet.map.dispose();
      grassSet.bumpMap.dispose();
      gridTex.dispose();
      finishTexture.dispose();
      brazilFlagTexture.dispose();
      brake150Tex.dispose();
      brake100Tex.dispose();
      brake50Tex.dispose();
      sponsorTextures.forEach((t) => t.dispose());
    };
  }, [
    asphaltSet,
    brake100Tex,
    brake150Tex,
    brake50Tex,
    brazilFlagTexture,
    finishTexture,
    grassSet,
    gridTex,
    leftWallGeo,
    lineLeftGeo,
    lineRightGeo,
    pitLineGeo,
    rightWallGeo,
    roadGeo,
    sponsorTextures,
  ]);

  const kerbCount = Math.ceil(totalRenderSpan / 10) + 2;
  const blockCount = Math.ceil(totalRenderSpan / 40) + 2;

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    // Layer 2: Buildings / Covered Grandstands aligned to periodic grid (step 40 divides every lapLength!)
    if (leftBlocksRef.current && rightBlocksRef.current) {
      const monacoColors = ['#fed7aa', '#fca5a5', '#bfdbfe', '#fde68a', '#e2e8f0'];
      const phoenixColors = ['#475569', '#334155', '#64748b', '#94a3b8'];

      let idx = 0;
      for (let z = 160; z >= zEnd && idx < blockCount; z -= 40) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        const hHeading = getTrackHeading(stage.id, z, stage.lapLength);
        const wrappedStep = (((Math.round(-z / 40)) % (stage.lapLength / 40)) + stage.lapLength / 40) % (stage.lapLength / 40);

        const heightL = isStreet ? 14 + ((wrappedStep * 7) % 16) : 6.5 + (wrappedStep % 2) * 2.4;
        const heightR = isStreet ? 12 + ((wrappedStep * 11) % 20) : 6.5 + ((wrappedStep + 1) % 2) * 2.4;
        const offsetX = isStreet ? 20 : 28;

        dummy.position.set(cx - offsetX, heightL / 2, z);
        dummy.rotation.set(0, hHeading, 0);
        dummy.scale.set(isStreet ? 10 : 11, heightL, isStreet ? 20 : 30);
        dummy.updateMatrix();
        leftBlocksRef.current.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(cx + (hasHarbor ? offsetX + 44 : offsetX), heightR / 2, z);
        dummy.scale.set(isStreet ? 10 : 11, heightR, isStreet ? 20 : 30);
        dummy.updateMatrix();
        rightBlocksRef.current.setMatrixAt(idx, dummy.matrix);

        if (canopyRef.current && !isStreet) {
          dummy.position.set(cx - offsetX + 1.2, heightL + 1.2, z);
          dummy.scale.set(13, 0.6, 31);
          dummy.updateMatrix();
          canopyRef.current.setMatrixAt(idx, dummy.matrix);
        }

        if (isMonaco) {
          color.set(monacoColors[wrappedStep % monacoColors.length]!);
        } else if (isPhoenix) {
          color.set(phoenixColors[wrappedStep % phoenixColors.length]!);
        } else if (isEstoril) {
          color.set(wrappedStep % 2 === 0 ? '#f8fafc' : '#dc2626');
        } else if (isInterlagos) {
          color.set(wrappedStep % 2 === 0 ? '#e2e8f0' : '#16a34a');
        } else {
          color.set('#334155');
        }

        leftBlocksRef.current.setColorAt(idx, color);
        rightBlocksRef.current.setColorAt(idx, color);
        idx += 1;
      }

      leftBlocksRef.current.count = idx;
      rightBlocksRef.current.count = idx;
      leftBlocksRef.current.instanceMatrix.needsUpdate = true;
      rightBlocksRef.current.instanceMatrix.needsUpdate = true;
      if (leftBlocksRef.current.instanceColor) leftBlocksRef.current.instanceColor.needsUpdate = true;
      if (rightBlocksRef.current.instanceColor) rightBlocksRef.current.instanceColor.needsUpdate = true;
      if (canopyRef.current) {
        canopyRef.current.count = idx;
        canopyRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // Layer 1: Raised 3D Kerbs aligned to step 10 (divides every lapLength!)
    if (kerbLeftRef.current && kerbRightRef.current) {
      let idx = 0;
      for (let z = 190; z >= zEnd && idx < kerbCount; z -= 10) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        const heading = getTrackHeading(stage.id, z, stage.lapLength);
        const phase = (((Math.round(-z / 10)) % (stage.lapLength / 10)) + stage.lapLength / 10) % (stage.lapLength / 10);

        dummy.position.set(cx - 11.9, 0.03, z);
        dummy.rotation.set(0, heading, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        kerbLeftRef.current.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(cx + 11.9, 0.03, z);
        dummy.updateMatrix();
        kerbRightRef.current.setMatrixAt(idx, dummy.matrix);

        color.set(phase % 2 === 0 ? '#ef4444' : '#f8fafc');
        kerbLeftRef.current.setColorAt(idx, color);
        kerbRightRef.current.setColorAt(idx, color);
        idx += 1;
      }
      kerbLeftRef.current.count = idx;
      kerbRightRef.current.count = idx;
      kerbLeftRef.current.instanceMatrix.needsUpdate = true;
      kerbRightRef.current.instanceMatrix.needsUpdate = true;
      if (kerbLeftRef.current.instanceColor) kerbLeftRef.current.instanceColor.needsUpdate = true;
      if (kerbRightRef.current.instanceColor) kerbRightRef.current.instanceColor.needsUpdate = true;
    }

    // Layer 1: Barrier Posts (step 20)
    if (railPostsRef.current) {
      let idx = 0;
      for (let z = 180; z >= zEnd && idx < 260; z -= 20) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        for (const side of [-1, 1] as const) {
          if (idx >= 260) break;
          dummy.position.set(cx + side * (isStreet ? 13.1 : 15.0), 0.6, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          railPostsRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      railPostsRef.current.count = idx;
      railPostsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Layer 1: Stacked Tire Barriers (step 80)
    if (tireWallRef.current) {
      let idx = 0;
      for (let z = 160; z >= zEnd && idx < 110; z -= 80) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        for (const side of [-1, 1] as const) {
          for (let row = 0; row < 2; row++) {
            if (idx >= 110) break;
            dummy.position.set(cx + side * (isStreet ? 13.6 : 15.6), 0.36 + row * 0.5, z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            tireWallRef.current.setMatrixAt(idx, dummy.matrix);
            color.set((idx + row) % 2 === 0 ? '#ef4444' : '#f8fafc');
            tireWallRef.current.setColorAt(idx, color);
            idx += 1;
          }
        }
      }
      tireWallRef.current.count = idx;
      tireWallRef.current.instanceMatrix.needsUpdate = true;
      if (tireWallRef.current.instanceColor) tireWallRef.current.instanceColor.needsUpdate = true;
    }

    // Layer 2: Lighting Poles (step 80)
    if (lampPolesRef.current) {
      let idx = 0;
      for (let z = 160; z >= zEnd && idx < 64; z -= 80) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        for (const side of [-1, 1] as const) {
          if (idx >= 64) break;
          dummy.position.set(cx + side * (isStreet ? 14.3 : 16.4), 4.5, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          lampPolesRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      lampPolesRef.current.count = idx;
      lampPolesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Phoenix Palms
    if (isPhoenix && palmTrunksRef.current && palmTopsRef.current) {
      let idx = 0;
      for (let z = 120; z >= zEnd && idx < 32; z -= 80) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        const side = idx % 2 === 0 ? -1 : 1;
        const x = cx + side * 15.6;
        dummy.position.set(x, 4.5, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        palmTrunksRef.current.setMatrixAt(idx, dummy.matrix);
        dummy.position.set(x, 9.2, z);
        dummy.updateMatrix();
        palmTopsRef.current.setMatrixAt(idx, dummy.matrix);
        idx += 1;
      }
      palmTrunksRef.current.count = idx;
      palmTopsRef.current.count = idx;
      palmTrunksRef.current.instanceMatrix.needsUpdate = true;
      palmTopsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Layer 3: Rolling Horizon Hills (step 80)
    if (hillsRef.current) {
      let idx = 0;
      for (let z = 160; z >= zEnd && idx < 56; z -= 80) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        for (const side of [-1, 1] as const) {
          if (idx >= 56) break;
          const phase = idx % 5;
          const radius = 58 + (phase % 4) * 18;
          const height = 28 + phase * 12;
          dummy.position.set(cx + side * (145 + (phase % 3) * 42), height * 0.42, z);
          dummy.rotation.set(0, phase * 0.4, 0);
          dummy.scale.set(radius, height, radius);
          dummy.updateMatrix();
          hillsRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      hillsRef.current.count = idx;
      hillsRef.current.instanceMatrix.needsUpdate = true;
    }

    // Layer 3: Varied Trees (step 40)
    if (!isStreet && bgTreesTrunkRef.current && bgTreesTopRef.current) {
      let idx = 0;
      for (let z = 160; z >= zEnd && idx < 110; z -= 40) {
        const cx = getTrackOffsetX(stage.id, z, stage.lapLength);
        for (const side of [-1, 1] as const) {
          if (idx >= 110) break;
          const phase = (((Math.round(-z / 40)) % (stage.lapLength / 40)) + stage.lapLength / 40) % (stage.lapLength / 40);
          const x = cx + side * (44 + (phase % 5) * 14);
          const s = 0.85 + (phase % 4) * 0.28;
          dummy.position.set(x, 1.8 * s, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          bgTreesTrunkRef.current.setMatrixAt(idx, dummy.matrix);

          dummy.position.set(x, 5.2 * s, z);
          dummy.updateMatrix();
          bgTreesTopRef.current.setMatrixAt(idx, dummy.matrix);
          idx += 1;
        }
      }
      bgTreesTrunkRef.current.count = idx;
      bgTreesTopRef.current.count = idx;
      bgTreesTrunkRef.current.instanceMatrix.needsUpdate = true;
      bgTreesTopRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [
    blockCount,
    hasHarbor,
    isEstoril,
    isInterlagos,
    isMonaco,
    isPhoenix,
    isStreet,
    kerbCount,
    stage.id,
    stage.lapLength,
    zEnd,
  ]);

  const markerAnchors = [-240, -560, -880, -1200];
  const suzukaCenterX = getTrackOffsetX(stage.id, -700, stage.lapLength);

  return (
    <group>
      {/* Layer 3: Vast Horizon Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, -stage.lapLength / 2]}
        receiveShadow
      >
        <planeGeometry args={[1800, totalRenderSpan + 900]} />
        {isStreet ? (
          <meshStandardMaterial color={isPhoenix ? '#b45309' : '#1f2937'} roughness={0.92} />
        ) : (
          <meshStandardMaterial
            map={grassSet.map}
            bumpMap={grassSet.bumpMap}
            bumpScale={0.04}
            color={isDonington ? '#22c55e' : '#ffffff'}
            roughness={0.9}
          />
        )}
      </mesh>

      {/* Rolling Horizon Hills */}
      <instancedMesh ref={hillsRef} args={[undefined, undefined, 56]}>
        <coneGeometry args={[1, 1, 7]} />
        <meshToonMaterial
          color={isPhoenix ? '#92400e' : isStreet ? '#1e293b' : '#15803d'}
          gradientMap={gradientMap}
        />
      </instancedMesh>

      {/* Varied Autodrome Trees */}
      {!isStreet && (
        <>
          <instancedMesh ref={bgTreesTrunkRef} args={[undefined, undefined, 110]}>
            <cylinderGeometry args={[0.35, 0.5, 3.6, 6]} />
            <meshToonMaterial color="#78350f" gradientMap={gradientMap} />
          </instancedMesh>
          <instancedMesh ref={bgTreesTopRef} args={[undefined, undefined, 110]}>
            <coneGeometry args={[2.7, 6.2, 7]} />
            <meshToonMaterial color="#166534" gradientMap={gradientMap} />
          </instancedMesh>
        </>
      )}

      {/* Curved Race Asphalt + Track Borders + Walls */}
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial
          map={asphaltSet.map}
          roughnessMap={asphaltSet.roughnessMap}
          bumpMap={asphaltSet.bumpMap}
          bumpScale={0.035}
          roughness={stage.weather.wetAsphalt ? 0.72 : 0.92}
          metalness={stage.weather.wetAsphalt ? 0.38 : 0.08}
        />
      </mesh>

      {/* Starting Grid Slots at z = 0..+64 and mirrored at z = -lapLength..+64 */}
      {[32, -stage.lapLength + 32].map((gridZ) => (
        <mesh key={gridZ} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, gridZ]}>
          <planeGeometry args={[18, 64]} />
          <meshBasicMaterial map={gridTex} transparent opacity={0.85} />
        </mesh>
      ))}

      <mesh geometry={pitLineGeo}>
        <meshBasicMaterial color="#facc15" transparent opacity={0.5} />
      </mesh>
      <mesh geometry={lineLeftGeo}>
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh geometry={lineRightGeo}>
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      <mesh geometry={leftWallGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={isPhoenix ? '#cbd5e1' : isMonaco ? '#94a3b8' : '#64748b'}
          roughness={0.4}
          metalness={isPhoenix ? 0.15 : 0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={rightWallGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color={isPhoenix ? '#cbd5e1' : isMonaco ? '#94a3b8' : '#64748b'}
          roughness={0.4}
          metalness={isPhoenix ? 0.15 : 0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Layer 1: Raised 3D Kerbs */}
      <instancedMesh ref={kerbLeftRef} args={[undefined, undefined, kerbCount]}>
        <boxGeometry args={[1.4, 0.06, 9.8]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>
      <instancedMesh ref={kerbRightRef} args={[undefined, undefined, kerbCount]}>
        <boxGeometry args={[1.4, 0.06, 9.8]} />
        <meshStandardMaterial roughness={0.65} />
      </instancedMesh>

      {/* Posts, Tire Barriers, Lamps, Grandstands */}
      <instancedMesh ref={railPostsRef} args={[undefined, undefined, 260]}>
        <boxGeometry args={[0.22, 1.2, 0.22]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.7} />
      </instancedMesh>
      <instancedMesh ref={tireWallRef} args={[undefined, undefined, 110]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 14]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={lampPolesRef} args={[undefined, undefined, 64]}>
        <boxGeometry args={[0.35, 9, 0.35]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={leftBlocksRef} args={[undefined, undefined, blockCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>
      <instancedMesh ref={rightBlocksRef} args={[undefined, undefined, blockCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial gradientMap={gradientMap} />
      </instancedMesh>
      {!isStreet && (
        <instancedMesh ref={canopyRef} args={[undefined, undefined, blockCount]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.35} />
        </instancedMesh>
      )}

      {/* Braking Distance Boards following curved track */}
      {markerAnchors.map((anchorZ, idx) => {
        const cx = getTrackOffsetX(stage.id, anchorZ, stage.lapLength);
        const h = getTrackHeading(stage.id, anchorZ, stage.lapLength);
        return (
          <group key={anchorZ} position={[cx, 0, anchorZ]} rotation={[0, h, 0]}>
            <mesh position={[-14.2, 1.3, 100]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake150Tex} />
            </mesh>
            <mesh position={[-14.2, 1.3, 50]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake100Tex} />
            </mesh>
            <mesh position={[-14.2, 1.3, 0]}>
              <planeGeometry args={[2.2, 1.1]} />
              <meshBasicMaterial map={brake50Tex} />
            </mesh>
            <mesh position={[hasHarbor ? -16.8 : 16.8, 1.4, 25]}>
              <planeGeometry args={[7.4, 1.8]} />
              <meshBasicMaterial map={sponsorTextures[idx % sponsorTextures.length]} />
            </mesh>
          </group>
        );
      })}

      {/* Circuit-Specific Iconic Landmarks */}
      {isInterlagos &&
        [-180, -480, -780, -1080].map((fz) => {
          const cx = getTrackOffsetX(stage.id, fz, stage.lapLength);
          return (
            <group key={fz} position={[cx - 27, 13.5, fz]}>
              <mesh position={[0, -2, 0]}>
                <cylinderGeometry args={[0.14, 0.14, 5, 8]} />
                <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
              </mesh>
              <mesh position={[0, 1.2, 2.2]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[5.5, 3.4]} />
                <meshBasicMaterial map={brazilFlagTexture} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}

      {isPhoenix && (
        <>
          <instancedMesh ref={palmTrunksRef} args={[undefined, undefined, 32]}>
            <cylinderGeometry args={[0.3, 0.45, 9, 8]} />
            <meshToonMaterial color="#92400e" gradientMap={gradientMap} />
          </instancedMesh>
          <instancedMesh ref={palmTopsRef} args={[undefined, undefined, 32]}>
            <coneGeometry args={[3.4, 2.6, 6]} />
            <meshToonMaterial color="#16a34a" gradientMap={gradientMap} />
          </instancedMesh>
        </>
      )}

      {isSuzuka && (
        <>
          <SuzukaFerrisWheel centerX={suzukaCenterX} />
          <group
            position={[getTrackOffsetX(stage.id, -680, stage.lapLength), 0, -680]}
            rotation={[0, getTrackHeading(stage.id, -680, stage.lapLength), 0]}
          >
            <mesh position={[-17, 6, 0]}>
              <boxGeometry args={[2.5, 12, 8]} />
              <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[17, 6, 0]}>
              <boxGeometry args={[2.5, 12, 8]} />
              <meshToonMaterial color="#e2e8f0" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, 10.5, 0]}>
              <boxGeometry args={[38, 2.6, 12]} />
              <meshToonMaterial color="#3f3f46" gradientMap={gradientMap} />
            </mesh>
          </group>
        </>
      )}

      {isDonington && (
        <group
          position={[getTrackOffsetX(stage.id, -720, stage.lapLength), 0, -720]}
          rotation={[0, getTrackHeading(stage.id, -720, stage.lapLength), 0]}
        >
          <mesh position={[0, 0.5, 0]}>
            <torusGeometry args={[14.5, 2.6, 14, 32, Math.PI]} />
            <meshToonMaterial color="#09090b" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 14.5, 2.7]}>
            <boxGeometry args={[14, 2.2, 0.3]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      )}

      {/* Start & Checkered Finish Gantries mirrored cleanly at z = 0 and z = -lapLength */}
      {[0, -stage.lapLength].map((gantryZ) => (
        <group key={gantryZ} position={[0, 0, gantryZ]}>
          <mesh position={[-13.5, 5.2, 0]}>
            <boxGeometry args={[1, 10.4, 1.2]} />
            <meshToonMaterial color="#18181b" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[13.5, 5.2, 0]}>
            <boxGeometry args={[1, 10.4, 1.2]} />
            <meshToonMaterial color="#18181b" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0, 9.2, 0]}>
            <boxGeometry args={[28, 3.2, 1.1]} />
            <meshBasicMaterial map={finishTexture} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function RaceTrack() {
  const mode = useGameStore((state) => state.mode);
  const activeStageId = useGameStore((state) => state.activeStageId);
  const isPaused = useGameStore((state) => state.isPaused);
  const finishRace = useGameStore((state) => state.finishRace);
  const setTacticalAlert = useGameStore((state) => state.setTacticalAlert);

  const stage = useMemo(
    () => STAGES.find((item) => item.id === activeStageId) ?? null,
    [activeStageId]
  );

  const alertTimeoutRef = useRef<number | null>(null);
  const countdownTimerRef = useRef(0);
  const holdDelayRef = useRef(0.6);
  const prevLightsRef = useRef(0);
  const prevRankRef = useRef(1);
  const gearFailureAppliedRef = useRef(false);
  const stumbleAlertAppliedRef = useRef(false);
  const lightningTimerRef = useRef(3.5);

  const showTimedAlert = useCallback(
    (msg: string, durationMs = 2400) => {
      if (alertTimeoutRef.current !== null) {
        window.clearTimeout(alertTimeoutRef.current);
      }
      setTacticalAlert(msg);
      alertTimeoutRef.current = window.setTimeout(() => {
        setTacticalAlert(null);
      }, durationMs);
    },
    [setTacticalAlert]
  );

  useEffect(() => {
    countdownTimerRef.current = 0;
    holdDelayRef.current = 0.45 + Math.random() * 0.4;
    prevLightsRef.current = 0;
    prevRankRef.current = stage?.playerGridPosition ?? 1;
    gearFailureAppliedRef.current = false;
    stumbleAlertAppliedRef.current = false;
    lightningTimerRef.current = 3.5;

    return () => {
      if (alertTimeoutRef.current !== null) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [activeStageId, stage?.playerGridPosition]);

  useFrame((_, delta) => {
    if (mode !== 'race' || !stage || isPaused || gameRuntime.raceFinished) {
      return;
    }

    const dt = Math.min(delta, 0.05);

    // 1. F1 Starting Gantry Countdown
    if (gameRuntime.racePhase === 'countdown') {
      countdownTimerRef.current += dt;
      const elapsed = countdownTimerRef.current;
      const litCount = Math.min(5, Math.floor(elapsed / 0.65));

      if (litCount > prevLightsRef.current) {
        prevLightsRef.current = litCount;
        gameRuntime.countdownLights = litCount;
        engineAudio.playCountdownBeep(880, 0.11);
      }

      if (elapsed >= 5 * 0.65 + holdDelayRef.current) {
        const nowMs = performance.now();
        gameRuntime.countdownLights = 0;
        gameRuntime.racePhase = 'racing';
        gameRuntime.countdownGoFlashUntil = nowMs + 950;
        gameRuntime.lapStartMs = nowMs;
        for (let i = 0; i < gameRuntime.opponents.length; i++) {
          gameRuntime.opponents[i]!.currentLapStartMs = nowMs;
        }
        engineAudio.playCountdownBeep(1320, 0.28);
      }
      return;
    }

    // 2. Active Race Timing & Rank Tracking (zero React setState per frame)
    gameRuntime.raceElapsed += dt;
    gameRuntime.currentLapMs = performance.now() - gameRuntime.lapStartMs;

    let aheadCount = 0;
    for (let i = 0; i < gameRuntime.opponents.length; i++) {
      const opp = gameRuntime.opponents[i]!;
      if (opp.totalDistance > gameRuntime.playerTotalDistance) {
        aheadCount += 1;
      }
    }
    const newRank = aheadCount + 1;
    if (newRank < prevRankRef.current) {
      gameRuntime.overtakesCompleted += prevRankRef.current - newRank;
      gameRuntime.overtakePulseAt = performance.now();
      engineAudio.playOvertake();
    }
    prevRankRef.current = newRank;
    gameRuntime.playerRank = newRank;

    // 3. Stage Mechanics & Weather
    if (
      stage.mechanic === 'stumble_recovery' &&
      gameRuntime.stumbleTriggered &&
      !stumbleAlertAppliedRef.current
    ) {
      stumbleAlertAppliedRef.current = true;
      showTimedAlert('QUEDA DE ROTAÇÃO — RETOMADA!', 2000);
    }

    if (
      stage.mechanic === 'sixth_gear_failure' &&
      !gearFailureAppliedRef.current &&
      gameRuntime.playerTotalDistance >= stage.lapLength * 2.15
    ) {
      gearFailureAppliedRef.current = true;
      gameRuntime.gearLocked = true;
      gameRuntime.transmissionFailed = true;
      engineAudio.playGearFailure();
      showTimedAlert('6ª MARCHA TRAVADA — COMPLETE A ÚLTIMA VOLTA!', 2800);
    }

    if (stage.weather.lightning) {
      lightningTimerRef.current -= dt;
      if (lightningTimerRef.current <= 0) {
        gameRuntime.lightningFlash = 0.85;
        lightningTimerRef.current = 5.5 + Math.random() * 6;
      }
    }
    gameRuntime.lightningFlash = Math.max(0, gameRuntime.lightningFlash - dt * 2.8);

    // 4. Seamless 3-Lap Crossing & Real Finish Classification
    const lapEndZ = -stage.lapLength;
    if (
      gameRuntime.previousPosition.z > lapEndZ &&
      gameRuntime.position.z <= lapEndZ
    ) {
      const nowMs = performance.now();
      const lapDurationMs = nowMs - gameRuntime.lapStartMs;
      gameRuntime.lastLapMs = lapDurationMs;
      gameRuntime.bestLapMs =
        gameRuntime.bestLapMs === null ? lapDurationMs : Math.min(gameRuntime.bestLapMs, lapDurationMs);

      if (gameRuntime.playerLap < stage.totalLaps) {
        gameRuntime.playerLap += 1;
        gameRuntime.position.z += stage.lapLength;
        gameRuntime.previousPosition.z += stage.lapLength;
        gameRuntime.lapStartMs = nowMs;

        if (gameRuntime.playerLap === stage.totalLaps) {
          showTimedAlert('ÚLTIMA VOLTA', 2500);
        }
      } else {
        gameRuntime.raceFinished = true;
        gameRuntime.racePhase = 'finished';
        gameRuntime.finishTimeMs = gameRuntime.raceElapsed * 1000;
        engineAudio.playCheckeredFlag();

        const standings = buildRaceStandings(stage);
        const finalPos = standings.find((entry) => entry.isPlayer)?.position ?? newRank;
        gameRuntime.playerRank = finalPos;

        finishRace({
          status: finalPos === 1 ? 'victory' : 'defeat',
          stageId: stage.id,
          position: finalPos,
          overtakesCompleted: gameRuntime.overtakesCompleted,
          overtakesRequired: stage.targetOvertakes,
          elapsedSeconds: gameRuntime.raceElapsed,
          bestLapMs: gameRuntime.bestLapMs,
          standings,
        });
      }
    }
  });

  if (mode !== 'race' || !stage) {
    return null;
  }

  return (
    <group>
      <CircuitScenery stage={stage} />
      {stage.opponents.map((spec, idx) => (
        <OpponentCar
          key={`${stage.id}-${spec.id}`}
          spec={spec}
          index={idx}
          stage={stage}
          isPaused={isPaused}
        />
      ))}
    </group>
  );
}
