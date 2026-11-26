import { useEffect, useMemo, useRef, useState } from 'react';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import type { EngineArchitecture, ExplodedPart, TimelineCarEntry } from '../../types/game';
import {
  createCarbonFiberTextureSet,
  createCarNumberPlateTexture,
  createRadiatorFinsTexture,
  createSennaHelmetTexture,
  createTireSidewallTexture,
  createTireTreadTextureSet,
} from '../../utils/proceduralTextures';

interface ShowroomCarProps {
  car: TimelineCarEntry;
}

function createEngineCoverShellGeometry(): THREE.ExtrudeGeometry {
  // Detachable engine cover + airbox + dorsal fin
  const shape = new THREE.Shape();
  shape.moveTo(-0.08, 0.42);
  shape.quadraticCurveTo(0.14, 0.88, 0.28, 0.87);
  shape.quadraticCurveTo(0.88, 0.78, 1.56, 0.46);
  shape.lineTo(1.88, 0.25);
  shape.lineTo(1.84, 0.17);
  shape.lineTo(0.05, 0.41);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.04,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-0.23, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

function createSurvivalTubGeometry(): THREE.ExtrudeGeometry {
  // Forward carbon survival cell / monocoque tub
  const shape = new THREE.Shape();
  shape.moveTo(-1.12, 0.14);
  shape.quadraticCurveTo(-0.9, 0.36, -0.56, 0.45);
  shape.lineTo(0.08, 0.44);
  shape.lineTo(0.08, 0.14);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.48,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-0.24, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

function createNoseLatheGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.01, -0.78),
    new THREE.Vector2(0.08, -0.72),
    new THREE.Vector2(0.14, -0.45),
    new THREE.Vector2(0.2, -0.05),
    new THREE.Vector2(0.25, 0.38),
    new THREE.Vector2(0.28, 0.74),
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.rotateX(Math.PI / 2);
  geo.scale(1.08, 0.74, 1);
  geo.computeVertexNormals();
  return geo;
}

function createSidepodShellGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.88, 0.12);
  shape.lineTo(-0.88, 0.41);
  shape.quadraticCurveTo(-0.25, 0.44, 0.42, 0.38);
  shape.quadraticCurveTo(0.82, 0.32, 0.96, 0.16);
  shape.lineTo(0.96, 0.12);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.36,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 10,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-0.18, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

function createExhaustManifoldGeometry(sideSign: -1 | 1): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sideSign * 0.16, 0.38, 0.45),
    new THREE.Vector3(sideSign * 0.28, 0.34, 0.75),
    new THREE.Vector3(sideSign * 0.24, 0.28, 1.18),
    new THREE.Vector3(sideSign * 0.15, 0.26, 1.65),
    new THREE.Vector3(sideSign * 0.13, 0.27, 2.02),
  ]);
  return new THREE.TubeGeometry(curve, 20, 0.032, 10, false);
}

function createCoolantPipeGeometry(sideSign: -1 | 1): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sideSign * 0.46, 0.28, 0.45),
    new THREE.Vector3(sideSign * 0.36, 0.29, 0.56),
    new THREE.Vector3(sideSign * 0.21, 0.27, 0.65),
  ]);
  return new THREE.TubeGeometry(curve, 12, 0.02, 8, false);
}

function getCylindersPerBank(arch: EngineArchitecture): number {
  switch (arch) {
    case 'V6':
      return 3;
    case 'V8':
      return 4;
    case 'V10':
      return 5;
    case 'V12':
      return 6;
  }
}

