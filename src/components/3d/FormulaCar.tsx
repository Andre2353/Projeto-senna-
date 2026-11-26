import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEFAULT_MCLAREN_LIVERY, STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { CarLivery } from '../../types/game';
import {
  createCarbonFiberTextureSet,
  createCarNumberPlateTexture,
  createSennaHelmetTexture,
  createTireSidewallTexture,
  createTireTreadTextureSet,
} from '../../utils/proceduralTextures';
import { gameRuntime } from '../../utils/runtime';

interface FormulaChassisProps {
  livery: CarLivery;
  isSennaHelmet?: boolean;
  realistic?: boolean;
  rearLightRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  primaryMatRef?: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  secondaryMatRef?: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  accentMatRef?: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  frontLeftSteerRef?: React.RefObject<THREE.Group | null>;
  frontRightSteerRef?: React.RefObject<THREE.Group | null>;
  wheelSpinRefs?: React.MutableRefObject<(THREE.Group | null)[]>;
}

export interface FormulaCarProps {
  realistic?: boolean;
  liveryOverride?: CarLivery;
  staticPose?: boolean;
}

function createBodyworkCowlingGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-1.72, 0.14);
  shape.quadraticCurveTo(-1.15, 0.34, -0.58, 0.45);
  shape.lineTo(0.05, 0.44);
  shape.quadraticCurveTo(0.16, 0.88, 0.28, 0.87);
  shape.quadraticCurveTo(0.88, 0.78, 1.56, 0.46);
  shape.lineTo(1.88, 0.25);
  shape.lineTo(1.86, 0.14);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-0.23, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

function createSidepodGeometry(): THREE.ExtrudeGeometry {
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

function createNoseLatheGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.01, -0.78),
    new THREE.Vector2(0.08, -0.72),
    new THREE.Vector2(0.14, -0.45),
    new THREE.Vector2(0.2, -0.05),
    new THREE.Vector2(0.25, 0.38),
    new THREE.Vector2(0.28, 0.74),
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.rotateX(Math.PI / 2);
  geo.scale(1.08, 0.74, 1);
  geo.computeVertexNormals();
  return geo;
}

