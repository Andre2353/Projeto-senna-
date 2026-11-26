import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  ContactShadows,
  Environment as DreiEnvironment,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useGameStore } from '../../store/useGameStore';
import type { ExplodedPart, ShowroomAngleZone } from '../../types/game';
import { createConcreteFloorTextureSet } from '../../utils/proceduralTextures';

const SHOWROOM_GLB_PATH = '/models/mclaren-showroom.glb';
const DEFAULT_CAMERA_POS = new THREE.Vector3(-4.6, 1.08, -6.2);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0.36, 0);

interface TelemetryPointSpec {
  id: ExplodedPart;
  label: string;
  position: [number, number, number];
  focusTarget: THREE.Vector3;
  focusCamera: THREE.Vector3;
}

const TELEMETRY_POINTS: readonly TelemetryPointSpec[] = [
  {
    id: 'aero',
    label: 'Aerodinâmica & Bico',
    position: [0, 0.28, -1.98],
    focusTarget: new THREE.Vector3(0, 0.25, -1.75),
    focusCamera: new THREE.Vector3(-2.1, 0.72, -3.95),
  },
  {
    id: 'wheels',
    label: 'Pneus & Freios',
    position: [-0.82, 0.34, -1.25],
    focusTarget: new THREE.Vector3(-0.75, 0.32, -1.25),
    focusCamera: new THREE.Vector3(-2.85, 0.68, -2.55),
  },
  {
    id: 'cockpit',
    label: 'Cockpit & Chassi',
    position: [0, 0.68, -0.22],
    focusTarget: new THREE.Vector3(0, 0.56, -0.2),
    focusCamera: new THREE.Vector3(-1.85, 1.48, -1.75),
  },
  {
    id: 'engine',
    label: 'Motor & Câmbio',
    position: [0, 0.64, 0.92],
    focusTarget: new THREE.Vector3(0, 0.48, 0.95),
    focusCamera: new THREE.Vector3(2.45, 0.96, 2.75),
  },
];

class GlbErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  public state = { hasError: false };

  public static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function configureModelMaterial(mat: THREE.Material): THREE.Material {
  const clonedMat = mat.clone();
  if (
    clonedMat instanceof THREE.MeshStandardMaterial ||
    clonedMat instanceof THREE.MeshPhysicalMaterial
  ) {
    clonedMat.envMapIntensity = 1.4;
    clonedMat.needsUpdate = true;
  }
  return clonedMat;
}

function computeExactVertexBox3(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  const vertex = new THREE.Vector3();

  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const pos = obj.geometry?.attributes?.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i).applyMatrix4(obj.matrixWorld);
      box.expandByPoint(vertex);
    }
  });

  return box;
}

function GlbShowroomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const { normalizedScene, clonedMaterials } = useMemo(() => {
    const cloned = scene.clone(true);
    const createdMaterials: THREE.Material[] = [];

    const rawBox = computeExactVertexBox3(cloned);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);

    const maxHoriz = Math.max(rawSize.x, rawSize.z, 0.001);
    const scale = 4.6 / maxHoriz;
    cloned.scale.setScalar(scale);
    cloned.updateMatrixWorld(true);

    // Recalculate exact Box3 AFTER scaling so all 4 tires rest flush on y = 0
    const scaledBox = computeExactVertexBox3(cloned);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    cloned.position.x -= scaledCenter.x;
    cloned.position.z -= scaledCenter.z;
    cloned.position.y -= scaledBox.min.y;
    cloned.updateMatrixWorld(true);

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;

      if (Array.isArray(obj.material)) {
        const mapped = obj.material.map((m) => {
          const clonedMat = configureModelMaterial(m);
          createdMaterials.push(clonedMat);
          return clonedMat;
        });
        obj.material = mapped;
      } else if (obj.material) {
        const clonedMat = configureModelMaterial(obj.material);
        createdMaterials.push(clonedMat);
        obj.material = clonedMat;
      }
    });

    return { normalizedScene: cloned, clonedMaterials: createdMaterials };
  }, [scene]);

  useEffect(() => {
    return () => {
      for (const mat of clonedMaterials) {
        mat.dispose();
      }
    };
  }, [clonedMaterials]);

  return <primitive object={normalizedScene} />;
}

function resolveAngleZone(cameraPos: THREE.Vector3): ShowroomAngleZone {
  const rad = Math.atan2(cameraPos.x, -cameraPos.z);
  const deg = ((rad * 180) / Math.PI + 360) % 360;

  if (deg >= 315 || deg < 45) return 'front';
  if (deg >= 45 && deg < 135) return 'right';
  if (deg >= 135 && deg < 225) return 'rear';
  return 'left';
}

