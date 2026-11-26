import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';

interface CanvasErrorBoundaryProps {
  children: ReactNode;
  onError: () => void;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  public state: CanvasErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onError();
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

function FoundationSceneContent() {
  const mode = useGameStore((state) => state.mode);
  const markLoaded = useGameStore((state) => state.markLoaded);

  useEffect(() => {
    markLoaded();
  }, [markLoaded]);

  useFrame((_, delta) => {
    if (mode === 'landing') {
      const clampedDelta = Math.min(delta, 0.05);
      gameRuntime.position.z -= clampedDelta * 14;
      if (gameRuntime.position.z < -260) {
        gameRuntime.position.z = 0;
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#09090b']} />
      <fog attach="fog" args={['#09090b', 35, 260]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[18, 28, 12]} intensity={1.8} color="#fde68a" castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -400]} receiveShadow>
        <planeGeometry args={[80, 1200]} />
        <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.15} />
      </mesh>
      <gridHelper args={[160, 80, '#facc15', '#27272a']} position={[0, 0.01, -40]} />
    </>
  );
}

export function GameCanvas() {
  const quality = useGameStore((state) => state.settings.quality);
  const webglSupported = useGameStore((state) => state.webglSupported);
  const setWebglSupported = useGameStore((state) => state.setWebglSupported);
  const setLoadProgress = useGameStore((state) => state.setLoadProgress);
  const markLoaded = useGameStore((state) => state.markLoaded);

  useEffect(() => {
    setLoadProgress(45);
    const supported = isWebGLAvailable();
    setWebglSupported(supported);
    if (!supported) {
      markLoaded();
    } else {
      setLoadProgress(80);
    }
  }, [markLoaded, setLoadProgress, setWebglSupported]);

  if (!webglSupported) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-lg border border-white/15 bg-zinc-950/90 p-8 backdrop-blur-md">
          <p className="font-telemetry text-xs tracking-widest text-yellow-400">
            DIAGNÓSTICO DE RENDERIZAÇÃO
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-50">
            WebGL indisponível neste navegador
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            A experiência 3D interativa requer aceleração gráfica WebGL habilitada em desktop.
            Ative a aceleração por hardware nas configurações do navegador e recarregue a página.
          </p>
        </div>
      </div>
    );
  }

  const dpr: [number, number] =
    quality === 'high' ? [1, 2] : quality === 'medium' ? [1, 1.5] : [0.85, 1];

  return (
    <CanvasErrorBoundary onError={() => setWebglSupported(false)}>
      <div className="fixed inset-0 h-full w-full">
        <Canvas
          shadows={quality !== 'low'}
          dpr={dpr}
          camera={{ fov: 55, near: 0.2, far: 1400, position: [6, 3.2, 10] }}
          gl={{
            antialias: quality !== 'low',
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <FoundationSceneContent />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
