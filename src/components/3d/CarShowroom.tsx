import { useEffect, useMemo, useRef } from 'react';
import {
  ContactShadows,
  Environment as DreiEnvironment,
  Lightformer,
  OrbitControls,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TIMELINE_CARS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { ShowroomAngleZone } from '../../types/game';
import { FormulaCar } from './FormulaCar';

function resolveAngleZone(cameraPos: THREE.Vector3): ShowroomAngleZone {
  // Car nose points toward -Z; compute azimuth in degrees [0, 360) around Y
  const rad = Math.atan2(cameraPos.x, -cameraPos.z);
  const deg = ((rad * 180) / Math.PI + 360) % 360;

  if (deg >= 315 || deg < 45) {
    return 'front';
  }
  if (deg >= 45 && deg < 135) {
    return 'right';
  }
  if (deg >= 135 && deg < 225) {
    return 'rear';
  }
  return 'left';
}

export function CarShowroom() {
  const { camera } = useThree();
  const selectedIndex = useGameStore((state) => state.selectedTimelineIndex);
  const setShowroomZone = useGameStore((state) => state.setShowroomZone);
  const selectedCar = TIMELINE_CARS[selectedIndex] ?? TIMELINE_CARS[0]!;

  const lastZoneRef = useRef<ShowroomAngleZone>('front');
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  const targetAccent = useMemo(() => new THREE.Color('#facc15'), []);

  // Reset studio hero camera angle when entering Showroom
  useEffect(() => {
    camera.position.set(-3.4, 1.8, -5.2);
    camera.lookAt(0, 0.45, 0);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 44;
      camera.updateProjectionMatrix();
    }
    lastZoneRef.current = 'front';
    setShowroomZone('front');
  }, [camera, setShowroomZone]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const currentZone = resolveAngleZone(camera.position);

    if (currentZone !== lastZoneRef.current) {
      lastZoneRef.current = currentZone;
      setShowroomZone(currentZone);
    }

    if (ringRef.current) {
      const accentHex =
        selectedCar.livery.secondary === '#09090B'
          ? selectedCar.livery.accent
          : selectedCar.livery.secondary;
      targetAccent.set(accentHex);
      ringRef.current.color.lerp(targetAccent, dt * 4);
    }
  });

  return (
    <>
      <color attach="background" args={['#070709']} />
      <fog attach="fog" args={['#070709', 14, 34]} />

      {/* Professional Automotive Photography Studio IBL */}
      <DreiEnvironment resolution={512} frames={1}>
        <Lightformer
          form="rect"
          intensity={3.6}
          color="#ffffff"
          scale={[12, 2.2, 1]}
          position={[0, 6.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#f8fafc"
          scale={[10, 1.6, 1]}
          position={[0, 5.2, -5.5]}
          rotation={[Math.PI / 3, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#e2e8f0"
          scale={[14, 1.8, 1]}
          position={[-7, 3.2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#fde68a"
          scale={[14, 1.8, 1]}
          position={[7, 3.2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        <Lightformer
          form="ring"
          intensity={1.5}
          color="#facc15"
          scale={8}
          position={[0, 1.2, 7.5]}
        />
      </DreiEnvironment>

      {/* Key + Rim Studio Lights */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4.5, 8.5, -5.5]}
        intensity={2.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0003}
      />
      <spotLight
        position={[-5.5, 5.0, 5.5]}
        angle={0.55}
        penumbra={0.75}
        intensity={35}
        color="#fde68a"
      />

      {/* Reflective Dark Studio Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <circleGeometry args={[36, 64]} />
        <meshStandardMaterial color="#09090b" roughness={0.22} metalness={0.68} />
      </mesh>

      {/* Turntable Platform & Luminous Studio Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[3.35, 3.42, 72]} />
        <meshBasicMaterial ref={ringRef} color="#facc15" transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[3.85, 3.88, 72]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>

      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.82}
        scale={11}
        blur={1.8}
        far={4}
        resolution={512}
        color="#000000"
      />

      {/* Realistic Clearcoat F1 Car on Turntable */}
      <FormulaCar realistic staticPose liveryOverride={selectedCar.livery} />

      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.2}
        minDistance={4.2}
        maxDistance={11.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.45, 0]}
      />
    </>
  );
}
