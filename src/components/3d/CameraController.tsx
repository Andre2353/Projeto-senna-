import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';

const desiredCameraPos = new THREE.Vector3();
const desiredLookAt = new THREE.Vector3();
const currentLookAt = new THREE.Vector3(0, 1, -10);

export function CameraController() {
  const { camera } = useThree();
  const mode = useGameStore((state) => state.mode);
  const cameraDistance = useGameStore((state) => state.settings.cameraDistance);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const lateralLagRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const persp = camera as THREE.PerspectiveCamera;
    const carX = gameRuntime.position.x;
    const carY = gameRuntime.position.y;
    const carZ = gameRuntime.position.z;
    const heading = gameRuntime.heading;

    if (mode === 'landing') {
      const t = state.clock.elapsedTime * 0.25;
      const orbitX = Math.sin(t) * 5.2;
      const orbitZ = 7.4 + Math.cos(t) * 1.4;
      desiredCameraPos.set(carX + orbitX, carY + 2.35, carZ + orbitZ);
      desiredLookAt.set(carX, carY + 0.65, carZ - 3.5);

      camera.position.lerp(desiredCameraPos, dt * 4);
      currentLookAt.lerp(desiredLookAt, dt * 5);
      camera.lookAt(currentLookAt);
      persp.fov = THREE.MathUtils.lerp(persp.fov, 50, dt * 3);
      persp.rotation.z = THREE.MathUtils.lerp(persp.rotation.z, 0, dt * 5);
      persp.updateProjectionMatrix();
      return;
    }

    // Smooth camera transition after clicking "LIGAR MOTOR / INICIAR"
    gameRuntime.cameraIntroProgress = Math.min(1, gameRuntime.cameraIntroProgress + dt * 1.35);

    const speedRatio = Math.min(1, Math.max(0, gameRuntime.speed / 330));
    const distScale = cameraDistance;
    const isOpenWorld = mode === 'open_world';

    const baseBack = (isOpenWorld ? 9.2 : 7.4) * distScale + speedRatio * 1.2;
    const baseHeight = (isOpenWorld ? 3.4 : 2.55) * distScale - speedRatio * 0.25;

    // Suzuka 1988 start stumble brief zoom-in
    const stumbleZoom =
      gameRuntime.activeStageId === 3 &&
      gameRuntime.stumbleElapsed > 0 &&
      gameRuntime.stumbleElapsed < 2.2
        ? 1.5
        : 0;

    const backDistance = Math.max(4.4, baseBack - stumbleZoom);

    // Subtle cinematic lateral lag on quick lane changes
    lateralLagRef.current = THREE.MathUtils.lerp(
      lateralLagRef.current,
      gameRuntime.steering * 0.65,
      dt * 3.5
    );

    const sinH = Math.sin(heading);
    const cosH = Math.cos(heading);

    const shakeScale = reducedMotion ? 0 : gameRuntime.shakeIntensity;
    const shakeX = (Math.random() - 0.5) * shakeScale * 0.22;
    const shakeY = (Math.random() - 0.5) * shakeScale * 0.16;

    desiredCameraPos.set(
      carX + sinH * backDistance + lateralLagRef.current + shakeX,
      carY + baseHeight + shakeY,
      carZ + cosH * backDistance
    );

    desiredLookAt.set(
      carX - sinH * 11,
      carY + 0.85,
      carZ - cosH * 11
    );

    const followRate = 4 + gameRuntime.cameraIntroProgress * 8;
    camera.position.lerp(desiredCameraPos, dt * followRate);
    currentLookAt.lerp(desiredLookAt, dt * (followRate + 2));
    camera.lookAt(currentLookAt);

    // Dynamic speed FOV (55° -> 78°)
    const targetFov = 55 + speedRatio * 23;
    persp.fov = THREE.MathUtils.lerp(persp.fov, targetFov, dt * 5);
    persp.updateProjectionMatrix();

    // Subtle roll tilt into corners
    if (!reducedMotion) {
      const targetRoll = -gameRuntime.steering * 0.038 * (0.3 + speedRatio * 0.7);
      persp.rotation.z = THREE.MathUtils.lerp(persp.rotation.z, targetRoll, dt * 6);
    }
  });

  return null;
}