function VEngineAssembly({
  arch,
  valveCoverColor,
  aluminumMat,
  exhaustMat,
  carbonMat,
}: {
  arch: EngineArchitecture;
  valveCoverColor: string;
  aluminumMat: THREE.MeshStandardMaterial;
  exhaustMat: THREE.MeshStandardMaterial;
  carbonMat: THREE.MeshPhysicalMaterial;
}) {
  const perBank = getCylindersPerBank(arch);
  const blockLength = 0.46 + perBank * 0.075;
  const startZ = 0.42;

  const exhaustLeftGeo = useMemo(() => createExhaustManifoldGeometry(-1), []);
  const exhaustRightGeo = useMemo(() => createExhaustManifoldGeometry(1), []);

  useEffect(() => {
    return () => {
      exhaustLeftGeo.dispose();
      exhaustRightGeo.dispose();
    };
  }, [exhaustLeftGeo, exhaustRightGeo]);

  return (
    <group>
      {/* Cast Aluminum Crankcase */}
      <mesh position={[0, 0.24, 0.72]} castShadow material={aluminumMat}>
        <boxGeometry args={[0.26, 0.18, blockLength]} />
      </mesh>

      {/* Angled Left & Right Cylinder Banks + Valve Covers + Intake Trumpets */}
      {([-1, 1] as const).map((side) => (
        <group key={`bank-${side}`} position={[side * 0.09, 0.33, 0]} rotation={[0, 0, side * -0.58]}>
          {/* Cylinder Head Block */}
          <mesh position={[0, 0.07, 0.72]} castShadow material={aluminumMat}>
            <boxGeometry args={[0.13, 0.13, blockLength * 0.92]} />
          </mesh>

          {/* Colored Valve Cover */}
          <mesh position={[0, 0.15, 0.72]} castShadow>
            <boxGeometry args={[0.125, 0.04, blockLength * 0.88]} />
            <meshPhysicalMaterial
              color={valveCoverColor}
              roughness={0.28}
              metalness={0.45}
              clearcoat={0.7}
            />
          </mesh>

          {/* Individual Cylinder Barrels & Polished Intake Velocity Trumpets */}
          {Array.from({ length: perBank }).map((_, idx) => {
            const cz = startZ + idx * (blockLength * 0.8 / Math.max(1, perBank - 1));
            return (
              <group key={idx} position={[0, 0, cz]}>
                <mesh position={[0, 0.05, 0]} material={aluminumMat}>
                  <cylinderGeometry args={[0.042, 0.042, 0.12, 10]} />
                </mesh>
                {/* Velocity Trumpet inside the V-valley */}
                <mesh position={[-side * 0.06, 0.19, 0]} rotation={[0, 0, side * 0.35]} material={aluminumMat}>
                  <cylinderGeometry args={[0.028, 0.017, 0.095, 10]} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}

      {/* Central Fuel Rail & Plenum Spine */}
      <mesh position={[0, 0.47, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, blockLength * 0.85, 10]} />
        <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Curved Burnt-Titanium Tubular Exhaust Manifolds */}
      <mesh geometry={exhaustLeftGeo} castShadow material={exhaustMat} />
      <mesh geometry={exhaustRightGeo} castShadow material={exhaustMat} />

      {/* Longitudinal Gearbox Housing + Differential + Rear Crash Structure */}
      <mesh position={[0, 0.25, 1.48]} castShadow material={aluminumMat}>
        <boxGeometry args={[0.24, 0.2, 0.62]} />
      </mesh>
      <mesh position={[0, 0.26, 1.88]} castShadow material={carbonMat}>
        <boxGeometry args={[0.16, 0.16, 0.38]} />
      </mesh>
      {/* Rear Inboard Push-rod Damper Cylinders */}
      {([-0.08, 0.08] as const).map((dx) => (
        <mesh key={dx} position={[dx, 0.37, 1.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.36, 10]} />
          <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function TelemetryHotspot({
  position,
  active,
  hovered,
}: {
  position: [number, number, number];
  active: boolean;
  hovered: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.14;
    const scale = hovered ? 1.35 : pulse;
    ringRef.current.scale.setScalar(scale);
    ringRef.current.lookAt(state.camera.position);
  });

  return (
    <mesh ref={ringRef} position={position}>
      <ringGeometry args={[0.07, 0.11, 24]} />
      <meshBasicMaterial
        color={active ? '#16a34a' : '#facc15'}
        transparent
        opacity={hovered ? 1 : 0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function ShowroomCar({ car }: ShowroomCarProps) {
  const explodedParts = useGameStore((state) => state.explodedParts);
  const toggleExplodedPart = useGameStore((state) => state.toggleExplodedPart);

  const [hoveredPart, setHoveredPart] = useState<ExplodedPart | null>(null);

  const engineCoverGroupRef = useRef<THREE.Group>(null);
  const noseGroupRef = useRef<THREE.Group>(null);
  const sidepodLeftRef = useRef<THREE.Group>(null);
  const sidepodRightRef = useRef<THREE.Group>(null);
  const wheelGroupsRef = useRef<(THREE.Group | null)[]>([]);

  const primaryMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const secondaryMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const accentMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const targetPrimary = useMemo(() => new THREE.Color(car.livery.primary), [car.livery.primary]);
  const targetSecondary = useMemo(() => new THREE.Color(car.livery.secondary), [car.livery.secondary]);
  const targetAccent = useMemo(() => new THREE.Color(car.livery.accent), [car.livery.accent]);

  // Geometries
  const engineCoverGeo = useMemo(() => createEngineCoverShellGeometry(), []);
  const survivalTubGeo = useMemo(() => createSurvivalTubGeometry(), []);
  const noseGeo = useMemo(() => createNoseLatheGeometry(), []);
  const sidepodGeo = useMemo(() => createSidepodShellGeometry(), []);
  const coolantLeftGeo = useMemo(() => createCoolantPipeGeometry(-1), []);
  const coolantRightGeo = useMemo(() => createCoolantPipeGeometry(1), []);

  // Textures & PBR Materials
  const carbonSet = useMemo(() => createCarbonFiberTextureSet(8, 8), []);
  const treadSet = useMemo(() => createTireTreadTextureSet(), []);
  const sidewallTex = useMemo(() => createTireSidewallTexture(), []);
  const radiatorTex = useMemo(() => createRadiatorFinsTexture(), []);
  const sennaHelmetTex = useMemo(() => createSennaHelmetTexture(), []);
  const numberPlateTex = useMemo(() => createCarNumberPlateTexture(car.livery), [car.livery]);

  const carbonMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#141416',
        map: carbonSet.map,
        bumpMap: carbonSet.bumpMap,
        bumpScale: 0.015,
        roughnessMap: carbonSet.roughnessMap,
        roughness: 0.45,
        metalness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.16,
        envMapIntensity: 1.25,
      }),
    [carbonSet]
  );

  const aluminumMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b4b8c2',
        metalness: 0.85,
        roughness: 0.3,
        envMapIntensity: 1.4,
      }),
    []
  );

  const exhaustMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9a5b25',
        metalness: 0.9,
        roughness: 0.25,
        envMapIntensity: 1.5,
      }),
    []
  );

  const radiatorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: radiatorTex,
        metalness: 0.82,
        roughness: 0.28,
        envMapIntensity: 1.2,
      }),
    [radiatorTex]
  );

  const tireTreadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#161619',
        map: treadSet.map,
        bumpMap: treadSet.bumpMap,
        bumpScale: 0.01,
        roughness: 0.88,
        metalness: 0.05,
      }),
    [treadSet]
  );

  const tireSidewallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: sidewallTex,
        roughness: 0.82,
        metalness: 0.05,
      }),
    [sidewallTex]
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e4e4e7',
        metalness: 0.95,
        roughness: 0.2,
        envMapIntensity: 1.5,
      }),
    []
  );

  const brakeDiscMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#292524',
        metalness: 0.45,
        roughness: 0.45,
      }),
    []
  );

  const caliperMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#eab308',
        metalness: 0.9,
        roughness: 0.22,
      }),
    []
  );

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
      engineCoverGeo.dispose();
      survivalTubGeo.dispose();
      noseGeo.dispose();
      sidepodGeo.dispose();
      coolantLeftGeo.dispose();
      coolantRightGeo.dispose();
      carbonSet.map.dispose();
      carbonSet.bumpMap.dispose();
      carbonSet.roughnessMap.dispose();
      treadSet.map.dispose();
      treadSet.bumpMap.dispose();
      sidewallTex.dispose();
      radiatorTex.dispose();
      sennaHelmetTex.dispose();
      carbonMat.dispose();
      aluminumMat.dispose();
      exhaustMat.dispose();
      radiatorMat.dispose();
      tireTreadMat.dispose();
      tireSidewallMat.dispose();
      rimMat.dispose();
      brakeDiscMat.dispose();
      caliperMat.dispose();
    };
  }, [
    aluminumMat,
    brakeDiscMat,
    caliperMat,
    carbonMat,
    carbonSet,
    coolantLeftGeo,
    coolantRightGeo,
    engineCoverGeo,
    exhaustMat,
    noseGeo,
    radiatorMat,
    radiatorTex,
    rimMat,
    sennaHelmetTex,
    sidepodGeo,
    sidewallTex,
    survivalTubGeo,
    tireSidewallMat,
    tireTreadMat,
    treadSet,
  ]);

  useEffect(() => {
    return () => {
      numberPlateTex.dispose();
    };
  }, [numberPlateTex]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Smooth livery transitions across timeline years
    if (primaryMatRef.current) {
      primaryMatRef.current.color.lerp(targetPrimary, dt * 6);
    }
    if (secondaryMatRef.current) {
      secondaryMatRef.current.color.lerp(targetSecondary, dt * 6);
    }
    if (accentMatRef.current) {
      accentMatRef.current.color.lerp(targetAccent, dt * 6);
    }

    // 1. Engine Cover Exploded Animation (up + rearward)
    if (engineCoverGroupRef.current) {
      const targetY = explodedParts.engine ? 1.02 : 0;
      const targetZ = explodedParts.engine ? 1.05 : 0;
      const targetRotX = explodedParts.engine ? 0.14 : 0;
      engineCoverGroupRef.current.position.y = THREE.MathUtils.lerp(
        engineCoverGroupRef.current.position.y,
        targetY,
        dt * 6
      );
      engineCoverGroupRef.current.position.z = THREE.MathUtils.lerp(
        engineCoverGroupRef.current.position.z,
        targetZ,
        dt * 6
      );
      engineCoverGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        engineCoverGroupRef.current.rotation.x,
        targetRotX,
        dt * 6
      );
    }

    // 2. Wheels Exploded Animation (slide outward laterally exposing carbon brakes & push-rods)
    const wheelOffsets = [-0.95, 0.95, -0.99, 0.99];
    for (let i = 0; i < 4; i++) {
      const wheel = wheelGroupsRef.current[i];
      if (!wheel) continue;
      const baseX = wheelOffsets[i]!;
      const sideSign = baseX < 0 ? -1 : 1;
      const targetX = explodedParts.wheels ? baseX + sideSign * 0.85 : baseX;
      wheel.position.x = THREE.MathUtils.lerp(wheel.position.x, targetX, dt * 6);
    }

    // 3. Aero & Sidepods Exploded Animation (sidepods slide out + nose/front wing slides forward)
    if (sidepodLeftRef.current) {
      sidepodLeftRef.current.position.x = THREE.MathUtils.lerp(
        sidepodLeftRef.current.position.x,
        explodedParts.aero ? -1.24 : -0.52,
        dt * 6
      );
      sidepodLeftRef.current.position.y = THREE.MathUtils.lerp(
        sidepodLeftRef.current.position.y,
        explodedParts.aero ? 0.16 : 0.02,
        dt * 6
      );
    }
    if (sidepodRightRef.current) {
      sidepodRightRef.current.position.x = THREE.MathUtils.lerp(
        sidepodRightRef.current.position.x,
        explodedParts.aero ? 1.24 : 0.52,
        dt * 6
      );
      sidepodRightRef.current.position.y = THREE.MathUtils.lerp(
        sidepodRightRef.current.position.y,
        explodedParts.aero ? 0.16 : 0.02,
        dt * 6
      );
    }
    if (noseGroupRef.current) {
      noseGroupRef.current.position.z = THREE.MathUtils.lerp(
        noseGroupRef.current.position.z,
        explodedParts.aero ? -0.95 : 0,
        dt * 6
      );
    }
  });

  const makeHandlers = (part: ExplodedPart) => ({
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      toggleExplodedPart(part);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = 'pointer';
      setHoveredPart(part);
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = 'auto';
      setHoveredPart((prev) => (prev === part ? null : prev));
    },
  });

  const corners = [
    { x: -0.95, y: 0.31, z: -1.36, r: 0.31, w: 0.34, side: -1 as const },
    { x: 0.95, y: 0.31, z: -1.36, r: 0.31, w: 0.34, side: 1 as const },
    { x: -0.99, y: 0.35, z: 1.48, r: 0.35, w: 0.46, side: -1 as const },
    { x: 0.99, y: 0.35, z: 1.48, r: 0.35, w: 0.46, side: 1 as const },
  ];

  return (
    <group>
      {/* Static Carbon Floorplank & Rear Diffuser */}
      <mesh position={[0, 0.1, 0.14]} castShadow receiveShadow material={carbonMat}>
        <boxGeometry args={[1.42, 0.045, 3.85]} />
      </mesh>
      <mesh position={[0, 0.16, 2.04]} rotation={[0.25, 0, 0]} castShadow material={carbonMat}>
        <boxGeometry args={[1.12, 0.05, 0.52]} />
      </mesh>
      {[-0.36, -0.12, 0.12, 0.36].map((strakeX) => (
        <mesh key={strakeX} position={[strakeX, 0.16, 2.08]} material={carbonMat}>
          <boxGeometry args={[0.025, 0.16, 0.44]} />
        </mesh>
      ))}

      {/* Internal Carbon Survival Cell + Cockpit Pedals & Steering Column */}
      <group {...makeHandlers('cockpit')}>
        <mesh geometry={survivalTubGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            ref={primaryMatRef}
            color={car.livery.primary}
            roughness={0.18}
            metalness={0.25}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            envMapIntensity={1.6}
            emissive={hoveredPart === 'cockpit' ? '#facc15' : '#000000'}
            emissiveIntensity={hoveredPart === 'cockpit' ? 0.12 : 0}
          />
        </mesh>

        {/* Carbon Survival Tub Liner */}
        <mesh position={[0, 0.43, -0.22]} material={carbonMat}>
          <boxGeometry args={[0.42, 0.06, 0.88]} />
        </mesh>
        {/* Steering Column & Classic Wheel */}
        <mesh position={[0, 0.49, -0.58]} rotation={[1.22, 0, 0]} material={aluminumMat}>
          <cylinderGeometry args={[0.018, 0.02, 0.36, 10]} />
        </mesh>
        <mesh position={[0, 0.52, -0.44]} rotation={[0.35, 0, 0]} material={carbonMat}>
          <cylinderGeometry args={[0.105, 0.105, 0.025, 16]} />
        </mesh>
        {/* Footwell Pedals (Throttle, Brake, Clutch) */}
        {[-0.08, 0, 0.08].map((px) => (
          <mesh key={px} position={[px, 0.25, -0.82]} rotation={[-0.25, 0, 0]} material={aluminumMat}>
            <boxGeometry args={[0.045, 0.11, 0.015]} />
          </mesh>
        ))}
        {/* Red Racing Harness Straps */}
        {([-0.08, 0.08] as const).map((strapX) => (
          <mesh key={strapX} position={[strapX, 0.5, -0.06]} rotation={[0.45, 0, 0]}>
            <boxGeometry args={[0.045, 0.18, 0.02]} />
            <meshStandardMaterial color="#dc2626" roughness={0.7} />
          </mesh>
        ))}
        {/* Senna Helmet & Mirrored Visor */}
        <group position={[0, 0.65, -0.08]}>
          <mesh rotation={[0, -Math.PI / 2, 0]} castShadow>
            <sphereGeometry args={[0.17, 24, 18]} />
            <meshPhysicalMaterial
              map={sennaHelmetTex}
              roughness={0.12}
              metalness={0.25}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              envMapIntensity={1.6}
            />
          </mesh>
          <mesh position={[0, 0.02, -0.125]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.23, 0.07, 0.095]} />
            <meshStandardMaterial
              color="#09090b"
              roughness={0.04}
              metalness={1.0}
              envMapIntensity={2.0}
            />
          </mesh>
        </group>

        <TelemetryHotspot
          position={[0, 0.96, -0.12]}
          active={explodedParts.cockpit}
          hovered={hoveredPart === 'cockpit'}
        />
      </group>

      {/* INTERNAL V-ENGINE, EXHAUSTS & GEARBOX */}
      <VEngineAssembly
        arch={car.technical.engineArch}
        valveCoverColor={car.technical.valveCoverColor}
        aluminumMat={aluminumMat}
        exhaustMat={exhaustMat}
        carbonMat={carbonMat}
      />

      {/* DETACHABLE ENGINE COVER + AIRBOX + REAR WING */}
      <group ref={engineCoverGroupRef} {...makeHandlers('engine')}>
        <mesh geometry={engineCoverGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={car.livery.primary}
            roughness={0.18}
            metalness={0.25}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            envMapIntensity={1.6}
            emissive={hoveredPart === 'engine' ? '#facc15' : '#000000'}
            emissiveIntensity={hoveredPart === 'engine' ? 0.12 : 0}
          />
        </mesh>
        <mesh position={[0, 0.56, 0.92]} rotation={[-0.26, 0, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.25, 1.25, 16]} />
          <meshPhysicalMaterial
            color={car.livery.secondary}
            roughness={0.18}
            metalness={0.25}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            envMapIntensity={1.6}
          />
        </mesh>
        <mesh position={[0, 0.82, 0.14]} material={carbonMat}>
          <cylinderGeometry args={[0.115, 0.13, 0.24, 14]} />
        </mesh>

        {/* Rear Wing mounted to rear bodywork */}
        <group position={[0, 0.84, 1.98]}>
          <mesh position={[0, -0.34, -0.05]} castShadow material={carbonMat}>
            <boxGeometry args={[0.085, 0.58, 0.24]} />
          </mesh>
          <mesh position={[0, 0.05, 0.02]} rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[1.4, 0.04, 0.36]} />
            <meshPhysicalMaterial
              color={car.livery.primary}
              roughness={0.18}
              metalness={0.25}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              envMapIntensity={1.6}
            />
          </mesh>
          <mesh position={[0, 0.155, 0.12]} rotation={[0.26, 0, 0]} castShadow>
            <boxGeometry args={[1.4, 0.03, 0.22]} />
            <meshPhysicalMaterial
              color={car.livery.secondary}
              roughness={0.18}
              metalness={0.25}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              envMapIntensity={1.6}
            />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.71, -0.06, 0.04]} castShadow>
              <boxGeometry args={[0.045, 0.52, 0.56]} />
              <meshPhysicalMaterial
                color={car.livery.secondary}
                roughness={0.18}
                metalness={0.25}
                clearcoat={1.0}
                clearcoatRoughness={0.04}
                envMapIntensity={1.6}
              />
            </mesh>
          ))}
        </group>

        <TelemetryHotspot
          position={[0, 1.02, 0.78]}
          active={explodedParts.engine}
          hovered={hoveredPart === 'engine'}
        />
      </group>

      {/* INTERNAL ALUMINUM RADIATORS & COOLANT PIPING (Inside Sidepods) */}
      {([-1, 1] as const).map((side) => (
        <group key={`rad-${side}`} position={[side * 0.46, 0.27, 0.36]}>
          <mesh rotation={[0.32, side * 0.18, 0]} castShadow material={radiatorMat}>
            <boxGeometry args={[0.26, 0.2, 0.62]} />
          </mesh>
          <mesh
            geometry={side < 0 ? coolantLeftGeo : coolantRightGeo}
            position={[-side * 0.46, -0.27, -0.36]}
            material={aluminumMat}
          />
        </group>
      ))}

      {/* DETACHABLE SIDEPODS + DETACHABLE NOSE CONE & FRONT WING (AERO ZONE) */}
      <group {...makeHandlers('aero')}>
        {([-1, 1] as const).map((side) => (
          <group
            key={`sp-${side}`}
            ref={side < 0 ? sidepodLeftRef : sidepodRightRef}
            position={[side * 0.52, 0.02, 0.46]}
          >
            <mesh geometry={sidepodGeo} castShadow receiveShadow>
              <meshPhysicalMaterial
                color={car.livery.primary}
                roughness={0.18}
                metalness={0.25}
                clearcoat={1.0}
                clearcoatRoughness={0.04}
                envMapIntensity={1.6}
                emissive={hoveredPart === 'aero' ? '#facc15' : '#000000'}
                emissiveIntensity={hoveredPart === 'aero' ? 0.1 : 0}
              />
            </mesh>
            <mesh position={[side * 0.19, 0.28, 0.05]}>
              <boxGeometry args={[0.04, 0.16, 1.32]} />
              <meshPhysicalMaterial
                color={car.livery.secondary}
                roughness={0.18}
                metalness={0.25}
                clearcoat={1.0}
                clearcoatRoughness={0.04}
                envMapIntensity={1.6}
              />
            </mesh>
            <mesh position={[0, 0.27, -0.92]} material={carbonMat}>
              <boxGeometry args={[0.36, 0.22, 0.06]} />
            </mesh>
          </group>
        ))}

        <group ref={noseGroupRef}>
          <mesh position={[0, 0.25, -1.78]} geometry={noseGeo} castShadow receiveShadow>
            <meshPhysicalMaterial
              ref={secondaryMatRef}
              color={car.livery.secondary}
              roughness={0.18}
              metalness={0.25}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              envMapIntensity={1.6}
              emissive={hoveredPart === 'aero' ? '#facc15' : '#000000'}
              emissiveIntensity={hoveredPart === 'aero' ? 0.1 : 0}
            />
          </mesh>
          <mesh position={[0, 0.405, -1.25]} rotation={[-Math.PI / 2 + 0.08, 0, 0]}>
            <planeGeometry args={[0.38, 0.38]} />
            <meshPhysicalMaterial
              map={numberPlateTex}
              roughness={0.18}
              clearcoat={1.0}
              clearcoatRoughness={0.04}
              envMapIntensity={1.5}
            />
          </mesh>

          <group position={[0, 0.13, -2.38]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.98, 0.032, 0.44]} />
              <meshPhysicalMaterial
                color={car.livery.primary}
                roughness={0.18}
                metalness={0.25}
                clearcoat={1.0}
                clearcoatRoughness={0.04}
                envMapIntensity={1.6}
              />
            </mesh>
            <mesh position={[0, 0.042, 0.09]} rotation={[-0.22, 0, 0]} castShadow>
              <boxGeometry args={[1.9, 0.026, 0.19]} />
              <meshPhysicalMaterial
                ref={accentMatRef}
                color={car.livery.accent}
                roughness={0.18}
                metalness={0.25}
                clearcoat={1.0}
                clearcoatRoughness={0.04}
                envMapIntensity={1.6}
              />
            </mesh>
            {([-1, 1] as const).map((side) => (
              <mesh key={side} position={[side * 0.99, 0.075, 0]} castShadow material={carbonMat}>
                <boxGeometry args={[0.04, 0.18, 0.5]} />
              </mesh>
            ))}
          </group>
        </group>

        <TelemetryHotspot
          position={[0.78, 0.56, 0.25]}
          active={explodedParts.aero}
          hovered={hoveredPart === 'aero'}
        />
      </group>

      {/* SUSPENSION WISHBONES + PUSH-RODS + INTERNAL CARBON BRAKES + SLIDING WHEELS */}
      {([-1, 1] as const).map((side) => (
        <group key={`susp-${side}`}>
          {/* Front V-wishbones & Push-rod */}
          <mesh position={[side * 0.55, 0.31, -1.46]} rotation={[0, side * 0.26, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.78, 8]} />
          </mesh>
          <mesh position={[side * 0.55, 0.31, -1.24]} rotation={[0, side * -0.26, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.015, 0.015, 0.78, 8]} />
          </mesh>
          <mesh position={[side * 0.55, 0.21, -1.44]} rotation={[0, side * 0.22, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.017, 0.017, 0.8, 8]} />
          </mesh>
          <mesh position={[side * 0.55, 0.21, -1.26]} rotation={[0, side * -0.22, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.017, 0.017, 0.8, 8]} />
          </mesh>
          {/* Front Diagonal Push-rod */}
          <mesh position={[side * 0.56, 0.34, -1.35]} rotation={[0, 0, side * -0.42]} material={aluminumMat}>
            <cylinderGeometry args={[0.013, 0.013, 0.68, 8]} />
          </mesh>

          {/* Rear V-wishbones & Push-rod */}
          <mesh position={[side * 0.58, 0.34, 1.38]} rotation={[0, side * -0.24, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.017, 0.017, 0.78, 8]} />
          </mesh>
          <mesh position={[side * 0.58, 0.34, 1.56]} rotation={[0, side * 0.24, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.017, 0.017, 0.78, 8]} />
          </mesh>
          <mesh position={[side * 0.58, 0.22, 1.4]} rotation={[0, side * -0.2, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.019, 0.019, 0.8, 8]} />
          </mesh>
          <mesh position={[side * 0.58, 0.22, 1.58]} rotation={[0, side * 0.2, Math.PI / 2]} material={carbonMat}>
            <cylinderGeometry args={[0.019, 0.019, 0.8, 8]} />
          </mesh>
          {/* Rear Diagonal Push-rod */}
          <mesh position={[side * 0.58, 0.38, 1.48]} rotation={[0, 0, side * -0.45]} material={aluminumMat}>
            <cylinderGeometry args={[0.014, 0.014, 0.7, 8]} />
          </mesh>
        </group>
      ))}

      {/* Fixed Axle Carbon Brake Rotors & Metallic Calipers (exposed when wheels slide out!) */}
      {corners.map((c, idx) => (
        <group key={`brake-${idx}`} position={[c.x - c.side * 0.08, c.y, c.z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={brakeDiscMat}>
            <cylinderGeometry args={[c.r * 0.56, c.r * 0.56, 0.05, 24]} />
          </mesh>
          <mesh position={[0, c.r * 0.38, 0]} material={caliperMat}>
            <boxGeometry args={[0.08, 0.13, 0.14]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 12]} />
          </mesh>
        </group>
      ))}

      {/* Sliding Slick Wheels & Multi-Spoke Rims (WHEELS ZONE) */}
      <group {...makeHandlers('wheels')}>
        {corners.map((c, idx) => (
          <group
            key={`wheel-${idx}`}
            ref={(el) => {
              wheelGroupsRef.current[idx] = el;
            }}
            position={[c.x, c.y, c.z]}
          >
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireTreadMat}>
              <cylinderGeometry args={[c.r, c.r, c.w, 28]} />
            </mesh>
            <mesh
              position={[c.side * (c.w * 0.502), 0, 0]}
              rotation={[0, c.side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
              material={tireSidewallMat}
            >
              <circleGeometry args={[c.r * 0.99, 28]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
              <cylinderGeometry args={[c.r * 0.54, c.r * 0.54, c.w * 1.01, 20]} />
            </mesh>
            <mesh
              position={[c.side * (c.w * 0.515), 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={caliperMat}
            >
              <cylinderGeometry args={[0.045, 0.055, 0.04, 12]} />
            </mesh>
          </group>
        ))}

        <TelemetryHotspot
          position={[-1.12, 0.72, -1.36]}
          active={explodedParts.wheels}
          hovered={hoveredPart === 'wheels'}
        />
      </group>
    </group>
  );
}