export function CarShowroom() {
  const { camera } = useThree();
  const quality = useGameStore((state) => state.settings.quality);
  const activeInspectedPart = useGameStore((state) => state.activeInspectedPart);
  const toggleInspectedPart = useGameStore((state) => state.toggleInspectedPart);
  const setShowroomZone = useGameStore((state) => state.setShowroomZone);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lastZoneRef = useRef<ShowroomAngleZone>('front');
  const isTransitioningRef = useRef(true);
  const goalPosRef = useRef(DEFAULT_CAMERA_POS.clone());
  const goalTargetRef = useRef(DEFAULT_CAMERA_TARGET.clone());

  const concreteTex = useMemo(() => createConcreteFloorTextureSet(12, 12), []);

  useEffect(() => {
    return () => {
      concreteTex.map.dispose();
      concreteTex.roughnessMap.dispose();
    };
  }, [concreteTex]);

  useEffect(() => {
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.lookAt(DEFAULT_CAMERA_TARGET);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 32;
      camera.updateProjectionMatrix();
    }
    lastZoneRef.current = 'front';
    setShowroomZone('front');
  }, [camera, setShowroomZone]);

  useEffect(() => {
    if (activeInspectedPart) {
      const point = TELEMETRY_POINTS.find((item) => item.id === activeInspectedPart);
      if (point) {
        goalPosRef.current.copy(point.focusCamera);
        goalTargetRef.current.copy(point.focusTarget);
        isTransitioningRef.current = true;
      }
      return;
    }

    goalPosRef.current.copy(DEFAULT_CAMERA_POS);
    goalTargetRef.current.copy(DEFAULT_CAMERA_TARGET);
    isTransitioningRef.current = true;
  }, [activeInspectedPart]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const currentZone = resolveAngleZone(camera.position);

    if (currentZone !== lastZoneRef.current) {
      lastZoneRef.current = currentZone;
      setShowroomZone(currentZone);
    }

    if (controlsRef.current) {
      if (isTransitioningRef.current) {
        camera.position.lerp(goalPosRef.current, dt * 4.5);
        controlsRef.current.target.lerp(goalTargetRef.current, dt * 5.0);

        if (
          camera.position.distanceTo(goalPosRef.current) < 0.03 &&
          controlsRef.current.target.distanceTo(goalTargetRef.current) < 0.02
        ) {
          isTransitioningRef.current = false;
        }
      }
      controlsRef.current.update();
    }
  });

  return (
    <>
      <color attach="background" args={['#0d1015']} />
      <fog attach="fog" args={['#0d1015', 14, 34]} />

      {/* Dramatic Automotive Studio Overhead & Rim Environment */}
      <DreiEnvironment resolution={1024} frames={1}>
        {/* Main centered overhead rectangular softbox */}
        <Lightformer
          form="rect"
          intensity={4.8}
          color="#ffffff"
          scale={[3.4, 12, 1]}
          position={[0, 6.2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        {/* Subtle cool side fill panels */}
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#dce8ff"
          scale={[11, 2.2, 1]}
          position={[-7.2, 2.2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#e2e8f0"
          scale={[11, 2.2, 1]}
          position={[7.2, 2.2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />
        {/* Cool rear rim light */}
        <Lightformer
          form="rect"
          intensity={3.0}
          color="#cbd5e1"
          scale={[8.5, 1.4, 1]}
          position={[0, 2.8, 7.6]}
          rotation={[0, Math.PI, 0]}
        />
      </DreiEnvironment>

      <ambientLight intensity={0.28} color="#dce8ff" />
      <directionalLight
        position={[3.6, 9.2, -4.5]}
        intensity={2.3}
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
        position={[0, 4.8, 7.2]}
        angle={0.5}
        penumbra={0.9}
        intensity={28}
        color="#dbeafe"
      />

      {/* Subtle dark architectural cyclorama backdrop wall */}
      <mesh position={[0, 5.5, 0]} receiveShadow>
        <cylinderGeometry args={[18, 18, 12, 48, 1, true]} />
        <meshStandardMaterial
          color="#0a0d12"
          roughness={0.92}
          metalness={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Satin Dark Concrete Floor with Subtle Soft Reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[34, 64]} />
        <MeshReflectorMaterial
          map={concreteTex.map}
          roughnessMap={concreteTex.roughnessMap}
          blur={[400, 120]}
          resolution={1024}
          mixBlur={1}
          mixStrength={18}
          roughness={0.62}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#161a22"
          metalness={0.22}
          mirror={0.35}
        />
      </mesh>

      {/* Strong Grounding Contact Shadows Directly Beneath Tires at y = 0 */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.95}
        scale={9.5}
        blur={1.5}
        far={1.8}
        resolution={512}
        color="#000000"
      />

      <GlbErrorBoundary>
        <Suspense fallback={null}>
          <GlbShowroomModel url={SHOWROOM_GLB_PATH} />
        </Suspense>
      </GlbErrorBoundary>

      {/* Minimal 8px Pulsing Telemetry Dots for Interactive Part Inspection */}
      {TELEMETRY_POINTS.map((point) => {
        const isActive = activeInspectedPart === point.id;
        return (
          <Html key={point.id} position={point.position} center distanceFactor={6}>
            <button
              type="button"
              onClick={() => toggleInspectedPart(point.id)}
              aria-label={`Inspecionar ${point.label}`}
              title={point.label}
              className="group relative flex h-5 w-5 cursor-pointer items-center justify-center focus:outline-none"
            >
              <span
                className={`absolute h-4 w-4 rounded-full animate-ping ${
                  isActive ? 'bg-yellow-400/55' : 'bg-white/40'
                }`}
              />
              <span
                className={`relative h-2 w-2 rounded-full border transition-transform group-hover:scale-125 ${
                  isActive
                    ? 'border-yellow-200 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]'
                    : 'border-white bg-white/95 shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                }`}
              />
            </button>
          </Html>
        );
      })}

      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan={false}
        autoRotate={activeInspectedPart === null}
        autoRotateSpeed={0.65}
        minDistance={2.1}
        maxDistance={12.5}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.12}
        target={[0, 0.36, 0]}
        onStart={() => {
          isTransitioningRef.current = false;
        }}
      />

      {quality !== 'low' && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={1.05}
            luminanceSmoothing={0.25}
            intensity={0.22}
          />
          <Vignette eskil={false} offset={0.26} darkness={0.48} />
        </EffectComposer>
      )}
    </>
  );
}

useGLTF.preload(SHOWROOM_GLB_PATH);
