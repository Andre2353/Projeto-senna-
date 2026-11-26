import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';

export function Environment() {
  const { scene } = useThree();
  const mode = useGameStore((state) => state.mode);

  const horizonGroupRef = useRef<THREE.Group>(null);
  const sunDiscMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const bgColor = useMemo(() => new THREE.Color('#09090b'), []);
  const targetBg = useMemo(() => new THREE.Color('#09090b'), []);
  const fogColor = useMemo(() => new THREE.Color('#09090b'), []);
  const targetFog = useMemo(() => new THREE.Color('#09090b'), []);
  const sunDiscColor = useMemo(() => new THREE.Color('#facc15'), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeStage =
      gameRuntime.activeStageId !== null
        ? STAGES.find((stage) => stage.id === gameRuntime.activeStageId)
        : undefined;

    let desiredBg = '#111827';
    let desiredFog = '#1e1b18';
    let fogNear = 45;
    let fogFar = 420;
    let sunVisible = true;
    let sunHex = '#facc15';

    if (mode === 'race' && activeStage) {
      desiredBg = activeStage.weather.skyColor;
      desiredFog = activeStage.weather.fogColor;
      fogNear = activeStage.weather.fogNear;
      fogFar = activeStage.weather.fogFar;
      sunVisible = activeStage.weather.rain < 0.5;
      sunHex = activeStage.weather.sunColor;
    } else if (mode === 'open_world') {
      desiredBg = '#7c2d12';
      desiredFog = '#b45309';
      fogNear = 95;
      fogFar = 680;
      sunVisible = true;
      sunHex = '#fde047';
    } else {
      // Landing & Corridor: warm golden horizon ahead
      const progress = Math.min(1, Math.max(0, Math.abs(gameRuntime.position.z) / 3250));
      desiredBg = progress > 0.78 ? '#7c2d12' : '#0f172a';
      desiredFog = progress > 0.78 ? '#9a3412' : '#1c1917';
      fogNear = 45;
      fogFar = 460;
      sunVisible = true;
      sunHex = '#facc15';
    }

    targetBg.set(desiredBg);
    targetFog.set(desiredFog);
    bgColor.lerp(targetBg, dt * 2.5);
    fogColor.lerp(targetFog, dt * 2.5);

    if (gameRuntime.lightningFlash > 0.01) {
      bgColor.offsetHSL(0, 0, gameRuntime.lightningFlash * 0.25);
    }

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(bgColor);
    } else {
      scene.background = bgColor.clone();
    }

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(fogColor);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, fogNear, dt * 2.5);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, fogFar, dt * 2.5);
    }

    if (horizonGroupRef.current) {
      horizonGroupRef.current.position.set(
        gameRuntime.position.x,
        0,
        gameRuntime.position.z - 520
      );
      horizonGroupRef.current.visible = sunVisible;
    }

    if (sunDiscMatRef.current) {
      sunDiscColor.set(sunHex);
      sunDiscMatRef.current.color.lerp(sunDiscColor, dt * 3);
    }
  });

  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#1c1917', 45, 460]} />

      {/* Golden Horizon Sun & Halo */}
      <group ref={horizonGroupRef} position={[0, 0, -520]}>
        <mesh position={[0, 48, 0]}>
          <circleGeometry args={[62, 48]} />
          <meshBasicMaterial ref={sunDiscMatRef} color="#facc15" transparent opacity={0.85} fog={false} />
        </mesh>
        <mesh position={[0, 48, -2]}>
          <circleGeometry args={[125, 48]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.18} fog={false} />
        </mesh>
      </group>
    </>
  );
}
