import { useEffect, useMemo, useRef } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OpponentSpec, StageConfig } from '../../types/game';
import { clamp, damp } from '../../utils/gameMath';
import { gameRuntime } from '../../utils/runtime';
import { getTrackHeading, getTrackOffsetX, getTrackSlopeX } from '../../utils/trackLayout';
import { FormulaChassis } from './FormulaCar';

interface OpponentCarProps {
  spec: OpponentSpec;
  index: number;
  stage: StageConfig;
  isPaused: boolean;
}

export function OpponentCar({
  spec,
  index,
  stage,
  isPaused,
}: OpponentCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  const frontLeftSteerRef = useRef<THREE.Group>(null);
  const frontRightSteerRef = useRef<THREE.Group>(null);
  const wheelSpinRefs = useRef<(THREE.Group | null)[]>([]);
  const wheelAngleRef = useRef(0);
  const decisionTimerRef = useRef((index * 0.37) % 1.4);
  const overtakeSideRef = useRef<number>(index % 2 === 0 ? -1 : 1);

  const shortLabel = useMemo(() => spec.shortName.toUpperCase(), [spec.shortName]);

  useEffect(() => {
    return () => {
      wheelSpinRefs.current = [];
    };
  }, []);

  useFrame((_, delta) => {
    const opp = gameRuntime.opponents[index];
    const carGroup = groupRef.current;
    if (!opp || !carGroup) {
      return;
    }

    if (!isPaused && !gameRuntime.raceFinished) {
      const dt = Math.min(delta, 0.05);

      if (gameRuntime.racePhase === 'countdown') {
        opp.speed = 0;
        const oppCenterX = getTrackOffsetX(stage.id, opp.z, stage.lapLength);
        opp.visualX = oppCenterX + opp.laneOffsetX;
        opp.visualZ = opp.z;
        const relDist = opp.totalDistance - gameRuntime.playerTotalDistance;
        opp.visualVisible = Math.abs(relDist) < 450;
      } else {
        decisionTimerRef.current += dt;
        if (decisionTimerRef.current > 1.4) {
          decisionTimerRef.current = 0;
          overtakeSideRef.current = opp.laneOffsetX > 0 ? -1 : 1;
        }

        const trackSlope = Math.abs(getTrackSlopeX(stage.id, opp.z, stage.lapLength));
        const cornerSlowdown = 1 - Math.min(0.24, trackSlope * (1.28 - spec.cornerSkill * 0.55));
        let desiredSpeed = spec.baseSpeedKmh * cornerSlowdown;
        let desiredLane = spec.laneX;

        // Avoid and overtake slower rivals directly ahead on track
        for (let j = 0; j < gameRuntime.opponents.length; j++) {
          if (j === index) continue;
          const other = gameRuntime.opponents[j];
          if (!other || other.finished) continue;
          const distAhead = other.totalDistance - opp.totalDistance;
          if (distAhead > 0 && distAhead < 22 && Math.abs(other.laneOffsetX - opp.laneOffsetX) < 2.2) {
            desiredLane = clamp(other.laneOffsetX + overtakeSideRef.current * 3.4, -7.8, 7.8);
            opp.aiState = other.speed < opp.speed ? 'attacking' : 'avoiding';
            if (distAhead < 6.5 && Math.abs(other.laneOffsetX - opp.laneOffsetX) < 1.8) {
              desiredSpeed = Math.min(desiredSpeed, other.speed * 0.97);
            }
            break;
          }
        }

        // Player-relative interaction (fair competitive racing without heavy rubber-banding)
        const playerDeltaDist = gameRuntime.playerTotalDistance - opp.totalDistance; // + = player ahead
        const playerCenterX = getTrackOffsetX(stage.id, gameRuntime.position.z, stage.lapLength);
        const playerLaneX = gameRuntime.position.x - playerCenterX;

        if (Math.abs(playerDeltaDist) < 18 && Math.abs(playerLaneX - opp.laneOffsetX) < 2.3) {
          if (playerDeltaDist > 1.5) {
            // Player is ahead -> try passing around player if aggressive
            opp.aiState = 'attacking';
            desiredLane = clamp(
              playerLaneX + (playerLaneX > 0 ? -3.3 : 3.3),
              -8.2,
              8.2
            );
            desiredSpeed *= 1 + spec.aggression * 0.04;
          } else if (playerDeltaDist < -1.5 && playerDeltaDist > -18) {
            // Opponent slightly ahead -> mild defensive line shift
            opp.aiState = 'defending';
            desiredLane = clamp(spec.laneX * 0.6 + playerLaneX * 0.25, -7.8, 7.8);
          }
        } else {
          opp.aiState = opp.finished ? 'finished' : 'cruising';
        }

        if (opp.finished) {
          desiredSpeed = Math.min(desiredSpeed, 210);
        }

        opp.targetLaneX = desiredLane;
        opp.speed = damp(opp.speed, desiredSpeed, 2.5, dt);
        opp.laneOffsetX = damp(opp.laneOffsetX, opp.targetLaneX, 3.2, dt);

        const speedMetersPerSec = opp.speed / 3.6;
        opp.z -= speedMetersPerSec * dt;

        // Seamless lap wrapping for rival across 3 laps
        if (opp.z <= -stage.lapLength) {
          const nowMs = performance.now();
          const lapTime = nowMs - opp.currentLapStartMs;
          if (opp.currentLapStartMs > 0) {
            opp.bestLapMs = opp.bestLapMs === null ? lapTime : Math.min(opp.bestLapMs, lapTime);
          }
          if (opp.lap < stage.totalLaps) {
            opp.lap += 1;
            opp.z += stage.lapLength;
            opp.currentLapStartMs = nowMs;
          } else if (!opp.finished) {
            opp.finished = true;
            opp.finishTimeMs = gameRuntime.raceElapsed * 1000;
            opp.aiState = 'finished';
          }
        }

        opp.totalDistance = (opp.lap - 1) * stage.lapLength - opp.z;
        const deltaDist = opp.totalDistance - gameRuntime.playerTotalDistance;
        opp.visualZ = gameRuntime.position.z - deltaDist;

        const visualTrackX = getTrackOffsetX(stage.id, opp.visualZ, stage.lapLength);
        const visualTrackHeading = getTrackHeading(stage.id, opp.visualZ, stage.lapLength);
        opp.visualX = visualTrackX + opp.laneOffsetX;
        opp.x = opp.visualX;
        opp.heading = visualTrackHeading + clamp((opp.targetLaneX - opp.laneOffsetX) * -0.055, -0.18, 0.18);
        opp.visualVisible = Math.abs(deltaDist) < 450;

        const steerVisual = clamp((opp.targetLaneX - opp.laneOffsetX) * -0.09, -0.32, 0.32);
        if (frontLeftSteerRef.current) frontLeftSteerRef.current.rotation.y = steerVisual;
        if (frontRightSteerRef.current) frontRightSteerRef.current.rotation.y = steerVisual;

        wheelAngleRef.current -= (speedMetersPerSec / 0.34) * dt;
        for (let i = 0; i < wheelSpinRefs.current.length; i++) {
          const wheel = wheelSpinRefs.current[i];
          if (wheel) wheel.rotation.x = wheelAngleRef.current;
        }
      }
    }

    carGroup.visible = opp.visualVisible;
    if (opp.visualVisible) {
      carGroup.position.set(opp.visualX, 0, opp.visualZ);
      carGroup.rotation.y = opp.heading;

      if (labelGroupRef.current) {
        const relDist = Math.abs(opp.totalDistance - gameRuntime.playerTotalDistance);
        labelGroupRef.current.visible = relDist < 90;
      }
    }
  });

  return (
    <group ref={groupRef} position={[spec.laneX, 0, spec.initialOffsetZ]}>
      <FormulaChassis
        livery={spec.livery}
        isSennaHelmet={false}
        frontLeftSteerRef={frontLeftSteerRef}
        frontRightSteerRef={frontRightSteerRef}
        wheelSpinRefs={wheelSpinRefs}
      />

      {/* Discrete floating surname tag visible only within 90 units */}
      <group ref={labelGroupRef} position={[0, 1.78, 0]}>
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            fontSize={0.34}
            color="#f8fafc"
            outlineWidth={0.04}
            outlineColor="#09090b"
            anchorX="center"
            anchorY="middle"
          >
            {shortLabel}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}
