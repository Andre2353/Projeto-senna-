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
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const targetSunColor = useMemo(() => new THREE.Color('#fdba74'), []);
  const targetHemiSky = useMemo(() => new THREE.Color('#7dd3fc'), []);
  const targetHemiGround = useMemo(() => new THREE.Color('#166534'), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeStage =
      gameRuntime.activeStageId !== null
        ? STAGES.find((stage) => stage.id === gameRuntime.activeStageId)
        : undefined;

    let sunColor = '#fde68a';
    let sunIntensity = 2.4;
    let ambientIntensity = 0.85;
    let hemiIntensity = 0.95;
    let skyColor = '#7dd3fc';
    let groundColor = '#1e293b';

    if (mode === 'race' && activeStage) {
      sunColor = activeStage.weather.sunColor;
      sunIntensity = activeStage.weather.sunIntensity * 1.15;
      ambientIntensity = activeStage.weather.ambientIntensity * 1.1;
      hemiIntensity = activeStage.weather.rain > 0.5 ? 0.85 : 1.05;
      skyColor = activeStage.weather.skyColor;
      groundColor = activeStage.weather.wetAsphalt ? '#1e293b' : '#14532d';
    } else if (mode === 'open_world' || mode === 'credits') {
      // Bright, vivid lighting so car and monuments pop cleanly
      sunColor = '#fef08a';
      sunIntensity = 2.8;
      ambientIntensity = 1.05;
      hemiIntensity = 1.35;
      skyColor = '#93c5fd';
      groundColor = '#15803d';
    } else {
      sunColor = '#fde68a';
      sunIntensity = 2.3;
      ambientIntensity = 0.85;
      hemiIntensity = 0.9;
      skyColor = '#60a5fa';
      groundColor = '#1e293b';
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
        gameRuntime.position.x + 32,
        48,
        gameRuntime.position.z - 28
      );
      dirLightRef.current.target.position.set(
        gameRuntime.position.x,
        0,
        gameRuntime.position.z - 12
      );
      dirLightRef.current.target.updateMatrixWorld();
    }

    if (fillLightRef.current) {
      fillLightRef.current.position.set(
        gameRuntime.position.x - 24,
        22,
        gameRuntime.position.z + 25
      );
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
      targetHemiGround.set(groundColor);
      hemiRef.current.color.lerp(targetHemiSky, dt * 3);
      hemiRef.current.groundColor.lerp(targetHemiGround, dt * 3);
      hemiRef.current.intensity = THREE.MathUtils.lerp(
        hemiRef.current.intensity,
        hemiIntensity,
        dt * 3
      );
    }
  });

  const shadowMapSize = quality === 'high' ? 2048 : 1024;

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.85} />
      <hemisphereLight ref={hemiRef} args={['#7dd3fc', '#166534', 1.05]} />
      <directionalLight
        ref={fillLightRef}
        position={[-24, 22, 25]}
        intensity={0.65}
        color="#fed7aa"
      />
      <directionalLight
        ref={dirLightRef}
        position={[32, 48, -28]}
        intensity={2.4}
        color="#fde68a"
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
