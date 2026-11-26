import { useEffect, useMemo, useRef } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpponentSpec, StageConfig } from '../../types/game';
import { clamp, damp } from '../../utils/gameMath';
import { gameRuntime } from '../../utils/runtime';
import { FormulaChassis } from './FormulaCar';

interface OpponentCarProps {
  spec: OpponentSpec;
  index: number;
  stage: StageConfig;
  isPaused: boolean;
  onOvertake: (spec: OpponentSpec) => void;
}

function createRivalTagTexture(spec: OpponentSpec): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const parts = spec.name.trim().split(' ');
  const surname = parts[parts.length - 1] ?? spec.name;

  if (ctx) {
    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.fillRect(0, 0, 256, 64);

    const accent = spec.livery.secondary === '#09090B' ? spec.livery.accent : spec.livery.secondary;
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 12, 64);

    ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 252, 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(surname.toUpperCase(), 132, 34);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function OpponentCar({
  spec,
  index,
  stage,
  isPaused,
  onOvertake,
}: OpponentCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelSpinRefs = useRef<(THREE.Group | null)[]>([]);
  const wheelAngleRef = useRef(0);
  const attackSideRef = useRef<number>(spec.laneX >= 0 ? -1 : 1);
  const decisionTimerRef = useRef(0);

  const tagTexture = useMemo(() => createRivalTagTexture(spec), [spec]);

  useEffect(() => {
    return () => {
      tagTexture.dispose();
    };
  }, [tagTexture]);

  useFrame((_, delta) => {
    const opp = gameRuntime.opponents[index];
    const carGroup = groupRef.current;
    if (!opp || !carGroup) {
      return;
    }

    if (!isPaused && !gameRuntime.raceFinished) {
      const dt = Math.min(delta, 0.05);
      const playerZ = gameRuntime.position.z;
      const playerX = gameRuntime.position.x;
      const dzToPlayer = opp.z - playerZ; // negative = opponent is ahead of player
      const dxToPlayer = opp.x - playerX;

      decisionTimerRef.current += dt;
      if (decisionTimerRef.current > 1.6) {
        decisionTimerRef.current = 0;
        attackSideRef.current = playerX > 0 ? -1 : 1;
      }

      let desiredSpeed = spec.baseSpeedKmh;

      if (stage.mechanic === 'defend_lead') {
        // Monaco 1992: Nigel Mansell attacks aggressively right behind player
        if (opp.z > playerZ - 1.2) {
          opp.aiState = 'attacking';
          const playerBlocking = Math.abs(dxToPlayer) < 2.35 && opp.z > playerZ + 1.2;
          if (playerBlocking) {
            desiredSpeed = Math.min(spec.baseSpeedKmh, Math.max(195, gameRuntime.speed - 4));
            opp.targetLaneX = clamp(playerX + attackSideRef.current * 4.2, -9.2, 9.2);
          } else {
            desiredSpeed = Math.max(spec.baseSpeedKmh, gameRuntime.speed * 1.06);
            opp.targetLaneX = clamp(playerX + attackSideRef.current * 3.1, -9.2, 9.2);
          }

          // Light rubber-band so Mansell never drops out of mirrors
          if (dzToPlayer > 28) {
            desiredSpeed = Math.max(desiredSpeed, gameRuntime.speed * 1.14);
          }
        } else {
          opp.aiState = 'defending';
          desiredSpeed = Math.min(spec.baseSpeedKmh, gameRuntime.speed * 0.98);
          opp.targetLaneX = clamp(playerX * 0.55, -8.5, 8.5);
        }
      } else if (stage.mechanic === 'wheel_to_wheel') {
        // Phoenix 1990: Jean Alesi counter-attacks if player opens the inside/outside line
        if (!opp.overtakenByPlayer) {
          if (Math.abs(dzToPlayer) < 24 && opp.z < playerZ) {
            opp.aiState = 'defending';
            desiredSpeed = spec.baseSpeedKmh * 1.02;
            opp.targetLaneX = clamp(playerX * 0.5, -8.5, 8.5);
          } else {
            opp.aiState = 'cruising';
            opp.targetLaneX = spec.laneX;
          }
        } else {
          const playerOpen = Math.abs(dxToPlayer) > 3.0;
          if (playerOpen && dzToPlayer < 35) {
            opp.aiState = 'attacking';
            desiredSpeed = Math.max(spec.baseSpeedKmh * 1.06, gameRuntime.speed * 1.04);
            opp.targetLaneX = clamp(playerX + (playerX > 0 ? -3.1 : 3.1), -9.2, 9.2);
          } else {
            opp.aiState = 'overtaken';
            desiredSpeed = spec.baseSpeedKmh * 0.92;
          }
        }
      } else {
        if (opp.overtakenByPlayer) {
          opp.aiState = 'overtaken';
          desiredSpeed = spec.baseSpeedKmh * 0.88;
        } else if (Math.abs(dzToPlayer) < 7 && Math.abs(dxToPlayer) < 2.6) {
          opp.aiState = 'avoiding';
          opp.targetLaneX = clamp(opp.x + (dxToPlayer >= 0 ? 3.2 : -3.2), -9.2, 9.2);
          desiredSpeed = spec.baseSpeedKmh * 0.96;
        } else if (dzToPlayer < 0 && dzToPlayer > -28) {
          opp.aiState = 'defending';
          opp.targetLaneX = clamp(
            spec.laneX + Math.sin(decisionTimerRef.current * 2.0) * spec.aggression * 2.3,
            -9.0,
            9.0
          );
        } else {
          opp.aiState = 'cruising';
          opp.targetLaneX = spec.laneX;
        }
      }

      // Light rubber-banding for overtaking targets so they remain visible in contention
      if (stage.mechanic !== 'defend_lead' && !opp.overtakenByPlayer) {
        const maxLead = stage.mechanic === 'four_overtakes' ? 210 : 105;
        if (dzToPlayer < -maxLead) {
          desiredSpeed = Math.min(desiredSpeed, Math.max(145, gameRuntime.speed * 0.84));
        } else if (dzToPlayer > -16 && gameRuntime.speed < 120) {
          desiredSpeed = Math.min(desiredSpeed, 175);
        }
      }

      // Prevent physical overlap with player chassis
      if (Math.abs(opp.z - playerZ) < 4.5 && Math.abs(opp.x - playerX) < 2.2) {
        const pushDir = opp.x >= playerX ? 1 : -1;
        opp.targetLaneX = clamp(playerX + pushDir * 2.9, -10.2, 10.2);
      }

      opp.speed = damp(opp.speed, desiredSpeed, 2.8, dt);
      opp.x = damp(opp.x, opp.targetLaneX, 3.6, dt);
      opp.z -= (opp.speed / 3.6) * dt;
      opp.heading = clamp((opp.targetLaneX - opp.x) * -0.06, -0.18, 0.18);

      // Clean longitudinal overtake detection
      if (!opp.overtakenByPlayer && stage.mechanic !== 'defend_lead' && playerZ < opp.z - 2.6) {
        opp.overtakenByPlayer = true;
        opp.aiState = 'overtaken';
        gameRuntime.overtakesCompleted += 1;
        onOvertake(spec);
      }

      const wheelSpeed = opp.speed / 3.6;
      wheelAngleRef.current -= (wheelSpeed / 0.34) * dt;
      for (let i = 0; i < wheelSpinRefs.current.length; i++) {
        const wheel = wheelSpinRefs.current[i];
        if (wheel) {
          wheel.rotation.x = wheelAngleRef.current;
        }
      }
    }

    carGroup.position.set(opp.x, 0, opp.z);
    carGroup.rotation.y = opp.heading;
  });

  return (
    <group ref={groupRef} position={[spec.laneX, 0, spec.initialOffsetZ]} visible>
      <FormulaChassis
        livery={spec.livery}
        isSennaHelmet={false}
        wheelSpinRefs={wheelSpinRefs}
      />

      {/* Discrete floating rival nameplate */}
      <Billboard position={[0, 1.85, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <planeGeometry args={[2.1, 0.52]} />
          <meshBasicMaterial map={tagTexture} transparent />
        </mesh>
      </Billboard>
    </group>
  );
}
