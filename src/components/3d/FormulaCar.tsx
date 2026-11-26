import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEFAULT_MCLAREN_LIVERY, STAGES } from '../../data/sennaData';
import type { CarLivery } from '../../types/game';
import { gameRuntime } from '../../utils/runtime';

interface FormulaChassisProps {
  livery: CarLivery;
  isSennaHelmet?: boolean;
  rearLightRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  primaryMatRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  secondaryMatRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  accentMatRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  frontLeftSteerRef?: React.RefObject<THREE.Group | null>;
  frontRightSteerRef?: React.RefObject<THREE.Group | null>;
  wheelSpinRefs?: React.MutableRefObject<(THREE.Group | null)[]>;
}

export function FormulaChassis({
  livery,
  isSennaHelmet = true,
  rearLightRef,
  primaryMatRef,
  secondaryMatRef,
  accentMatRef,
  frontLeftSteerRef,
  frontRightSteerRef,
  wheelSpinRefs,
}: FormulaChassisProps) {
  const tireMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#141417',
        roughness: 0.88,
        metalness: 0.08,
      }),
    []
  );

  const carbonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#18181b',
        roughness: 0.52,
        metalness: 0.45,
      }),
    []
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4d4d8',
        roughness: 0.25,
        metalness: 0.85,
      }),
    []
  );

  useEffect(() => {
    return () => {
      tireMat.dispose();
      carbonMat.dispose();
      rimMat.dispose();
    };
  }, [carbonMat, rimMat, tireMat]);

  const setWheelRef = (index: number) => (el: THREE.Group | null) => {
    if (wheelSpinRefs) {
      wheelSpinRefs.current[index] = el;
    }
  };

  return (
    <group>
      {/* Floor plank & rear diffuser */}
      <mesh position={[0, 0.14, 0.15]} castShadow receiveShadow material={carbonMat}>
        <boxGeometry args={[1.42, 0.06, 3.6]} />
      </mesh>
      <mesh position={[0, 0.19, 1.98]} rotation={[0.24, 0, 0]} castShadow material={carbonMat}>
        <boxGeometry args={[1.15, 0.08, 0.55]} />
      </mesh>

      {/* Main monocoque tub */}
      <mesh position={[0, 0.36, 0.18]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.36, 2.25]} />
        <meshStandardMaterial
          ref={primaryMatRef}
          color={livery.primary}
          roughness={0.26}
          metalness={0.25}
        />
      </mesh>

      {/* Tapered nose cone */}
      <mesh position={[0, 0.31, -1.42]} rotation={[-0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.24, 1.15]} />
        <meshStandardMaterial
          color={livery.primary}
          roughness={0.26}
          metalness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.26, -2.14]} rotation={[-0.12, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.16, 0.45]} />
        <meshStandardMaterial
          ref={secondaryMatRef}
          color={livery.secondary}
          roughness={0.28}
          metalness={0.25}
        />
      </mesh>

      {/* Engine cover & dorsal spine */}
      <mesh position={[0, 0.56, 0.85]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.42, 1.5]} />
        <meshStandardMaterial color={livery.secondary} roughness={0.28} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.81, 0.62]} castShadow>
        <boxGeometry args={[0.24, 0.28, 0.95]} />
        <meshStandardMaterial color={livery.primary} roughness={0.28} metalness={0.25} />
      </mesh>

      {/* Roll hoop & airbox intake */}
      <mesh position={[0, 0.91, 0.16]} castShadow material={carbonMat}>
        <boxGeometry args={[0.28, 0.18, 0.22]} />
      </mesh>
      <mesh position={[0, 0.92, 0.04]} material={carbonMat}>
        <boxGeometry args={[0.2, 0.12, 0.08]} />
      </mesh>

      {/* Sculpted Sidepods (Left & Right) */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.58, 0.34, 0.42]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.48, 0.3, 1.75]} />
            <meshStandardMaterial color={livery.primary} roughness={0.26} metalness={0.25} />
          </mesh>
          {/* Sidepod livery accent panel */}
          <mesh position={[side * 0.02, 0.03, 0.12]} castShadow>
            <boxGeometry args={[0.46, 0.18, 1.15]} />
            <meshStandardMaterial color={livery.secondary} roughness={0.28} metalness={0.25} />
          </mesh>
          {/* Radiator intake opening */}
          <mesh position={[0, 0.01, -0.89]} material={carbonMat}>
            <boxGeometry args={[0.38, 0.22, 0.06]} />
          </mesh>
          {/* Sidepod rear undercut */}
          <mesh position={[-side * 0.06, -0.02, 0.98]} rotation={[0, side * 0.22, 0]}>
            <boxGeometry args={[0.34, 0.24, 0.52]} />
            <meshStandardMaterial color={livery.secondary} roughness={0.3} metalness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Cockpit opening & seat */}
      <mesh position={[0, 0.53, -0.18]} material={carbonMat}>
        <boxGeometry args={[0.48, 0.08, 0.72]} />
      </mesh>
      <mesh position={[0, 0.48, -0.02]} rotation={[-0.3, 0, 0]} material={carbonMat}>
        <boxGeometry args={[0.36, 0.26, 0.16]} />
      </mesh>
      {/* Steering wheel */}
      <mesh position={[0, 0.54, -0.44]} rotation={[0.35, 0, 0]} material={carbonMat}>
        <cylinderGeometry args={[0.11, 0.11, 0.03, 12]} />
      </mesh>

      {/* Driver Helmet */}
      <group position={[0, 0.69, -0.08]}>
        <mesh castShadow>
          <sphereGeometry args={[0.175, 20, 16]} />
          <meshStandardMaterial
            color={isSennaHelmet ? '#FACC15' : livery.accent}
            roughness={0.22}
            metalness={0.35}
          />
        </mesh>
        {/* Helmet green & blue stripes for Ayrton Senna */}
        {isSennaHelmet && (
          <>
            <mesh position={[0, 0.01, 0.01]} rotation={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.179, 0.179, 0.032, 20]} />
              <meshStandardMaterial color="#16A34A" roughness={0.25} metalness={0.2} />
            </mesh>
            <mesh position={[0, -0.032, 0.01]} rotation={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.178, 0.178, 0.024, 20]} />
              <meshStandardMaterial color="#1D4ED8" roughness={0.25} metalness={0.2} />
            </mesh>
          </>
        )}
        {/* Dark visor */}
        <mesh position={[0, 0.02, -0.13]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.24, 0.075, 0.1]} />
          <meshStandardMaterial color="#09090B" roughness={0.12} metalness={0.85} />
        </mesh>
      </group>

      {/* Front Wing Assembly */}
      <group position={[0, 0.17, -2.25]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.92, 0.04, 0.42]} />
          <meshStandardMaterial color={livery.primary} roughness={0.28} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.045, 0.08]} rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[1.86, 0.03, 0.18]} />
          <meshStandardMaterial
            ref={accentMatRef}
            color={livery.accent}
            roughness={0.3}
            metalness={0.25}
          />
        </mesh>
        {/* Front wing endplates */}
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.96, 0.07, 0]} castShadow material={carbonMat}>
            <boxGeometry args={[0.04, 0.18, 0.48]} />
          </mesh>
        ))}
      </group>

      {/* Rear Wing Assembly (twin-plane + endplates + strut) */}
      <group position={[0, 0.88, 1.92]}>
        <mesh position={[0, -0.32, -0.05]} castShadow material={carbonMat}>
          <boxGeometry args={[0.12, 0.56, 0.24]} />
        </mesh>
        <mesh position={[0, 0.05, 0.02]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[1.38, 0.045, 0.36]} />
          <meshStandardMaterial color={livery.primary} roughness={0.28} metalness={0.25} />
        </mesh>
        <mesh position={[0, 0.15, 0.11]} rotation={[0.24, 0, 0]} castShadow>
          <boxGeometry args={[1.38, 0.035, 0.22]} />
          <meshStandardMaterial color={livery.secondary} roughness={0.28} metalness={0.25} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.7, -0.06, 0.04]} castShadow>
            <boxGeometry args={[0.045, 0.52, 0.56]} />
            <meshStandardMaterial color={livery.secondary} roughness={0.3} metalness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Rear rain / brake light */}
      <mesh position={[0, 0.34, 2.08]}>
        <boxGeometry args={[0.11, 0.08, 0.04]} />
        <meshStandardMaterial
          ref={rearLightRef}
          color="#7f1d1d"
          emissive="#ef4444"
          emissiveIntensity={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Suspension wishbones */}
      {([-1, 1] as const).map((side) => (
        <group key={`susp-${side}`}>
          <mesh position={[side * 0.52, 0.28, -1.32]} rotation={[0, 0, side * 0.08]} material={carbonMat}>
            <boxGeometry args={[0.68, 0.035, 0.16]} />
          </mesh>
          <mesh position={[side * 0.54, 0.3, 1.48]} rotation={[0, 0, -side * 0.06]} material={carbonMat}>
            <boxGeometry args={[0.7, 0.04, 0.2]} />
          </mesh>
        </group>
      ))}

      {/* Front Wheels (steerable) */}
      <group ref={frontLeftSteerRef} position={[-0.92, 0.32, -1.32]}>
        <group ref={setWheelRef(0)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.32, 0.32, 0.34, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.17, 0.17, 0.35, 16]} />
          </mesh>
        </group>
      </group>

      <group ref={frontRightSteerRef} position={[0.92, 0.32, -1.32]}>
        <group ref={setWheelRef(1)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.32, 0.32, 0.34, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.17, 0.17, 0.35, 16]} />
          </mesh>
        </group>
      </group>

      {/* Rear Wheels (wider slicks) */}
      <group position={[-0.96, 0.36, 1.48]}>
        <group ref={setWheelRef(2)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.36, 0.36, 0.46, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.19, 0.19, 0.47, 16]} />
          </mesh>
        </group>
      </group>

      <group position={[0.96, 0.36, 1.48]}>
        <group ref={setWheelRef(3)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.36, 0.36, 0.46, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.19, 0.19, 0.47, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function FormulaCar() {
  const carGroupRef = useRef<THREE.Group>(null);
  const chassisTiltRef = useRef<THREE.Group>(null);
  const frontLeftSteerRef = useRef<THREE.Group>(null);
  const frontRightSteerRef = useRef<THREE.Group>(null);
  const wheelSpinRefs = useRef<(THREE.Group | null)[]>([]);
  const rearLightRef = useRef<THREE.MeshStandardMaterial>(null);
  const primaryMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const secondaryMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentMatRef = useRef<THREE.MeshStandardMaterial>(null);

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

    const activeStage =
      gameRuntime.activeStageId !== null
        ? STAGES.find((stage) => stage.id === gameRuntime.activeStageId)
        : undefined;
    const desiredLivery = activeStage ? activeStage.car : DEFAULT_MCLAREN_LIVERY;

    targetPrimary.set(desiredLivery.primary);
    targetSecondary.set(desiredLivery.secondary);
    targetAccent.set(desiredLivery.accent);

    const wetRoughness = gameRuntime.rainIntensity > 0.2 ? 0.1 : 0.26;
    const wetMetalness = gameRuntime.rainIntensity > 0.2 ? 0.48 : 0.25;

    if (primaryMatRef.current) {
      primaryMatRef.current.color.lerp(targetPrimary, dt * 4);
      primaryMatRef.current.roughness = THREE.MathUtils.lerp(
        primaryMatRef.current.roughness,
        wetRoughness,
        dt * 4
      );
      primaryMatRef.current.metalness = THREE.MathUtils.lerp(
        primaryMatRef.current.metalness,
        wetMetalness,
        dt * 4
      );
    }

    if (secondaryMatRef.current) {
      secondaryMatRef.current.color.lerp(targetSecondary, dt * 4);
      secondaryMatRef.current.roughness = THREE.MathUtils.lerp(
        secondaryMatRef.current.roughness,
        wetRoughness,
        dt * 4
      );
    }

    if (accentMatRef.current) {
      accentMatRef.current.color.lerp(targetAccent, dt * 4);
    }

    if (rearLightRef.current) {
      const isRain = gameRuntime.rainIntensity > 0.25;
      const blink = isRain ? (Math.sin(state.clock.elapsedTime * 14) > 0 ? 3.2 : 0.3) : 0.4;
      const brakeBoost = gameRuntime.brake > 0.1 ? 3.8 : blink;
      rearLightRef.current.emissiveIntensity = brakeBoost;
    }
  });

  return (
    <group ref={carGroupRef}>
      <group ref={chassisTiltRef}>
        <FormulaChassis
          livery={DEFAULT_MCLAREN_LIVERY}
          isSennaHelmet
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
