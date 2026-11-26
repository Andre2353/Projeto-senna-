import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DEFAULT_MCLAREN_LIVERY, STAGES } from '../../data/sennaData';
import type { CarLivery } from '../../types/game';
import { getToonGradientMap } from '../../utils/performance';
import { gameRuntime } from '../../utils/runtime';

interface FormulaChassisProps {
  livery: CarLivery;
  isSennaHelmet?: boolean;
  rearLightRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  primaryMatRef?: React.RefObject<THREE.MeshToonMaterial | null>;
  secondaryMatRef?: React.RefObject<THREE.MeshToonMaterial | null>;
  accentMatRef?: React.RefObject<THREE.MeshToonMaterial | null>;
  frontLeftSteerRef?: React.RefObject<THREE.Group | null>;
  frontRightSteerRef?: React.RefObject<THREE.Group | null>;
  wheelSpinRefs?: React.MutableRefObject<(THREE.Group | null)[]>;
}

function createBodyworkCowlingGeometry(): THREE.ExtrudeGeometry {
  // Sleek side-view silhouette of an 80s/90s F1 monocoque + engine cover
  const shape = new THREE.Shape();
  shape.moveTo(-2.3, 0.16);
  shape.lineTo(-1.35, 0.28);
  shape.lineTo(-0.55, 0.44);
  shape.lineTo(0.05, 0.44);
  shape.lineTo(0.22, 0.84); // roll hoop peak
  shape.lineTo(0.88, 0.72);
  shape.lineTo(1.75, 0.46);
  shape.lineTo(1.85, 0.18);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  geo.rotateY(Math.PI / 2);
  geo.translate(-0.23, 0, 0);
  geo.computeVertexNormals();
  return geo;
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
  const gradientMap = useMemo(() => getToonGradientMap(), []);
  const cowlingGeo = useMemo(() => createBodyworkCowlingGeometry(), []);

  const outlineMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#09090b',
        side: THREE.BackSide,
      }),
    []
  );

  const tireMat = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: '#18181b',
        gradientMap,
      }),
    [gradientMap]
  );

  const carbonMat = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: '#27272a',
        gradientMap,
      }),
    [gradientMap]
  );

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e4e4e7',
        roughness: 0.25,
        metalness: 0.82,
      }),
    []
  );

  useEffect(() => {
    return () => {
      cowlingGeo.dispose();
      outlineMat.dispose();
      tireMat.dispose();
      carbonMat.dispose();
      rimMat.dispose();
    };
  }, [carbonMat, cowlingGeo, outlineMat, rimMat, tireMat]);

  const setWheelRef = (index: number) => (el: THREE.Group | null) => {
    if (wheelSpinRefs) {
      wheelSpinRefs.current[index] = el;
    }
  };

  return (
    <group>
      {/* Low Venturi Floorplank & Rear Diffuser */}
      <mesh position={[0, 0.11, 0.15]} castShadow receiveShadow material={carbonMat}>
        <boxGeometry args={[1.38, 0.05, 3.8]} />
      </mesh>
      <mesh position={[0, 0.17, 2.02]} rotation={[0.26, 0, 0]} castShadow material={carbonMat}>
        <boxGeometry args={[1.08, 0.07, 0.54]} />
      </mesh>

      {/* Sculpted Central Monocoque + Engine Cover Cowling */}
      <mesh geometry={cowlingGeo} castShadow receiveShadow>
        <meshToonMaterial ref={primaryMatRef} color={livery.primary} gradientMap={gradientMap} />
      </mesh>
      <mesh geometry={cowlingGeo} scale={[1.045, 1.045, 1.015]} material={outlineMat} />

      {/* Tapered Cylindrical Nose Cone */}
      <mesh
        position={[0, 0.26, -1.68]}
        rotation={[Math.PI / 2 - 0.08, 0, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.13, 0.31, 1.45, 16]} />
        <meshToonMaterial ref={secondaryMatRef} color={livery.secondary} gradientMap={gradientMap} />
      </mesh>
      <mesh
        position={[0, 0.26, -1.68]}
        rotation={[Math.PI / 2 - 0.08, 0, 0]}
        scale={[1.06, 1.01, 1.06]}
        material={outlineMat}
      >
        <cylinderGeometry args={[0.13, 0.31, 1.45, 16]} />
      </mesh>

      {/* Sculpted Engine Cover Livery Stripe */}
      <mesh position={[0, 0.56, 0.96]} rotation={[-0.24, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 1.35, 14]} />
        <meshToonMaterial color={livery.secondary} gradientMap={gradientMap} />
      </mesh>

      {/* Airbox Intake Scoop */}
      <mesh position={[0, 0.83, 0.16]} material={carbonMat}>
        <cylinderGeometry args={[0.11, 0.13, 0.22, 12]} />
      </mesh>

      {/* Sculpted Coke-Bottle Sidepods (Left & Right) */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.52, 0.28, 0.45]}>
          <mesh rotation={[Math.PI / 2, 0, side * -0.06]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.27, 1.85, 14]} />
            <meshToonMaterial color={livery.primary} gradientMap={gradientMap} />
          </mesh>
          <mesh
            rotation={[Math.PI / 2, 0, side * -0.06]}
            scale={[1.06, 1.01, 1.06]}
            material={outlineMat}
          >
            <cylinderGeometry args={[0.2, 0.27, 1.85, 14]} />
          </mesh>
          {/* Sidepod livery accent band */}
          <mesh position={[side * 0.03, 0.04, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.22, 1.15, 12]} />
            <meshToonMaterial color={livery.secondary} gradientMap={gradientMap} />
          </mesh>
          {/* Dark radiator air intake */}
          <mesh position={[0, 0, -0.93]} material={carbonMat}>
            <boxGeometry args={[0.34, 0.2, 0.06]} />
          </mesh>
        </group>
      ))}

      {/* Open Cockpit Tub & Steering Wheel */}
      <mesh position={[0, 0.48, -0.18]} material={carbonMat}>
        <boxGeometry args={[0.42, 0.08, 0.72]} />
      </mesh>
      <mesh position={[0, 0.51, -0.44]} rotation={[0.35, 0, 0]} material={carbonMat}>
        <cylinderGeometry args={[0.1, 0.1, 0.025, 12]} />
      </mesh>

      {/* Driver Helmet (Senna Iconic Yellow/Green/Blue) */}
      <group position={[0, 0.65, -0.08]}>
        <mesh castShadow>
          <sphereGeometry args={[0.17, 20, 16]} />
          <meshToonMaterial
            color={isSennaHelmet ? '#FACC15' : livery.accent}
            gradientMap={gradientMap}
          />
        </mesh>
        <mesh scale={[1.06, 1.06, 1.06]} material={outlineMat}>
          <sphereGeometry args={[0.17, 16, 12]} />
        </mesh>
        {isSennaHelmet && (
          <>
            <mesh position={[0, 0.01, 0.01]} rotation={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.174, 0.174, 0.03, 20]} />
              <meshToonMaterial color="#16A34A" gradientMap={gradientMap} />
            </mesh>
            <mesh position={[0, -0.03, 0.01]} rotation={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.173, 0.173, 0.024, 20]} />
              <meshToonMaterial color="#1D4ED8" gradientMap={gradientMap} />
            </mesh>
          </>
        )}
        <mesh position={[0, 0.02, -0.125]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.23, 0.07, 0.09]} />
          <meshStandardMaterial color="#09090B" roughness={0.12} metalness={0.85} />
        </mesh>
      </group>

      {/* Front Wing Assembly (Low, wide, sculpted endplates) */}
      <group position={[0, 0.14, -2.35]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.96, 0.035, 0.42]} />
          <meshToonMaterial color={livery.primary} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, 0.04, 0.08]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.88, 0.025, 0.18]} />
          <meshToonMaterial ref={accentMatRef} color={livery.accent} gradientMap={gradientMap} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.98, 0.065, 0]} castShadow material={carbonMat}>
            <boxGeometry args={[0.04, 0.16, 0.48]} />
          </mesh>
        ))}
      </group>

      {/* Rear Wing Assembly (Twin-plane + center pylon + endplates) */}
      <group position={[0, 0.84, 1.96]}>
        <mesh position={[0, -0.34, -0.05]} castShadow material={carbonMat}>
          <boxGeometry args={[0.09, 0.56, 0.24]} />
        </mesh>
        <mesh position={[0, 0.05, 0.02]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[1.38, 0.04, 0.34]} />
          <meshToonMaterial color={livery.primary} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, 0.15, 0.11]} rotation={[0.24, 0, 0]} castShadow>
          <boxGeometry args={[1.38, 0.03, 0.21]} />
          <meshToonMaterial color={livery.secondary} gradientMap={gradientMap} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh key={side} position={[side * 0.7, -0.06, 0.04]} castShadow>
            <boxGeometry args={[0.045, 0.5, 0.54]} />
            <meshToonMaterial color={livery.secondary} gradientMap={gradientMap} />
          </mesh>
        ))}
      </group>

      {/* Rear Rain / Brake Light */}
      <mesh position={[0, 0.3, 2.12]}>
        <boxGeometry args={[0.1, 0.075, 0.04]} />
        <meshStandardMaterial
          ref={rearLightRef}
          color="#7f1d1d"
          emissive="#ef4444"
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Thin Tubular Suspension Wishbone Arms connecting chassis to all 4 wheels */}
      {([-1, 1] as const).map((side) => (
        <group key={`susp-${side}`}>
          {/* Front upper & lower wishbone rods */}
          <mesh
            position={[side * 0.54, 0.31, -1.36]}
            rotation={[0, side * 0.18, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.76, 8]} />
          </mesh>
          <mesh
            position={[side * 0.54, 0.22, -1.3]}
            rotation={[0, side * -0.18, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.78, 8]} />
          </mesh>
          {/* Rear upper & lower wishbone rods */}
          <mesh
            position={[side * 0.56, 0.34, 1.44]}
            rotation={[0, side * -0.15, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.78, 8]} />
          </mesh>
          <mesh
            position={[side * 0.56, 0.23, 1.52]}
            rotation={[0, side * 0.16, Math.PI / 2]}
            material={carbonMat}
          >
            <cylinderGeometry args={[0.022, 0.022, 0.8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Front Wheels (steerable) */}
      <group ref={frontLeftSteerRef} position={[-0.94, 0.31, -1.36]}>
        <group ref={setWheelRef(0)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.31, 0.31, 0.34, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.16, 0.16, 0.35, 16]} />
          </mesh>
        </group>
      </group>

      <group ref={frontRightSteerRef} position={[0.94, 0.31, -1.36]}>
        <group ref={setWheelRef(1)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.31, 0.31, 0.34, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.16, 0.16, 0.35, 16]} />
          </mesh>
        </group>
      </group>

      {/* Rear Wheels (wider slicks) */}
      <group position={[-0.98, 0.35, 1.48]}>
        <group ref={setWheelRef(2)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.35, 0.35, 0.46, 24]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
            <cylinderGeometry args={[0.19, 0.19, 0.47, 16]} />
          </mesh>
        </group>
      </group>

      <group position={[0.98, 0.35, 1.48]}>
        <group ref={setWheelRef(3)}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={tireMat}>
            <cylinderGeometry args={[0.35, 0.35, 0.46, 24]} />
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
  const primaryMatRef = useRef<THREE.MeshToonMaterial>(null);
  const secondaryMatRef = useRef<THREE.MeshToonMaterial>(null);
  const accentMatRef = useRef<THREE.MeshToonMaterial>(null);

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

    if (primaryMatRef.current) {
      primaryMatRef.current.color.lerp(targetPrimary, dt * 4);
    }

    if (secondaryMatRef.current) {
      secondaryMatRef.current.color.lerp(targetSecondary, dt * 4);
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
