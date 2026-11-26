import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ContactShadows,
  Environment as DreiEnvironment,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { TIMELINE_CARS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { ShowroomAngleZone } from '../../types/game';
import { ShowroomCar } from './ShowroomCar';

const SHOWROOM_GLB_PATH = '/models/senna-showroom.glb';

class GlbErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  public state = { hasError: false };

  public static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function GlbShowroomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const normalizedScene = useMemo(() => {
    const cloned = scene.clone(true);
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxHoriz = Math.max(size.x, size.z, 0.001);
    const scale = 4.8 / maxHoriz;
    cloned.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(cloned);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    cloned.position.set(-scaledCenter.x, -scaledBox.min.y, -scaledCenter.z);

    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    return cloned;
  }, [scene]);

  return <primitive object={normalizedScene} />;
}

function resolveAngleZone(cameraPos: THREE.Vector3): ShowroomAngleZone {
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

const cockpitTarget = new THREE.Vector3(0, 0.58, -0.15);
const defaultTarget = new THREE.Vector3(0, 0.42, 0);

export function CarShowroom() {
  const { camera } = useThree();
  const selectedIndex = useGameStore((state) => state.selectedTimelineIndex);
  const quality = useGameStore((state) => state.settings.quality);
  const explodedCockpit = useGameStore((state) => state.explodedParts.cockpit);
  const activeInspectedPart = useGameStore((state) => state.activeInspectedPart);
  const setShowroomZone = useGameStore((state) => state.setShowroomZone);
  const selectedCar = TIMELINE_CARS[selectedIndex] ?? TIMELINE_CARS[0]!;

  const [hasValidGlb, setHasValidGlb] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lastZoneRef = useRef<ShowroomAngleZone>('front');
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);
  const targetAccent = useMemo(() => new THREE.Color('#facc15'), []);

  useEffect(() => {
    let cancelled = false;

    async function checkOptionalGlb() {
      try {
        const res = await fetch(SHOWROOM_GLB_PATH);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 12) return;
        const view = new Uint8Array(buf, 0, 4);
        const isBinaryGltf =
          view[0] === 0x67 && view[1] === 0x6c && view[2] === 0x54 && view[3] === 0x46;
        if (!cancelled && isBinaryGltf) {
          setHasValidGlb(true);
        }
      } catch {
        // Optional GLB not present
      }
    }

    void checkOptionalGlb();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    camera.position.set(-4.5, 1.32, -6.7);
    camera.lookAt(0, 0.42, 0);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 35;
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

    // Smooth technical zoom into Cockpit when Cockpit inspection is active
    if (controlsRef.current) {
      const wantCockpitZoom = explodedCockpit && activeInspectedPart === 'cockpit';
      const goalTarget = wantCockpitZoom ? cockpitTarget : defaultTarget;
      controlsRef.current.target.lerp(goalTarget, dt * 4.5);

      if (wantCockpitZoom) {
        const dist = camera.position.distanceTo(controlsRef.current.target);
        if (dist > 4.6) {
          const dir = camera.position.clone().sub(controlsRef.current.target).normalize();
          const goalPos = controlsRef.current.target.clone().addScaledVector(dir, 4.2);
          goalPos.y = Math.max(1.5, goalPos.y);
          camera.position.lerp(goalPos, dt * 3.5);
        }
      }
      controlsRef.current.update();
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

  const proceduralFallback = <ShowroomCar car={selectedCar} />;

  return (
    <>
      <color attach="background" args={['#060608']} />
      <fog attach="fog" args={['#060608', 15, 36]} />

      <DreiEnvironment resolution={1024} frames={1}>
        <Lightformer
          form="rect"
          intensity={4.2}
          color="#ffffff"
          scale={[3.2, 11.5, 1]}
          position={[0, 6.4, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#e0f2fe"
          scale={[12, 2.4, 1]}
          position={[-6.8, 2.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fef3c7"
          scale={[12, 2.4, 1]}
          position={[6.8, 2.5, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#fde68a"
          scale={[9, 1.5, 1]}
          position={[0, 3.2, 7.2]}
          rotation={[0, Math.PI, 0]}
        />
      </DreiEnvironment>

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4.2, 8.8, -5.8]}
        intensity={2.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0003}
      />
      <spotLight
        position={[0, 5.2, 7.0]}
        angle={0.48}
        penumbra={0.8}
        intensity={42}
        color="#fde68a"
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <circleGeometry args={[34, 64]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={45}
          roughness={0.35}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0a0c"
          metalness={0.6}
          mirror={0.55}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[3.35, 3.41, 72]} />
        <meshBasicMaterial ref={ringRef} color="#facc15" transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[3.88, 3.91, 72]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>

      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.85}
        scale={12}
        blur={1.8}
        far={3}
        resolution={512}
        color="#000000"
      />

      {hasValidGlb ? (
        <GlbErrorBoundary fallback={proceduralFallback}>
          <Suspense fallback={proceduralFallback}>
            <GlbShowroomModel url={SHOWROOM_GLB_PATH} />
          </Suspense>
        </GlbErrorBoundary>
      ) : (
        proceduralFallback
      )}

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        autoRotate={!explodedCockpit}
        autoRotateSpeed={1.2}
        minDistance={3.6}
        maxDistance={13.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.42, 0]}
      />

      {quality !== 'low' && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={1.0}
            luminanceSmoothing={0.25}
            intensity={0.28}
          />
          <Vignette eskil={false} offset={0.24} darkness={0.45} />
        </EffectComposer>
      )}
    </>
  );
}
