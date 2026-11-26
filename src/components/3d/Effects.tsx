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
        vx: (Math.random() - 0.5) * 2.2,
        vy: 1.5 + Math.random() * 2.8,
        vz: 6 + Math.random() * 12,
        life: Math.random(),
      });
    }
    return arr;
  }, [profile.sprayCount]);

  const sparkParticles = useMemo<ParticleState[]>(() => {
    const arr: ParticleState[] = [];
    for (let i = 0; i < profile.sparkCount; i++) {
      arr.push({
        x: 0,
        y: -10,
        z: 0,
        vx: (Math.random() - 0.5) * 3.5,
        vy: 0.8 + Math.random() * 2.2,
        vz: 12 + Math.random() * 15,
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
    // Initialize off-screen matrices cleanly
    dummy.position.set(0, -100, 0);
    dummy.scale.set(0.001, 0.001, 0.001);
    dummy.updateMatrix();
    [rainMeshRef.current, sprayMeshRef.current, sparkMeshRef.current, windMeshRef.current].forEach(
      (mesh) => {
        if (!mesh) return;
        for (let i = 0; i < mesh.count; i++) {
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    );
  }, [dummy, profile]);

  useFrame((_, delta) => {
    if (isPaused) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const px = gameRuntime.position.x;
    const pz = gameRuntime.position.z;
    const speedNorm = Math.min(1, Math.max(0, gameRuntime.speed / 330));
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

    // 2. Tire spray on wet asphalt
    if (sprayMeshRef.current) {
      const showSpray = rainLevel > 0.15 && gameRuntime.speed > 38;
      for (let i = 0; i < profile.sprayCount; i++) {
        const p = sprayParticles[i]!;
        if (!showSpray) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          sprayMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        p.life -= dt * (1.8 + speedNorm * 1.4);
        if (p.life <= 0) {
          const wheelSide = i % 2 === 0 ? -0.96 : 0.96;
          p.x = px + wheelSide * cosH + sinH * 1.65 + (Math.random() - 0.5) * 0.3;
          p.y = 0.25 + Math.random() * 0.2;
          p.z = pz - wheelSide * sinH + cosH * 1.65;
          p.vx = (Math.random() - 0.5) * 2.4;
          p.vy = 1.2 + Math.random() * 2.8 * speedNorm;
          p.vz = (8 + speedNorm * 22) * cosH;
          p.life = 0.4 + Math.random() * 0.5;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.vy -= 4.5 * dt;
        }

        const scale = (0.35 + (1 - p.life) * 1.25) * rainLevel;
        dummy.position.set(p.x, Math.max(0.05, p.y), p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        sprayMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      sprayMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Underbody sparks on kerbs or hard braking compression
    if (sparkMeshRef.current) {
      const emitSparks =
        !reducedMotion &&
        gameRuntime.speed > 135 &&
        (gameRuntime.surfaceKerb || gameRuntime.brake > 0.65);

      for (let i = 0; i < profile.sparkCount; i++) {
        const s = sparkParticles[i]!;
        if (!emitSparks && s.life <= 0) {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
          dummy.updateMatrix();
          sparkMeshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        s.life -= dt * 3.8;
        if (s.life <= 0 && emitSparks) {
          s.x = px + (Math.random() - 0.5) * 0.85;
          s.y = 0.08;
          s.z = pz + sinH * 0.8 + cosH * 0.8;
          s.vx = (Math.random() - 0.5) * 4.5;
          s.vy = 1.4 + Math.random() * 2.6;
          s.vz = 14 + speedNorm * 20;
          s.life = 0.25 + Math.random() * 0.25;
        } else {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.z += s.vz * dt;
          s.vy -= 9.8 * dt;
        }

        if (s.life > 0) {
          dummy.position.set(s.x, Math.max(0.03, s.y), s.z);
          dummy.rotation.set(0, gameRuntime.heading, 0);
          dummy.scale.set(0.08, 0.08, 0.65);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0.001, 0.001, 0.001);
        }
        dummy.updateMatrix();
        sparkMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      sparkMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Aerodynamic wind lines above 250 km/h (and golden dust motes on landing)
    if (windMeshRef.current) {
      const showWind =
        !reducedMotion && mode !== 'landing' && gameRuntime.speed > 245;

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
        <sphereGeometry args={[0.24, 6, 6]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.28} />
      </instancedMesh>

      <instancedMesh ref={sparkMeshRef} args={[undefined, undefined, profile.sparkCount]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#fbbf24" />
      </instancedMesh>

      <instancedMesh ref={windMeshRef} args={[undefined, undefined, 64]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.22} />
      </instancedMesh>

      {profile.enablePostProcessing && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.92}
            luminanceSmoothing={0.35}
            intensity={0.38}
          />
          <Vignette eskil={false} offset={0.22} darkness={0.45} />
        </EffectComposer>
      )}
    </>
  );
}
