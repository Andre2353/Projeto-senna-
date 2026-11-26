import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import { getQualityProfile } from '../../utils/performance';
import { updateCarPhysics } from '../../utils/physics';
import { gameRuntime } from '../../utils/runtime';
import { CameraController } from './CameraController';
import { CorridorTrack } from './CorridorTrack';
import { Environment } from './Environment';
import { FormulaCar } from './FormulaCar';
import { RaceTrack } from './RaceTrack';
import { SceneLighting } from './SceneLighting';

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

function SceneCore() {
  const mode = useGameStore((state) => state.mode);
  const isPaused = useGameStore((state) => state.isPaused);
  const activeStageId = useGameStore((state) => state.activeStageId);
  const steeringSensitivity = useGameStore((state) => state.settings.steeringSensitivity);
  const markLoaded = useGameStore((state) => state.markLoaded);

  useEffect(() => {
    markLoaded();
  }, [markLoaded]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (mode === 'landing') {
      gameRuntime.speed = 65;
      gameRuntime.position.z -= dt * 18;
      if (gameRuntime.position.z < -260) {
        gameRuntime.position.z = 0;
      }
      return;
    }

    if (isPaused || mode === 'credits' || gameRuntime.raceFinished) {
      return;
    }

    const activeStage =
      activeStageId !== null ? STAGES.find((stage) => stage.id === activeStageId) ?? null : null;

    updateCarPhysics(dt, mode, activeStage, steeringSensitivity);
  });

  return (
    <>
      <Environment />
      <SceneLighting />
      <CameraController />
      <FormulaCar />
      <CorridorTrack />
      <RaceTrack />
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
    setLoadProgress(50);
    const supported = isWebGLAvailable();
    setWebglSupported(supported);
    if (!supported) {
      markLoaded();
    } else {
      setLoadProgress(95);
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

  const profile = getQualityProfile(quality);

  return (
    <CanvasErrorBoundary onError={() => setWebglSupported(false)}>
      <div className="fixed inset-0 h-full w-full">
        <Canvas
          shadows={quality !== 'low'}
          dpr={profile.dpr}
          camera={{ fov: 55, near: 0.2, far: 1400, position: [5.2, 2.35, 7.4] }}
          gl={{
            antialias: quality !== 'low',
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <SceneCore />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