function DetailedWheel({
  radius,
  width,
  sideSign,
  tireTreadMat,
  tireSidewallMat,
  rimMat,
  brakeRotorMat,
  caliperMat,
  spinRef,
}: {
  radius: number;
  width: number;
  sideSign: -1 | 1;
  tireTreadMat: THREE.MeshStandardMaterial;
  tireSidewallMat: THREE.MeshStandardMaterial;
  rimMat: THREE.MeshStandardMaterial;
  brakeRotorMat: THREE.MeshStandardMaterial;
  caliperMat: THREE.MeshStandardMaterial;
  spinRef: (el: THREE.Group | null) => void;
}) {
  const spokeAngles = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);

  return (
    <group>
      {/* Static Brake Rotor + Caliper inside hub */}
      <mesh
        position={[-sideSign * (width * 0.25), 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={brakeRotorMat}
      >
        <cylinderGeometry args={[radius * 0.52, radius * 0.52, 0.04, 20]} />
      </mesh>
      <mesh position={[-sideSign * (width * 0.25), radius * 0.35, 0]} material={caliperMat}>
        <boxGeometry args={[0.07, 0.11, 0.12]} />
      </mesh>

      {/* Spinning Tire & Rim */}
      <group ref={spinRef}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireTreadMat}>
          <cylinderGeometry args={[radius, radius, width, 28]} />
        </mesh>

        {/* Outer & inner sidewalls with Goodyear-style yellow/white arcs */}
        <mesh
          position={[sideSign * (width * 0.502), 0, 0]}
          rotation={[0, sideSign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          material={tireSidewallMat}
        >
          <circleGeometry args={[radius * 0.99, 28]} />
        </mesh>

        {/* Recessed Rim Barrel */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
          <cylinderGeometry args={[radius * 0.54, radius * 0.54, width * 1.01, 20]} />
        </mesh>

        {/* Center-lock Hub Nut */}
        <mesh
          position={[sideSign * (width * 0.515), 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={caliperMat}
        >
          <cylinderGeometry args={[0.045, 0.055, 0.04, 12]} />
        </mesh>

        {/* 5 Rim Spokes */}
        {spokeAngles.map((ang, idx) => (
          <mesh
            key={idx}
            position={[sideSign * (width * 0.508), 0, 0]}
            rotation={[ang, 0, 0]}
            material={rimMat}
          >
            <boxGeometry args={[0.02, radius * 0.92, 0.035]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function FormulaChassis({
  livery,
  isSennaHelmet = true,
  realistic = false,
  rearLightRef,
  primaryMatRef,
  secondaryMatRef,
  accentMatRef,
  frontLeftSteerRef,
  frontRightSteerRef,
  wheelSpinRefs,
}: FormulaChassisProps) {
  const cowlingGeo = useMemo(() => createBodyworkCowlingGeometry(), []);
  const sidepodGeo = useMemo(() => createSidepodGeometry(), []);
  const noseGeo = useMemo(() => createNoseLatheGeometry(), []);

  const tireSidewallTex = useMemo(() => createTireSidewallTexture(), []);
  const tireTreadSet = useMemo(() => createTireTreadTextureSet(), []);
  const carbonSet = useMemo(() => createCarbonFiberTextureSet(8, 8), []);
  const sennaHelmetTex = useMemo(() => createSennaHelmetTexture(), []);
  const numberPlateTex = useMemo(() => createCarNumberPlateTexture(livery), [livery]);

  const tireTreadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#161619',
        map: tireTreadSet.map,
        bumpMap: tireTreadSet.bumpMap,
        bumpScale: 0.01,
        roughness: 0.88,
        metalness: 0.05,
      }),
    [tireTreadSet]
  );

  const tireSidewallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tireSidewallTex,
        roughness: 0.82,
        metalness: 0.05,
      }),
    [tireSidewallTex]
  );

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
        clearcoat: realistic ? 0.6 : 0.3,
        clearcoatRoughness: 0.16,
        envMapIntensity: realistic ? 1.25 : 0.9,
      }),
    [carbonSet, realistic]
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e4e4e7',
        roughness: realistic ? 0.2 : 0.22,
        metalness: realistic ? 0.95 : 0.88,
        envMapIntensity: realistic ? 1.5 : 1.0,
      }),
    [realistic]
  );

  const brakeRotorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#82828c',
        roughness: 0.2,
        metalness: 0.95,
        envMapIntensity: realistic ? 1.5 : 1.0,
      }),
    [realistic]
  );

  const caliperMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.26,
        metalness: 0.82,
      }),
    []
  );

  useEffect(() => {
    return () => {
      cowlingGeo.dispose();
      sidepodGeo.dispose();
      noseGeo.dispose();
      tireSidewallTex.dispose();
      tireTreadSet.map.dispose();
      tireTreadSet.bumpMap.dispose();
      carbonSet.map.dispose();
      carbonSet.bumpMap.dispose();
      carbonSet.roughnessMap.dispose();
      sennaHelmetTex.dispose();
      tireTreadMat.dispose();
      tireSidewallMat.dispose();
      carbonMat.dispose();
      rimMat.dispose();
      brakeRotorMat.dispose();
      caliperMat.dispose();
    };
  }, [
    brakeRotorMat,
    caliperMat,
    carbonMat,
    carbonSet,
    cowlingGeo,
    noseGeo,
    rimMat,
    sennaHelmetTex,
    sidepodGeo,
    tireSidewallMat,
    tireSidewallTex,
    tireTreadMat,
    tireTreadSet,
  ]);

  useEffect(() => {
    return () => {
      numberPlateTex.dispose();
    };
  }, [numberPlateTex]);

  const setWheelRef = (index: number) => (el: THREE.Group | null) => {
    if (wheelSpinRefs) {
      wheelSpinRefs.current[index] = el;
    }
  };

  return (
    <group>
      {/* Low Venturi Floorplank & Diffuser with Vertical Strakes */}
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

      {/* Twin Metallic Rear Exhaust Pipes */}
      {([-0.14, 0.14] as const).map((exX) => (
        <mesh
          key={exX}
          position={[exX, 0.28, 1.98]}
          rotation={[Math.PI / 2 - 0.1, 0, 0]}
          material={rimMat}
        >
          <cylinderGeometry args={[0.036, 0.042, 0.36, 12]} />
        </mesh>
      ))}

      {/* Sculpted Beveled Monocoque & Engine Cover Cowling */}
      <mesh geometry={cowlingGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={primaryMatRef}
          color={livery.primary}
          roughness={realistic ? 0.18 : 0.22}
          metalness={realistic ? 0.25 : 0.32}
          clearcoat={1.0}
          clearcoatRoughness={realistic ? 0.04 : 0.08}
          envMapIntensity={realistic ? 1.6 : 1.0}
        />
      </mesh>

      {/* Smooth Lathe Tapered Nose Cone */}
      <mesh position={[0, 0.25, -1.78]} geometry={noseGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={secondaryMatRef}
          color={livery.secondary}
          roughness={realistic ? 0.18 : 0.22}
          metalness={realistic ? 0.25 : 0.32}
          clearcoat={1.0}
          clearcoatRoughness={realistic ? 0.04 : 0.08}
          envMapIntensity={realistic ? 1.6 : 1.0}
        />
      </mesh>

      {/* Nose Top Racing Number Roundel */}
      <mesh position={[0, 0.405, -1.25]} rotation={[-Math.PI / 2 + 0.08, 0, 0]}>
        <planeGeometry args={[0.38, 0.38]} />
        <meshPhysicalMaterial
          map={numberPlateTex}
          roughness={realistic ? 0.18 : 0.22}
          clearcoat={1.0}
          clearcoatRoughness={realistic ? 0.04 : 0.08}
          envMapIntensity={realistic ? 1.5 : 1.0}
        />
      </mesh>

      {/* Engine Cover Secondary Livery Dorsal Accent */}
      <mesh position={[0, 0.56, 0.92]} rotation={[-0.26, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.25, 1.25, 16]} />
        <meshPhysicalMaterial
          color={livery.secondary}
          roughness={realistic ? 0.18 : 0.22}
          metalness={realistic ? 0.25 : 0.32}
          clearcoat={1.0}
          clearcoatRoughness={realistic ? 0.04 : 0.08}
          envMapIntensity={realistic ? 1.6 : 1.0}
        />
      </mesh>

      {/* Airbox Intake Scoop */}
      <mesh position={[0, 0.82, 0.14]} material={carbonMat}>
        <cylinderGeometry args={[0.115, 0.13, 0.24, 14]} />
      </mesh>

      {/* Sculpted Beveled Sidepods (Left & Right) */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.52, 0.02, 0.46]}>
          <mesh geometry={sidepodGeo} castShadow receiveShadow>
            <meshPhysicalMaterial
              color={livery.primary}
              roughness={realistic ? 0.18 : 0.22}
              metalness={realistic ? 0.25 : 0.3}
              clearcoat={1.0}
              clearcoatRoughness={realistic ? 0.04 : 0.08}
              envMapIntensity={realistic ? 1.6 : 1.0}
            />
          </mesh>
          {/* Sidepod livery accent band */}
          <mesh position={[side * 0.19, 0.28, 0.05]}>
            <boxGeometry args={[0.04, 0.16, 1.32]} />
            <meshPhysicalMaterial
              color={livery.secondary}
              roughness={realistic ? 0.18 : 0.22}
              metalness={realistic ? 0.25 : 0.3}
              clearcoat={1.0}
              clearcoatRoughness={realistic ? 0.04 : 0.08}
              envMapIntensity={realistic ? 1.6 : 1.0}
            />
          </mesh>
          {/* Dark radiator intake opening */}
          <mesh position={[0, 0.27, -0.92]} material={carbonMat}>
            <boxGeometry args={[0.36, 0.22, 0.06]} />
          </mesh>
        </group>
      ))}

      {/* Twin Stalked Wing Mirrors */}
      {([-1, 1] as const).map((side) => (
        <group key={`mirror-${side}`} position={[side * 0.42, 0.53, -0.52]}>
          <mesh position={[-side * 0.06, -0.04, 0]} rotation={[0, 0, side * -0.5]} material={carbonMat}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.07, 0.08]} />
            <meshPhysicalMaterial color={livery.secondary} roughness={0.2} clearcoat={1.0} />
          </mesh>
        </group>
      ))}

      {/* Cockpit Interior: Seat, Red Harness Straps & Steering Wheel */}
      <mesh position={[0, 0.46, -0.18]} material={carbonMat}>
        <boxGeometry args={[0.42, 0.08, 0.72]} />
      </mesh>
      {([-0.08, 0.08] as const).map((strapX) => (
        <mesh
          key={strapX}
          position={[strapX, 0.51, -0.06]}
          rotation={[0.45, 0, 0]}
        >
          <boxGeometry args={[0.045, 0.18, 0.02]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.51, -0.44]} rotation={[0.35, 0, 0]} material={carbonMat}>
        <cylinderGeometry args={[0.1, 0.1, 0.025, 14]} />
      </mesh>

      {/* Detailed Senna Helmet & Mirrored Visor */}
      <group position={[0, 0.65, -0.08]}>
        <mesh rotation={[0, -Math.PI / 2, 0]} castShadow>
          <sphereGeometry args={[0.17, 24, 18]} />
          <meshPhysicalMaterial
            map={isSennaHelmet ? sennaHelmetTex : undefined}
            color={isSennaHelmet ? '#ffffff' : livery.accent}
            roughness={realistic ? 0.12 : 0.14}
            metalness={0.25}
            clearcoat={1.0}
            clearcoatRoughness={realistic ? 0.04 : 0.05}
            envMapIntensity={realistic ? 1.6 : 1.0}
          />
        </mesh>
        {/* Mirrored dark visor */}
        <mesh position={[0, 0.02, -0.125]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.23, 0.07, 0.095]} />
          <meshStandardMaterial
            color="#09090b"
            roughness={realistic ? 0.04 : 0.08}
            metalness={realistic ? 1.0 : 0.92}
            envMapIntensity={realistic ? 2.0 : 1.0}
          />
        </mesh>
      </group>

      {/* Front Wing Assembly (Multi-plane + endplates) */}
      <group position={[0, 0.13, -2.38]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.98, 0.032, 0.44]} />
          <meshPhysicalMaterial
            color={livery.primary}
            roughness={realistic ? 0.18 : 0.22}
            metalness={realistic ? 0.25 : 0.3}
            clearcoat={1.0}
            clearcoatRoughness={realistic ? 0.04 : 0.08}
            envMapIntensity={realistic ? 1.6 : 1.0}
          />
        </mesh>
        <mesh position={[0, 0.042, 0.09]} rotation={[-0.22, 0, 0]} castShadow>
          <boxGeometry args={[1.9, 0.026, 0.19]} />
          <meshPhysicalMaterial
            ref={accentMatRef}
            color={livery.accent}
            roughness={realistic ? 0.18 : 0.24}
            metalness={realistic ? 0.25 : 0.3}
            clearcoat={1.0}
            clearcoatRoughness={realistic ? 0.04 : 0.08}
            envMapIntensity={realistic ? 1.6 : 1.0}
          />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.99, 0.075, 0]} castShadow material={carbonMat}>
            <boxGeometry args={[0.04, 0.18, 0.5]} />
          </mesh>
        ))}
      </group>

      {/* Rear Wing Assembly (Twin-plane + center pylon + endplates) */}
      <group position={[0, 0.84, 1.98]}>
        <mesh position={[0, -0.34, -0.05]} castShadow material={carbonMat}>
          <boxGeometry args={[0.085, 0.58, 0.24]} />
        </mesh>
        <mesh position={[0, 0.05, 0.02]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[1.4, 0.04, 0.36]} />
          <meshPhysicalMaterial
            color={livery.primary}
            roughness={realistic ? 0.18 : 0.22}
            metalness={realistic ? 0.25 : 0.3}
            clearcoat={1.0}
            clearcoatRoughness={realistic ? 0.04 : 0.08}
            envMapIntensity={realistic ? 1.6 : 1.0}
          />
        </mesh>
        <mesh position={[0, 0.155, 0.12]} rotation={[0.26, 0, 0]} castShadow>
          <boxGeometry args={[1.4, 0.03, 0.22]} />
          <meshPhysicalMaterial
            color={livery.secondary}
            roughness={realistic ? 0.18 : 0.22}
            metalness={realistic ? 0.25 : 0.3}
            clearcoat={1.0}
            clearcoatRoughness={realistic ? 0.04 : 0.08}
            envMapIntensity={realistic ? 1.6 : 1.0}
          />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.71, -0.06, 0.04]} castShadow>
            <boxGeometry args={[0.045, 0.52, 0.56]} />
            <meshPhysicalMaterial
              color={livery.secondary}
              roughness={realistic ? 0.18 : 0.25}
              metalness={realistic ? 0.25 : 0.3}
              clearcoat={1.0}
              clearcoatRoughness={realistic ? 0.04 : 0.08}
              envMapIntensity={realistic ? 1.6 : 1.0}
            />
          </mesh>
        ))}
      </group>

      {/* Rear Rain / Brake Light */}
      <mesh position={[0, 0.3, 2.15]}>
        <boxGeometry args={[0.11, 0.08, 0.04]} />
        <meshStandardMaterial
          ref={rearLightRef}
          color="#7f1d1d"
          emissive="#ef4444"
          emissiveIntensity={0.8}
          roughness={0.18}
          toneMapped={false}
        />
      </mesh>

      {/* Real Double-Wishbone V-Suspension (Two angled legs per wishbone) */}
      {([-1, 1] as const).map((side) => (
        <group key={`susp-${side}`}>
          {/* Front upper V-wishbone */}
          <mesh
            position={[side * 0.55, 0.31, -1.46]}
            rotation={[0, side * 0.26, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.78, 8]} />
          </mesh>
          <mesh
            position={[side * 0.55, 0.31, -1.24]}
            rotation={[0, side * -0.26, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.78, 8]} />
          </mesh>
          {/* Front lower V-wishbone */}
          <mesh
            position={[side * 0.55, 0.21, -1.44]}
            rotation={[0, side * 0.22, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.017, 0.017, 0.8, 8]} />
          </mesh>
          <mesh
            position={[side * 0.55, 0.21, -1.26]}
            rotation={[0, side * -0.22, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.017, 0.017, 0.8, 8]} />
          </mesh>

          {/* Rear upper V-wishbone */}
          <mesh
            position={[side * 0.58, 0.34, 1.38]}
            rotation={[0, side * -0.24, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.017, 0.017, 0.78, 8]} />
          </mesh>
          <mesh
            position={[side * 0.58, 0.34, 1.56]}
            rotation={[0, side * 0.24, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.017, 0.017, 0.78, 8]} />
          </mesh>
          {/* Rear lower V-wishbone */}
          <mesh
            position={[side * 0.58, 0.22, 1.4]}
            rotation={[0, side * -0.2, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.019, 0.019, 0.8, 8]} />
          </mesh>
          <mesh
            position={[side * 0.58, 0.22, 1.58]}
            rotation={[0, side * 0.2, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.019, 0.019, 0.8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Front Wheels (Steerable + Detailed Rims & Brakes) */}
      <group ref={frontLeftSteerRef} position={[-0.95, 0.31, -1.36]}>
        <DetailedWheel
          radius={0.31}
          width={0.34}
          sideSign={-1}
          tireTreadMat={tireTreadMat}
          tireSidewallMat={tireSidewallMat}
          rimMat={rimMat}
          brakeRotorMat={brakeRotorMat}
          caliperMat={caliperMat}
          spinRef={setWheelRef(0)}
        />
      </group>

      <group ref={frontRightSteerRef} position={[0.95, 0.31, -1.36]}>
        <DetailedWheel
          radius={0.31}
          width={0.34}
          sideSign={1}
          tireTreadMat={tireTreadMat}
          tireSidewallMat={tireSidewallMat}
          rimMat={rimMat}
          brakeRotorMat={brakeRotorMat}
          caliperMat={caliperMat}
          spinRef={setWheelRef(1)}
        />
      </group>

      {/* Rear Wheels (Wider Slicks + Detailed Rims & Brakes) */}
      <group position={[-0.99, 0.35, 1.48]}>
        <DetailedWheel
          radius={0.35}
          width={0.46}
          sideSign={-1}
          tireTreadMat={tireTreadMat}
          tireSidewallMat={tireSidewallMat}
          rimMat={rimMat}
          brakeRotorMat={brakeRotorMat}
          caliperMat={caliperMat}
          spinRef={setWheelRef(2)}
        />
      </group>

      <group position={[0.99, 0.35, 1.48]}>
        <DetailedWheel
          radius={0.35}
          width={0.46}
          sideSign={1}
          tireTreadMat={tireTreadMat}
          tireSidewallMat={tireSidewallMat}
          rimMat={rimMat}
          brakeRotorMat={brakeRotorMat}
          caliperMat={caliperMat}
          spinRef={setWheelRef(3)}
        />
      </group>
    </group>
  );
}

export function FormulaCar({
  realistic = false,
  liveryOverride,
  staticPose = false,
}: FormulaCarProps = {}) {
  const activeStageId = useGameStore((state) => state.activeStageId);

  const carGroupRef = useRef<THREE.Group>(null);
  const chassisTiltRef = useRef<THREE.Group>(null);
  const frontLeftSteerRef = useRef<THREE.Group>(null);
  const frontRightSteerRef = useRef<THREE.Group>(null);
  const wheelSpinRefs = useRef<(THREE.Group | null)[]>([]);
  const rearLightRef = useRef<THREE.MeshStandardMaterial>(null);
  const primaryMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const secondaryMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const accentMatRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const activeLivery = useMemo(() => {
    if (liveryOverride) {
      return liveryOverride;
    }
    if (activeStageId === null) {
      return DEFAULT_MCLAREN_LIVERY;
    }
    return STAGES.find((stage) => stage.id === activeStageId)?.car ?? DEFAULT_MCLAREN_LIVERY;
  }, [activeStageId, liveryOverride]);

  const targetPrimary = useMemo(() => new THREE.Color(DEFAULT_MCLAREN_LIVERY.primary), []);
  const targetSecondary = useMemo(() => new THREE.Color(DEFAULT_MCLAREN_LIVERY.secondary), []);
  const targetAccent = useMemo(() => new THREE.Color(DEFAULT_MCLAREN_LIVERY.accent), []);
  const wheelAngleRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const car = carGroupRef.current;
    if (!car) {
      return;
    }

    if (staticPose) {
      car.position.set(0, 0, 0);
      car.rotation.y = 0;
      if (chassisTiltRef.current) {
        chassisTiltRef.current.rotation.set(0, 0, 0);
      }
    } else {
      car.position.set(gameRuntime.position.x, gameRuntime.position.y, gameRuntime.position.z);
      car.rotation.y = gameRuntime.heading;

      if (chassisTiltRef.current) {
        chassisTiltRef.current.rotation.z = THREE.MathUtils.lerp(
          chassisTiltRef.current.rotation.z,
          gameRuntime.rotation.z,
          dt * 12
        );
        chassisTiltRef.current.rotation.x = THREE.MathUtils.lerp(
          chassisTiltRef.current.rotation.x,
          gameRuntime.rotation.x,
          dt * 12
        );
      }

      const steerAngle = -gameRuntime.steering * 0.36;
      if (frontLeftSteerRef.current) {
        frontLeftSteerRef.current.rotation.y = steerAngle;
      }
      if (frontRightSteerRef.current) {
        frontRightSteerRef.current.rotation.y = steerAngle;
      }

      const speedMetersPerSec = gameRuntime.speed / 3.6;
      wheelAngleRef.current -= (speedMetersPerSec / 0.34) * dt;
      for (let i = 0; i < wheelSpinRefs.current.length; i++) {
        const wheel = wheelSpinRefs.current[i];
        if (wheel) {
          wheel.rotation.x = wheelAngleRef.current;
        }
      }
    }

    const activeStage =
      gameRuntime.activeStageId !== null
        ? STAGES.find((stage) => stage.id === gameRuntime.activeStageId)
        : undefined;
    const desiredLivery = liveryOverride ?? (activeStage ? activeStage.car : DEFAULT_MCLAREN_LIVERY);

    targetPrimary.set(desiredLivery.primary);
    targetSecondary.set(desiredLivery.secondary);
    targetAccent.set(desiredLivery.accent);

    const wetClearcoat = realistic ? 1.0 : gameRuntime.rainIntensity > 0.2 ? 1.0 : 0.92;
    const wetRoughness = realistic ? 0.18 : gameRuntime.rainIntensity > 0.2 ? 0.12 : 0.22;
    const targetMetalness = realistic ? 0.25 : 0.32;

    if (primaryMatRef.current) {
      primaryMatRef.current.color.lerp(targetPrimary, dt * 5);
      primaryMatRef.current.roughness = THREE.MathUtils.lerp(
        primaryMatRef.current.roughness,
        wetRoughness,
        dt * 4
      );
      primaryMatRef.current.metalness = targetMetalness;
      primaryMatRef.current.clearcoat = wetClearcoat;
      primaryMatRef.current.clearcoatRoughness = realistic ? 0.04 : 0.08;
      primaryMatRef.current.envMapIntensity = realistic ? 1.6 : 1.0;
    }

    if (secondaryMatRef.current) {
      secondaryMatRef.current.color.lerp(targetSecondary, dt * 5);
      secondaryMatRef.current.roughness = THREE.MathUtils.lerp(
        secondaryMatRef.current.roughness,
        wetRoughness,
        dt * 4
      );
      secondaryMatRef.current.metalness = targetMetalness;
      secondaryMatRef.current.clearcoatRoughness = realistic ? 0.04 : 0.08;
      secondaryMatRef.current.envMapIntensity = realistic ? 1.6 : 1.0;
    }

    if (accentMatRef.current) {
      accentMatRef.current.color.lerp(targetAccent, dt * 5);
    }

    if (rearLightRef.current) {
      if (staticPose) {
        rearLightRef.current.emissiveIntensity = 1.1;
      } else {
        const isRain = gameRuntime.rainIntensity > 0.25;
        const blink = isRain ? (Math.sin(state.clock.elapsedTime * 14) > 0 ? 4.2 : 0.35) : 0.55;
        const brakeBoost = gameRuntime.brake > 0.1 ? 4.8 : blink;
        rearLightRef.current.emissiveIntensity = brakeBoost;
      }
    }
  });

  return (
    <group ref={carGroupRef}>
      <group ref={chassisTiltRef}>
        <FormulaChassis
          livery={activeLivery}
          isSennaHelmet
          realistic={realistic}
          rearLightRef={rearLightRef}
          primaryMatRef={primaryMatRef}
          secondaryMatRef={secondaryMatRef}
          accentMatRef={accentMatRef}
          frontLeftSteerRef={frontLeftSteerRef}
          frontRightSteerRef={frontRightSteerRef}
          wheelSpinRefs={wheelSpinRefs}
        />
      </group>
    </group>
  );
}
