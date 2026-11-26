import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CORRIDOR_END_Z, STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = position;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 uTopColor;
  uniform vec3 uMidColor;
  uniform vec3 uHorizonColor;
  varying vec3 vWorldPos;
  void main() {
    float h = normalize(vWorldPos).y;
    float lowMix = smoothstep(-0.08, 0.24, h);
    float highMix = smoothstep(0.18, 0.78, h);
    vec3 col = mix(uHorizonColor, uMidColor, lowMix);
    col = mix(col, uTopColor, highMix);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Environment() {
  const { scene } = useThree();
  const mode = useGameStore((state) => state.mode);

  const skyDomeRef = useRef<THREE.Mesh>(null);
  const horizonGroupRef = useRef<THREE.Group>(null);
  const sunDiscMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const skyUniforms = useMemo(
    () => ({
      uTopColor: { value: new THREE.Color('#1e1b4b') },
      uMidColor: { value: new THREE.Color('#4338ca') },
      uHorizonColor: { value: new THREE.Color('#f59e0b') },
    }),
    []
  );

  const targetTop = useMemo(() => new THREE.Color('#1e1b4b'), []);
  const targetMid = useMemo(() => new THREE.Color('#4338ca'), []);
  const targetHorizon = useMemo(() => new THREE.Color('#f59e0b'), []);
  const fogColor = useMemo(() => new THREE.Color('#09090b'), []);
  const targetFog = useMemo(() => new THREE.Color('#09090b'), []);
  const sunDiscColor = useMemo(() => new THREE.Color('#facc15'), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeStage =
      gameRuntime.activeStageId !== null
        ? STAGES.find((stage) => stage.id === gameRuntime.activeStageId)
        : undefined;

    let desiredTop = '#0f172a';
    let desiredMid = '#1e293b';
    let desiredHorizon = '#d97706';
    let desiredFog = '#1e1b18';
    let fogNear = 65;
    let fogFar = 540;
    let sunVisible = true;
    let sunHex = '#facc15';

    if (mode === 'race' && activeStage) {
      desiredTop = activeStage.weather.skyColor;
      desiredMid = activeStage.weather.skyColor;
      desiredHorizon = activeStage.weather.fogColor;
      desiredFog = activeStage.weather.fogColor;
      fogNear = activeStage.weather.fogNear;
      fogFar = activeStage.weather.fogFar;
      sunVisible = activeStage.weather.rain < 0.5;
      sunHex = activeStage.weather.sunColor;
    } else if (mode === 'open_world' || mode === 'credits') {
      // Vibrant cartoon sunset gradient: blue/purple zenith -> coral/orange -> golden horizon
      desiredTop = '#1d4ed8';
      desiredMid = '#7e22ce';
      desiredHorizon = '#fb923c';
      desiredFog = '#fdba74';
      fogNear = 180;
      fogFar = 920;
      sunVisible = true;
      sunHex = '#fef08a';
    } else {
      // Landing & Corridor: indigo sky transitioning toward golden sunset at Z = -950
      const progress = Math.min(
        1,
        Math.max(0, Math.abs(gameRuntime.position.z) / Math.abs(CORRIDOR_END_Z))
      );
      desiredTop = progress > 0.7 ? '#1e3a8a' : '#0f172a';
      desiredMid = progress > 0.7 ? '#6d28d9' : '#1e293b';
      desiredHorizon = progress > 0.7 ? '#fb923c' : '#d97706';
      desiredFog = progress > 0.7 ? '#b45309' : '#1c1917';
      fogNear = 85;
      fogFar = 580;
      sunVisible = true;
      sunHex = '#facc15';
    }

    targetTop.set(desiredTop);
    targetMid.set(desiredMid);
    targetHorizon.set(desiredHorizon);
    targetFog.set(desiredFog);

    skyUniforms.uTopColor.value.lerp(targetTop, dt * 2.5);
    skyUniforms.uMidColor.value.lerp(targetMid, dt * 2.5);
    skyUniforms.uHorizonColor.value.lerp(targetHorizon, dt * 2.5);
    fogColor.lerp(targetFog, dt * 2.5);

    if (gameRuntime.lightningFlash > 0.01) {
      skyUniforms.uTopColor.value.offsetHSL(0, 0, gameRuntime.lightningFlash * 0.25);
      fogColor.offsetHSL(0, 0, gameRuntime.lightningFlash * 0.25);
    }

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(skyUniforms.uHorizonColor.value);
    } else {
      scene.background = skyUniforms.uHorizonColor.value.clone();
    }

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(fogColor);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, fogNear, dt * 2.5);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, fogFar, dt * 2.5);
    }

    if (skyDomeRef.current) {
      skyDomeRef.current.position.set(gameRuntime.position.x, 0, gameRuntime.position.z);
    }

    if (horizonGroupRef.current) {
      horizonGroupRef.current.position.set(
        gameRuntime.position.x,
        0,
        gameRuntime.position.z - 620
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
      <fog attach="fog" args={['#1c1917', 85, 580]} />

      {/* Cartoon Sunset Gradient Sky Dome */}
      <mesh ref={skyDomeRef} scale={[1150, 1150, 1150]} frustumCulled={false}>
        <sphereGeometry args={[1, 32, 24]} />
        <shaderMaterial
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Golden Horizon Sun & Halo */}
      <group ref={horizonGroupRef} position={[0, 0, -620]}>
        <mesh position={[0, 62, 0]}>
          <circleGeometry args={[68, 48]} />
          <meshBasicMaterial ref={sunDiscMatRef} color="#fde047" transparent opacity={0.92} fog={false} />
        </mesh>
        <mesh position={[0, 62, -2]}>
          <circleGeometry args={[145, 48]} />
          <meshBasicMaterial color="#fb923c" transparent opacity={0.24} fog={false} />
        </mesh>
      </group>
    </>
  );
}
