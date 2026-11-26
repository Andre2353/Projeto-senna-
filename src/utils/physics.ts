import { CORRIDOR_HALF_WIDTH, PORTAL_Z_POSITIONS, STAGES } from '../data/sennaData';
import { controlInput } from '../hooks/useGameControls';
import type { GameMode, StageConfig } from '../types/game';
import { clamp, damp, normalizeAngle } from './gameMath';
import { gameRuntime } from './runtime';
import { getTrackHeading, getTrackOffsetX } from './trackLayout';

const MAX_SPEED_KMH = 330;
const GEAR_THRESHOLDS_KMH = [0, 72, 128, 178, 228, 276, 335];

function computeGearAndRpm(speedKmh: number, gearLocked: boolean): { gear: number; rpm: number } {
  const absSpeed = Math.abs(speedKmh);

  if (speedKmh < -1) {
    const revRpm = 3600 + Math.min(1, absSpeed / 75) * 6200;
    return { gear: 0, rpm: revRpm };
  }

  if (gearLocked) {
    const ratio = clamp(absSpeed / MAX_SPEED_KMH, 0.18, 1);
    return {
      gear: 6,
      rpm: 3100 + ratio * 9800,
    };
  }

  let gear = 1;
  for (let i = 1; i <= 6; i++) {
    const upper = GEAR_THRESHOLDS_KMH[i] ?? 335;
    if (absSpeed <= upper) {
      gear = i;
      break;
    }
  }

  const prevThresh = GEAR_THRESHOLDS_KMH[gear - 1] ?? 0;
  const nextThresh = GEAR_THRESHOLDS_KMH[gear] ?? 335;
  const span = Math.max(1, nextThresh - prevThresh);
  const inGearRatio = clamp((absSpeed - prevThresh) / span, 0, 1);
  const rpm = 4800 + inGearRatio * 8400;

  return { gear, rpm };
}

function getCorridorLateralLimit(z: number): { minX: number; maxX: number } {
  let minX = -CORRIDOR_HALF_WIDTH + 1.4;
  let maxX = CORRIDOR_HALF_WIDTH - 1.4;

  for (let i = 0; i < PORTAL_Z_POSITIONS.length; i++) {
    const pz = PORTAL_Z_POSITIONS[i]!;
    const stage = STAGES[i];
    if (!stage) continue;

    if (Math.abs(z - pz) < 24) {
      if (stage.portalSide === 'left') {
        minX = -27;
      } else {
        maxX = 27;
      }
    }
  }

  return { minX, maxX };
}

