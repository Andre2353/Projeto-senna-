import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { getQualityProfile } from '../../utils/performance';
import { gameRuntime } from '../../utils/runtime';

interface ParticleState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export function Effects() {
  const mode = useGameStore((state) => state.mode);
  const quality = useGameStore((state) => state.settings.quality);
  const reducedMotion = useGameStore((state) => state.settings.reducedMotion);
  const isPaused = useGameStore((state) => state.isPaused);

  const profile = useMemo(() => getQualityProfile(quality), [quality]);

  const rainMeshRef = useRef<THREE.InstancedMesh>(null);
  const sprayMeshRef = useRef<THREE.InstancedMesh>(null);
  const smokeMeshRef = useRef<THREE.InstancedMesh>(null);
  const sparkMeshRef = useRef<THREE.InstancedMesh>(null);
  const windMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const rainDrops = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    for (let i = 0; i < profile.rainCount; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 68,
        y: Math.random() * 24,
        z: (Math.random() - 0.5) * 90,
        vx: -2.5,
        vy: -32 - Math.random() * 14,
        vz: 14,
        life: Math.random(),
      });
    }
    return arr;
  }, [profile.rainCount]);

  const sprayParticles = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    for (let i = 0; i < profile.sprayCount; i++) {
      arr.push({
        x: 0,
        y: -10,
        z: 0,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 1.8 + Math.random() * 3.2,
        vz: 8 + Math.random() * 14,
        life: Math.random(),
      });
    }
    return arr;
  }, [profile.sprayCount]);

  const smokeParticles = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    for (let i = 0; i < 120; i++) {
      arr.push({
        x: 0,
        y: -10,
        z: 0,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 0.7 + Math.random() * 1.4,
        vz: (Math.random() - 0.5) * 1.8,
        life: Math.random(),
      });
    }
    return arr;
  }, []);

  const sparkParticles = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    for (let i = 0; i < profile.sparkCount; i++) {
      arr.push({
        x: 0,
        y: -10,
        z: 0,
        vx: (Math.random() - 0.5) * 4.5,
        vy: 1.0 + Math.random() * 2.8,
        vz: 12 + Math.random() * 18,
        life: Math.random(),
      });
    }
    return arr;
  }, [profile.sparkCount]);

  const windLines = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    for (let i = 0; i < 64; i++) {
      arr.push({
        x: (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 11),
        y: 0.4 + Math.random() * 3.8,
        z: -Math.random() * 65,
        vx: 0,
        vy: 0,
        vz: 24 + Math.random() * 18,
        life: Math.random(),
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    dummy.position.set(0, -100, 0);
    dummy.scale.set(0.001, 0.001, 0.001);
    dummy.updateMatrix();
    [
      rainMeshRef.current,
      sprayMeshRef.current,
      smokeMeshRef.current,
      sparkMeshRef.current,
      windMeshRef.current,
    ].forEach((mesh) => {
      if (!mesh) return;
      for (let i = 0; i < mesh.count; i++) {
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [dummy, profile]);

  useFrame((_, delta) => {
    if (isPaused) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const px = gameRuntime.position.x;
    const pz = gameRuntime.position.z;
    const speedNorm = Math.min(1, Math.max(0, Math.abs(gameRuntime.speed) / 330));
    const rainLevel = gameRuntime.rainIntensity;
    const sinH = Math.sin(gameRuntime.heading);
    const cosH = Math.cos(gameRuntime.heading);

    // 1. Rain streaks
    if (rainMeshRef.current) {
      const activeCount = rainLevel > 0.02 ? Math.floor(profile.rainCount * rainLevel) : 0;
      const isStorm = gameRuntime.activeStageId === 2 || gameRuntime.activeStageId === 7;
      const slantX = isStorm ? -0.22 : -0.06;

      for (let i = 0; i < profile.rainCount; i++) {
        if (i >= activeCount) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          rainMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        const drop = rainDrops[i]!;
        drop.x += (isStorm ? -9 : -2.5) * dt;
        drop.y += drop.vy * dt;
        drop.z += (10 + speedNorm * 45) * dt;

        if (drop.y < 0 || drop.z > 40) {
          drop.x = (Math.random() - 0.5) * 68;
          drop.y = 14 + Math.random() * 14;
          drop.z = -55 + Math.random() * 75;
        }

        dummy.position.set(px + drop.x, drop.y, pz + drop.z);
        dummy.rotation.set(0.18 + speedNorm * 0.45, 0, slantX);
        dummy.scale.set(1, 0.7 + rainLevel * 0.8, 1);
        dummy.updateMatrix();
        rainMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      rainMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Voluminous tire spray on wet asphalt
    if (sprayMeshRef.current) {
      const showSpray = rainLevel > 0.15 && gameRuntime.speed > 35;
      for (let i = 0; i < profile.sprayCount; i++) {
        const p = sprayParticles[i]!;
        if (!showSpray && p.life <= 0) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          sprayMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        p.life -= dt * (1.6 + speedNorm * 1.4);
        if (p.life <= 0 && showSpray) {
          const wheelSide = i % 2 === 0 ? -0.99 : 0.99;
          p.x = px + wheelSide * cosH + sinH * 1.7 + (Math.random() - 0.5) * 0.35;
          p.y = 0.28 + Math.random() * 0.25;
          p.z = pz - wheelSide * sinH + cosH * 1.7;
          p.vx = (Math.random() - 0.5) * 3.0;
          p.vy = 1.6 + Math.random() * 3.6 * speedNorm;
          p.vz = (9 + speedNorm * 24) * cosH;
          p.life = 0.45 + Math.random() * 0.55;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.vy -= 4.2 * dt;
        }

        if (p.life > 0) {
          const scale = (0.55 + (1 - p.life) * 2.1) * Math.max(0.4, rainLevel);
          dummy.position.set(p.x, Math.max(0.08, p.y), p.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(scale, scale, scale);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
        }
        dummy.updateMatrix();
        sprayMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      sprayMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Subtle white tire smoke during Open World drift / handbrake
    if (smokeMeshRef.current) {
      const showSmoke =
        mode === 'open_world' &&
        (gameRuntime.drift > 0.25 || gameRuntime.handbrake) &&
        Math.abs(gameRuntime.speed) > 35;

      for (let i = 0; i < 120; i++) {
        const p = smokeParticles[i]!;
        if (!showSmoke && p.life <= 0) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          smokeMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        p.life -= dt * 1.4;
        if (p.life <= 0 && showSmoke) {
          const wheelSide = i % 2 === 0 ? -0.99 : 0.99;
          p.x = px + wheelSide * cosH + sinH * 1.55 + (Math.random() - 0.5) * 0.3;
          p.y = 0.16 + Math.random() * 0.12;
          p.z = pz - wheelSide * sinH + cosH * 1.55;
          p.vx = (Math.random() - 0.5) * 1.6;
          p.vy = 0.9 + Math.random() * 1.4;
          p.vz = (Math.random() - 0.5) * 1.6;
          p.life = 0.6 + Math.random() * 0.5;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
        }

        if (p.life > 0) {
          const scale = 0.45 + (1 - p.life) * 1.9;
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(scale, scale * 0.7, scale);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
        }
        dummy.updateMatrix();
        smokeMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      smokeMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Vivid bloom-triggering underbody sparks on kerbs or hard braking compression
    if (sparkMeshRef.current) {
      const emitSparks =
        !reducedMotion &&
        gameRuntime.speed > 125 &&
        (gameRuntime.surfaceKerb || gameRuntime.brake > 0.6);

      for (let i = 0; i < profile.sparkCount; i++) {
        const s = sparkParticles[i]!;
        if (!emitSparks && s.life <= 0) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          sparkMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        s.life -= dt * 3.4;
        if (s.life <= 0 && emitSparks) {
          s.x = px + (Math.random() - 0.5) * 0.9;
          s.y = 0.09;
          s.z = pz + sinH * 0.8 + cosH * 0.8;
          s.vx = (Math.random() - 0.5) * 5.2;
          s.vy = 1.6 + Math.random() * 3.0;
          s.vz = 15 + speedNorm * 22;
          s.life = 0.25 + Math.random() * 0.28;
        } else {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.z += s.vz * dt;
          s.vy -= 9.8 * dt;
        }

        if (s.life > 0) {
          dummy.position.set(s.x, Math.max(0.04, s.y), s.z);
          dummy.rotation.set(0, gameRuntime.heading, 0);
          dummy.scale.set(0.09, 0.09, 0.85);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
        }
        dummy.updateMatrix();
        sparkMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      sparkMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 5. Aerodynamic wind lines above 245 km/h
    if (windMeshRef.current) {
      const showWind = !reducedMotion && mode !== 'landing' && gameRuntime.speed > 245;

      for (let i = 0; i < 64; i++) {
        const w = windLines[i]!;
        if (!showWind) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          windMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        w.z += (38 + speedNorm * 40) * dt;
        if (w.z > 14) {
          w.x = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 12);
          w.y = 0.4 + Math.random() * 4.2;
          w.z = -55 - Math.random() * 25;
        }

        dummy.position.set(px + w.x, w.y, pz + w.z);
        dummy.rotation.set(0, gameRuntime.heading, 0);
        dummy.scale.set(0.03, 0.03, 2.2 + speedNorm * 2.5);
        dummy.updateMatrix();
        windMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      windMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={rainMeshRef} args={[undefined, undefined, profile.rainCount]} frustumCulled={false}>
        <boxGeometry args={[0.025, 1.35, 0.025]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.42} />
      </instancedMesh>

      <instancedMesh ref={sprayMeshRef} args={[undefined, undefined, profile.sprayCount]} frustumCulled={false}>
        <sphereGeometry args={[0.26, 7, 7]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.28} />
      </instancedMesh>

      <instancedMesh ref={smokeMeshRef} args={[undefined, undefined, 120]} frustumCulled={false}>
        <sphereGeometry args={[0.28, 7, 7]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.22} />
      </instancedMesh>

      <instancedMesh ref={sparkMeshRef} args={[undefined, undefined, profile.sparkCount]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={[4.5, 2.4, 0.35]} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={windMeshRef} args={[undefined, undefined, 64]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.22} />
      </instancedMesh>

      {profile.enablePostProcessing && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.9}
            luminanceSmoothing={0.3}
            intensity={0.45}
          />
          <Vignette eskil={false} offset={0.22} darkness={0.4} />
        </EffectComposer>
      )}
    </>
  );
}
