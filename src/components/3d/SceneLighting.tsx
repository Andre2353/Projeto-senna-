import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';

export function SceneLighting() {
  const mode = useGameStore((state) => state.mode);
  const quality = useGameStore((state) => state.settings.quality);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const targetSunColor = useMemo(() => new THREE.Color('#fdba74'), []);
  const targetHemiSky = useMemo(() => new THREE.Color('#38bdf8'), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeStage =
      gameRuntime.activeStageId !== null
        ? STAGES.find((stage) => stage.id === gameRuntime.activeStageId)
        : undefined;

    let sunColor = '#fde68a';
    let sunIntensity = 2.0;
    let ambientIntensity = 0.65;
    let skyColor = '#f59e0b';

    if (mode === 'race' && activeStage) {
      sunColor = activeStage.weather.sunColor;
      sunIntensity = activeStage.weather.sunIntensity;
      ambientIntensity = activeStage.weather.ambientIntensity;
      skyColor = activeStage.weather.skyColor;
    } else if (mode === 'open_world') {
      sunColor = '#fbbf24';
      sunIntensity = 2.4;
      ambientIntensity = 0.78;
      skyColor = '#f59e0b';
    } else {
      // Landing & Corridor: dramatic golden sunset horizon
      sunColor = '#fcd34d';
      sunIntensity = 1.95;
      ambientIntensity = 0.6;
      skyColor = '#1e293b';
    }

    const lightningBoost = gameRuntime.lightningFlash * 3.5;

    if (dirLightRef.current) {
      targetSunColor.set(sunColor);
      dirLightRef.current.color.lerp(targetSunColor, dt * 3);
      dirLightRef.current.intensity = THREE.MathUtils.lerp(
        dirLightRef.current.intensity,
        sunIntensity + lightningBoost,
        dt * 5
      );

      dirLightRef.current.position.set(
        gameRuntime.position.x + 28,
        42,
        gameRuntime.position.z - 35
      );
      dirLightRef.current.target.position.set(
        gameRuntime.position.x,
        0,
        gameRuntime.position.z - 15
      );
      dirLightRef.current.target.updateMatrixWorld();
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        ambientIntensity + lightningBoost * 0.4,
        dt * 4
      );
    }

    if (hemiRef.current) {
      targetHemiSky.set(skyColor);
      hemiRef.current.color.lerp(targetHemiSky, dt * 3);
    }
  });

  const shadowMapSize = quality === 'high' ? 2048 : 1024;

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.6} />
      <hemisphereLight ref={hemiRef} args={['#38bdf8', '#09090b', 0.45]} />
      <directionalLight
        ref={dirLightRef}
        position={[28, 42, -35]}
        intensity={1.95}
        color="#fcd34d"
        castShadow={quality !== 'low'}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0005}
      />
    </>
  );
}
