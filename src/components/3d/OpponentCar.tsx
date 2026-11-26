import { useRef } from 'react';
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

  useFrame((_, delta) => {
    const opp = gameRuntime.opponents[index];
    const carGroup = groupRef.current;
    if (!opp || !carGroup || isPaused || gameRuntime.raceFinished) {
      return;
    }

    const dt = Math.min(delta, 0.05);
    const playerZ = gameRuntime.position.z;
    const playerX = gameRuntime.position.x;
    const dzToPlayer = opp.z - playerZ; // negative = opp is ahead of player
    const dxToPlayer = opp.x - playerX;

    decisionTimerRef.current += dt;
    if (decisionTimerRef.current > 1.8) {
      decisionTimerRef.current = 0;
      attackSideRef.current = playerX > 0 ? -1 : 1;
    }

    let desiredSpeed = spec.baseSpeedKmh;

    if (stage.mechanic === 'defend_lead') {
      // Monaco 1992: Nigel Mansell attacks aggressively behind or alongside
      if (opp.z > playerZ - 1.5) {
        opp.aiState = 'attacking';
        // Check if player cleanly holds defensive line
        const playerBlocking = Math.abs(dxToPlayer) < 2.35 && opp.z > playerZ + 1.5;
        if (playerBlocking) {
          desiredSpeed = Math.min(spec.baseSpeedKmh, Math.max(190, gameRuntime.speed - 6));
          opp.targetLaneX = clamp(playerX + attackSideRef.current * 4.2, -9.5, 9.5);
        } else {
          desiredSpeed = spec.baseSpeedKmh;
          opp.targetLaneX = clamp(playerX + attackSideRef.current * 3.1, -9.5, 9.5);
        }
      } else {
        opp.aiState = 'defending';
        desiredSpeed = spec.baseSpeedKmh * 0.96;
        opp.targetLaneX = clamp(playerX * 0.6, -8.5, 8.5);
      }
    } else if (stage.mechanic === 'wheel_to_wheel') {
      // Phoenix 1990: Jean Alesi counter-attacks if player opens the inside/outside line
      if (!opp.overtakenByPlayer) {
        if (Math.abs(dzToPlayer) < 24 && opp.z < playerZ) {
          opp.aiState = 'defending';
          desiredSpeed = spec.baseSpeedKmh * 1.03;
          opp.targetLaneX = clamp(playerX * 0.55, -8.5, 8.5);
        } else {
          opp.aiState = 'cruising';
          opp.targetLaneX = spec.laneX;
        }
      } else {
        // Counter-attack if player slows or leaves wide gap
        const playerOpen = Math.abs(dxToPlayer) > 3.2;
        if (playerOpen && opp.z - playerZ < 45) {
          opp.aiState = 'attacking';
          desiredSpeed = spec.baseSpeedKmh * 1.08;
          opp.targetLaneX = clamp(playerX + (playerX > 0 ? -3.2 : 3.2), -9.2, 9.2);
        } else {
          opp.aiState = 'overtaken';
          desiredSpeed = spec.baseSpeedKmh * 0.92;
        }
      }
    } else {
      // Standard & Donington/Suzuka/Interlagos overtaking AI
      if (opp.overtakenByPlayer) {
        opp.aiState = 'overtaken';
        desiredSpeed = spec.baseSpeedKmh * 0.9;
      } else if (Math.abs(dzToPlayer) < 7 && Math.abs(dxToPlayer) < 2.6) {
        opp.aiState = 'avoiding';
        opp.targetLaneX = clamp(opp.x + (dxToPlayer >= 0 ? 3.2 : -3.2), -9.5, 9.5);
        desiredSpeed = spec.baseSpeedKmh * 0.97;
      } else if (dzToPlayer < 0 && dzToPlayer > -26) {
        opp.aiState = 'defending';
        opp.targetLaneX = clamp(
          spec.laneX + Math.sin(decisionTimerRef.current * 1.8) * spec.aggression * 2.4,
          -9.2,
          9.2
        );
      } else {
        opp.aiState = 'cruising';
        opp.targetLaneX = spec.laneX;
      }
    }

    // Smoothly avoid lateral overlap with player car
    if (Math.abs(opp.z - playerZ) < 4.5 && Math.abs(opp.x - playerX) < 2.2) {
      const pushDir = opp.x >= playerX ? 1 : -1;
      opp.targetLaneX = clamp(playerX + pushDir * 2.9, -10.5, 10.5);
    }

    opp.speed = damp(opp.speed, desiredSpeed, 2.4, dt);
    opp.x = damp(opp.x, opp.targetLaneX, 3.2, dt);
    opp.z -= (opp.speed / 3.6) * dt;
    opp.heading = clamp((opp.targetLaneX - opp.x) * -0.06, -0.18, 0.18);

    // Clean longitudinal overtake detection
    if (!opp.overtakenByPlayer && stage.mechanic !== 'defend_lead' && playerZ < opp.z - 2.8) {
      opp.overtakenByPlayer = true;
      opp.aiState = 'overtaken';
      gameRuntime.overtakesCompleted += 1;
      onOvertake(spec);
    }

    carGroup.position.set(opp.x, 0, opp.z);
    carGroup.rotation.y = opp.heading;

    const wheelSpeed = opp.speed / 3.6;
    wheelAngleRef.current -= (wheelSpeed / 0.34) * dt;
    for (let i = 0; i < wheelSpinRefs.current.length; i++) {
      const wheel = wheelSpinRefs.current[i];
      if (wheel) {
        wheel.rotation.x = wheelAngleRef.current;
      }
    }
  });

  return (
    <group ref={groupRef} position={[spec.laneX, 0, spec.initialOffsetZ]}>
      <FormulaChassis
        livery={spec.livery}
        isSennaHelmet={false}
        wheelSpinRefs={wheelSpinRefs}
      />
    </group>
  );
}