export function updateCarPhysics(
  dt: number,
  mode: GameMode,
  stage: StageConfig | null,
  steeringSensitivity: number
): void {
  if (mode === 'landing' || mode === 'credits') {
    return;
  }

  const throttleTarget = controlInput.forward ? 1 : 0;
  const brakeTarget = controlInput.backward ? 1 : 0;
  const steerDir = (controlInput.left ? 1 : 0) - (controlInput.right ? 1 : 0);

  gameRuntime.throttle = damp(gameRuntime.throttle, throttleTarget, 16, dt);
  gameRuntime.brake = damp(gameRuntime.brake, brakeTarget, 14, dt);
  gameRuntime.steering = damp(gameRuntime.steering, steerDir, 13, dt);
  gameRuntime.handbrake = mode === 'open_world' && controlInput.handbrake;

  // F1 Starting Grid Countdown: car held on brakes, throttle revs engine smoothly
  if (mode === 'race' && gameRuntime.racePhase === 'countdown') {
    gameRuntime.speed = 0;
    gameRuntime.gear = 1;
    const revTarget = 3800 + gameRuntime.throttle * 9200;
    gameRuntime.rpm = damp(gameRuntime.rpm, revTarget, 12, dt);
    gameRuntime.rotation.x = damp(gameRuntime.rotation.x, -gameRuntime.throttle * 0.014, 10, dt);
    gameRuntime.rotation.z = 0;
    return;
  }

  gameRuntime.previousPosition.x = gameRuntime.position.x;
  gameRuntime.previousPosition.y = gameRuntime.position.y;
  gameRuntime.previousPosition.z = gameRuntime.position.z;

  const rainFactor = gameRuntime.rainIntensity;
  const baseGrip = clamp(1 - rainFactor * 0.28, 0.68, 1);

  // Check off-track surface traction on curved race tracks
  let offTrackFactor = 1;
  if (mode === 'race' && stage) {
    const centerX = getTrackOffsetX(stage.id, gameRuntime.position.z, stage.lapLength);
    const absLocalX = Math.abs(gameRuntime.position.x - centerX);
    if (absLocalX > 11.6) {
      offTrackFactor = 0.84;
    }
  }
  const grip = baseGrip * offTrackFactor;

  // Stage 3 (Suzuka 1988) brief start stumble
  let stumbleMultiplier = 1;
  if (stage?.mechanic === 'stumble_recovery' && gameRuntime.playerLap === 1) {
    gameRuntime.stumbleElapsed += dt;
    if (gameRuntime.stumbleElapsed > 0.35 && gameRuntime.stumbleElapsed < 1.85) {
      stumbleMultiplier = 0.32;
      gameRuntime.stumbleTriggered = true;
    }
  }

  // Stage 5 (Interlagos 1991) 6th gear lock
  const sixthGearFactor = gameRuntime.gearLocked
    ? gameRuntime.speed < 140
      ? 0.44
      : gameRuntime.speed < 210
        ? 0.7
        : 0.92
    : 1;

  const launchPunch = gameRuntime.speed < 125 ? 1.32 : 1.0;
  const baseAccel = 118 * launchPunch * grip * stumbleMultiplier * sixthGearFactor;
  const drag =
    0.0007 * gameRuntime.speed * Math.abs(gameRuntime.speed) +
    (offTrackFactor < 1 ? 0.22 : 0.09) * gameRuntime.speed;

  if (mode === 'open_world') {
    if (gameRuntime.throttle > 0.05) {
      gameRuntime.speed += baseAccel * gameRuntime.throttle * dt;
    }
    if (gameRuntime.brake > 0.05) {
      if (gameRuntime.speed > 5) {
        gameRuntime.speed -= 200 * grip * gameRuntime.brake * dt;
      } else {
        gameRuntime.speed -= 72 * gameRuntime.brake * dt;
      }
    }
    if (gameRuntime.handbrake) {
      gameRuntime.speed = damp(gameRuntime.speed, 0, 1.35, dt);
    }
    gameRuntime.speed -= drag * dt;
    gameRuntime.speed = clamp(gameRuntime.speed, -65, MAX_SPEED_KMH);
  } else {
    if (gameRuntime.throttle > 0.05) {
      gameRuntime.speed += baseAccel * gameRuntime.throttle * dt;
    }
    if (gameRuntime.brake > 0.05) {
      gameRuntime.speed -= 210 * grip * gameRuntime.brake * dt;
    }
    gameRuntime.speed -= drag * dt;
    gameRuntime.speed = clamp(gameRuntime.speed, 0, MAX_SPEED_KMH);
  }

  const speedMetersPerSec = gameRuntime.speed / 3.6;
  const speedRatio = clamp(Math.abs(gameRuntime.speed) / MAX_SPEED_KMH, 0, 1);

  if (mode === 'open_world') {
    const steerAuthority =
      clamp(Math.abs(gameRuntime.speed) / 40, 0.26, 1) *
      (1 - speedRatio * 0.36) *
      steeringSensitivity *
      grip;

    const directionSign = gameRuntime.speed >= -0.5 ? 1 : -1;
    const driftBoost = gameRuntime.handbrake ? 1.4 : 1;
    const targetAngVel = gameRuntime.steering * 1.58 * steerAuthority * driftBoost * directionSign;

    gameRuntime.angularVelocity = damp(gameRuntime.angularVelocity, targetAngVel, 11, dt);
    gameRuntime.heading = normalizeAngle(gameRuntime.heading + gameRuntime.angularVelocity * dt);

    const targetDrift = gameRuntime.handbrake
      ? Math.abs(gameRuntime.steering) * speedRatio
      : Math.abs(gameRuntime.steering) * speedRatio * rainFactor * 0.4;
    gameRuntime.drift = damp(gameRuntime.drift, targetDrift, 8, dt);

    const forwardX = -Math.sin(gameRuntime.heading);
    const forwardZ = -Math.cos(gameRuntime.heading);

    gameRuntime.position.x += forwardX * speedMetersPerSec * dt;
    gameRuntime.position.z += forwardZ * speedMetersPerSec * dt;

    if (gameRuntime.position.x < -420) {
      gameRuntime.position.x = -420;
      gameRuntime.speed *= 0.996;
    } else if (gameRuntime.position.x > 420) {
      gameRuntime.position.x = 420;
      gameRuntime.speed *= 0.996;
    }
    if (gameRuntime.position.z < -2350) {
      gameRuntime.position.z = -2350;
      gameRuntime.speed *= 0.996;
    } else if (gameRuntime.position.z > -880) {
      gameRuntime.position.z = -880;
      gameRuntime.speed *= 0.996;
    }
    gameRuntime.distance += Math.abs(speedMetersPerSec) * dt;
    gameRuntime.surfaceKerb = false;
  } else if (mode === 'race' && stage) {
    // Continuous curved track driving synchronized with getTrackOffsetX
    const trackHeading = getTrackHeading(stage.id, gameRuntime.position.z, stage.lapLength);
    const speedAuthority = clamp(gameRuntime.speed / 30, 0.28, 1) * (1 - speedRatio * 0.24);
    const steerDelta = gameRuntime.steering * 1.55 * steeringSensitivity * grip * speedAuthority * dt;

    let nextHeading = gameRuntime.heading + steerDelta;
    if (Math.abs(gameRuntime.steering) < 0.08) {
      // Natural self-aligning front caster subtly blends toward corner exit without removing cornering feel
      nextHeading = damp(nextHeading, trackHeading, 2.2, dt);
    }

    const relativeDeviation = clamp(normalizeAngle(nextHeading - trackHeading), -0.44, 0.44);
    gameRuntime.heading = normalizeAngle(trackHeading + relativeDeviation);

    const forwardX = -Math.sin(gameRuntime.heading);
    const forwardZ = -Math.cos(gameRuntime.heading);
    gameRuntime.position.x += forwardX * speedMetersPerSec * dt;
    gameRuntime.position.z += forwardZ * speedMetersPerSec * dt;

    const newCenterX = getTrackOffsetX(stage.id, gameRuntime.position.z, stage.lapLength);
    const newTrackHeading = getTrackHeading(stage.id, gameRuntime.position.z, stage.lapLength);
    const raceLimit = 12.8;
    const localX = gameRuntime.position.x - newCenterX;

    // Smooth wall-slide deflection along curved barriers (never sticks or zeroes speed)
    if (localX < -raceLimit) {
      gameRuntime.position.x = newCenterX - raceLimit;
      gameRuntime.heading = damp(gameRuntime.heading, newTrackHeading, 16, dt);
      gameRuntime.speed = Math.max(70, gameRuntime.speed * (1 - 0.14 * dt));
    } else if (localX > raceLimit) {
      gameRuntime.position.x = newCenterX + raceLimit;
      gameRuntime.heading = damp(gameRuntime.heading, newTrackHeading, 16, dt);
      gameRuntime.speed = Math.max(70, gameRuntime.speed * (1 - 0.14 * dt));
    }

    // Side-by-side wheel deflection against all visible rivals
    for (let i = 0; i < gameRuntime.opponents.length; i++) {
      const opp = gameRuntime.opponents[i];
      if (!opp || !opp.visualVisible) continue;
      const dz = Math.abs(gameRuntime.position.z - opp.visualZ);
      const dx = gameRuntime.position.x - opp.visualX;
      if (dz < 3.6 && Math.abs(dx) < 1.9) {
        const pushDir = dx >= 0 ? 1 : -1;
        gameRuntime.position.x = clamp(
          opp.visualX + pushDir * 2.02,
          newCenterX - raceLimit,
          newCenterX + raceLimit
        );
        gameRuntime.speed = Math.max(85, gameRuntime.speed * 0.985);
      }
    }

    const absLocal = Math.abs(gameRuntime.position.x - newCenterX);
    gameRuntime.surfaceKerb = absLocal > 10.6 && absLocal < 13.0;
    gameRuntime.playerTotalDistance = (gameRuntime.playerLap - 1) * stage.lapLength - gameRuntime.position.z;
    gameRuntime.distance = Math.max(0, gameRuntime.playerTotalDistance);
    gameRuntime.drift = damp(
      gameRuntime.drift,
      Math.abs(gameRuntime.steering) * speedRatio * (0.18 + rainFactor * 0.55),
      8,
      dt
    );
  } else {
    // Choice Autodrome straight corridor physics
    const highSpeedDamping = 1 - speedRatio * 0.28;
    const lateralSpeed =
      gameRuntime.steering *
      (14.5 + speedRatio * 10.5) *
      highSpeedDamping *
      steeringSensitivity *
      grip *
      clamp(gameRuntime.speed / 35, 0.3, 1);

    const desiredHeading = clamp(gameRuntime.steering * 0.19 * grip, -0.22, 0.22);
    gameRuntime.heading = damp(gameRuntime.heading, desiredHeading, 12, dt);

    gameRuntime.position.x -= lateralSpeed * dt;
    gameRuntime.position.z -= speedMetersPerSec * dt;

    const limits = getCorridorLateralLimit(gameRuntime.position.z);
    if (gameRuntime.position.x < limits.minX) {
      gameRuntime.position.x = limits.minX;
      gameRuntime.heading = damp(gameRuntime.heading, 0, 16, dt);
      gameRuntime.speed *= 0.996;
    } else if (gameRuntime.position.x > limits.maxX) {
      gameRuntime.position.x = limits.maxX;
      gameRuntime.heading = damp(gameRuntime.heading, 0, 16, dt);
      gameRuntime.speed *= 0.996;
    }
    gameRuntime.distance = Math.max(0, -gameRuntime.position.z);
    const absX = Math.abs(gameRuntime.position.x);
    gameRuntime.surfaceKerb = absX > 10.6 && absX < 13.4;
    gameRuntime.drift = damp(
      gameRuntime.drift,
      Math.abs(gameRuntime.steering) * speedRatio * (0.18 + rainFactor * 0.55),
      8,
      dt
    );
  }

  const targetPitch = gameRuntime.brake * 0.042 - gameRuntime.throttle * 0.018;
  const targetRoll = -gameRuntime.steering * 0.055 * speedRatio;
  gameRuntime.rotation.x = damp(gameRuntime.rotation.x, targetPitch, 10, dt);
  gameRuntime.rotation.z = damp(gameRuntime.rotation.z, targetRoll, 10, dt);

  const kerbShake = gameRuntime.surfaceKerb ? speedRatio * 0.55 : 0;
  const gearShake = gameRuntime.transmissionFailed ? 0.25 + speedRatio * 0.25 : 0;
  gameRuntime.shakeIntensity = Math.max(kerbShake, gearShake);

  const { gear, rpm } = computeGearAndRpm(gameRuntime.speed, gameRuntime.gearLocked);
  gameRuntime.gear = gear;
  gameRuntime.rpm = damp(gameRuntime.rpm, rpm, 14, dt);
}
