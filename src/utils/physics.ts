import { CORRIDOR_HALF_WIDTH, PORTAL_Z_POSITIONS, STAGES } from '../data/sennaData';
import { controlInput } from '../hooks/useGameControls';
import type { GameMode, StageConfig } from '../types/game';
import { clamp, damp, normalizeAngle } from './gameMath';
import { gameRuntime } from './runtime';

const MAX_SPEED_KMH = 330;
const GEAR_THRESHOLDS_KMH = [0, 72, 128, 178, 228, 276, 335];

function computeGearAndRpm(speedKmh: number, gearLocked: boolean): { gear: number; rpm: number } {
  const absSpeed = Math.abs(speedKmh);

  if (speedKmh < -1) {
    const revRpm = 3600 + Math.min(1, absSpeed / 75) * 6200;
    return { gear: 0, rpm: revRpm };
  }

  if (gearLocked) {
    // Interlagos 1991: locked in 6th gear — heavy low-RPM lugging below 200 km/h
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

  // Allow driving into lateral portal bays near each portal Z
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

  gameRuntime.throttle = damp(gameRuntime.throttle, throttleTarget, 10, dt);
  gameRuntime.brake = damp(gameRuntime.brake, brakeTarget, 12, dt);
  gameRuntime.steering = damp(gameRuntime.steering, steerDir, 11, dt);
  gameRuntime.handbrake = mode === 'open_world' && controlInput.handbrake;

  // Save previous position for swept portal/finish detection
  gameRuntime.previousPosition.x = gameRuntime.position.x;
  gameRuntime.previousPosition.y = gameRuntime.position.y;
  gameRuntime.previousPosition.z = gameRuntime.position.z;

  const rainFactor = gameRuntime.rainIntensity;
  const grip = clamp(1 - rainFactor * 0.34, 0.62, 1);

  // Stage 3 (Suzuka 1988) brief start stumble: 1.5s power drop after 0.6s
  let stumbleMultiplier = 1;
  if (stage?.mechanic === 'stumble_recovery') {
    gameRuntime.stumbleElapsed += dt;
    if (gameRuntime.stumbleElapsed > 0.45 && gameRuntime.stumbleElapsed < 2.05) {
      stumbleMultiplier = 0.24;
      gameRuntime.stumbleTriggered = true;
    }
  }

  // Stage 5 (Interlagos 1991) 6th gear transmission lock in second half
  const sixthGearFactor = gameRuntime.gearLocked
    ? gameRuntime.speed < 140
      ? 0.42
      : gameRuntime.speed < 210
        ? 0.68
        : 0.92
    : 1;

  // Longitudinal acceleration & aerodynamic drag
  const baseAccel = 112 * grip * stumbleMultiplier * sixthGearFactor;
  const drag = 0.00072 * gameRuntime.speed * Math.abs(gameRuntime.speed) + 0.095 * gameRuntime.speed;

  if (mode === 'open_world') {
    if (gameRuntime.throttle > 0.05) {
      gameRuntime.speed += baseAccel * gameRuntime.throttle * dt;
    }
    if (gameRuntime.brake > 0.05) {
      if (gameRuntime.speed > 5) {
        gameRuntime.speed -= 195 * grip * gameRuntime.brake * dt;
      } else {
        // Reverse in Open World when stopped
        gameRuntime.speed -= 65 * gameRuntime.brake * dt;
      }
    }
    if (gameRuntime.handbrake) {
      gameRuntime.speed = damp(gameRuntime.speed, 0, 1.4, dt);
    }
    gameRuntime.speed -= drag * dt;
    gameRuntime.speed = clamp(gameRuntime.speed, -65, MAX_SPEED_KMH);
  } else {
    if (gameRuntime.throttle > 0.05) {
      gameRuntime.speed += baseAccel * gameRuntime.throttle * dt;
    }
    if (gameRuntime.brake > 0.05) {
      gameRuntime.speed -= 205 * grip * gameRuntime.brake * dt;
    }
    gameRuntime.speed -= drag * dt;
    gameRuntime.speed = clamp(gameRuntime.speed, 0, MAX_SPEED_KMH);
  }

  const speedMetersPerSec = gameRuntime.speed / 3.6;
  const speedRatio = clamp(Math.abs(gameRuntime.speed) / MAX_SPEED_KMH, 0, 1);

  if (mode === 'open_world') {
    // Full 360° steering physics
    const steerAuthority =
      clamp(Math.abs(gameRuntime.speed) / 45, 0.22, 1) *
      (1 - speedRatio * 0.35) *
      steeringSensitivity *
      grip;

    const directionSign = gameRuntime.speed >= -0.5 ? 1 : -1;
    const driftBoost = gameRuntime.handbrake ? 1.45 : 1;
    const targetAngVel = gameRuntime.steering * 1.65 * steerAuthority * driftBoost * directionSign;

    gameRuntime.angularVelocity = damp(gameRuntime.angularVelocity, targetAngVel, 9, dt);
    gameRuntime.heading = normalizeAngle(gameRuntime.heading + gameRuntime.angularVelocity * dt);

    const targetDrift = gameRuntime.handbrake
      ? Math.abs(gameRuntime.steering) * speedRatio * 1.0
      : Math.abs(gameRuntime.steering) * speedRatio * rainFactor * 0.45;
    gameRuntime.drift = damp(gameRuntime.drift, targetDrift, 8, dt);

    const forwardX = -Math.sin(gameRuntime.heading);
    const forwardZ = -Math.cos(gameRuntime.heading);

    gameRuntime.position.x += forwardX * speedMetersPerSec * dt;
    gameRuntime.position.z += forwardZ * speedMetersPerSec * dt;

    // Keep within generous open-world arena bounds
    gameRuntime.position.x = clamp(gameRuntime.position.x, -420, 420);
    gameRuntime.position.z = clamp(gameRuntime.position.z, -2350, -880);
    gameRuntime.distance += Math.abs(speedMetersPerSec) * dt;
  } else {
    // Corridor and Race track forward-biased high-speed steering
    const lateralSpeed =
      gameRuntime.steering *
      (14.5 + speedRatio * 12) *
      steeringSensitivity *
      grip *
      clamp(gameRuntime.speed / 38, 0.25, 1);

    // Subtle yaw angle for visual car responsiveness
    const desiredHeading = clamp(gameRuntime.steering * 0.22 * grip, -0.26, 0.26);
    gameRuntime.heading = damp(gameRuntime.heading, desiredHeading, 10, dt);

    gameRuntime.position.x -= lateralSpeed * dt;
    gameRuntime.position.z -= speedMetersPerSec * dt;

    if (mode === 'corridor') {
      const limits = getCorridorLateralLimit(gameRuntime.position.z);
      if (gameRuntime.position.x < limits.minX) {
        gameRuntime.position.x = limits.minX;
        gameRuntime.speed *= 0.992;
      } else if (gameRuntime.position.x > limits.maxX) {
        gameRuntime.position.x = limits.maxX;
        gameRuntime.speed *= 0.992;
      }
      gameRuntime.distance = Math.max(0, -gameRuntime.position.z);
    } else {
      // Race track bounds
      const raceLimit = 12.6;
      if (gameRuntime.position.x < -raceLimit) {
        gameRuntime.position.x = -raceLimit;
        gameRuntime.speed *= 0.99;
      } else if (gameRuntime.position.x > raceLimit) {
        gameRuntime.position.x = raceLimit;
        gameRuntime.speed *= 0.99;
      }
      gameRuntime.distance = Math.max(0, -gameRuntime.position.z);
    }

    gameRuntime.drift = damp(
      gameRuntime.drift,
      Math.abs(gameRuntime.steering) * speedRatio * (0.2 + rainFactor * 0.6),
      8,
      dt
    );
  }

  // Kerb detection along track edges
  const absX = Math.abs(gameRuntime.position.x);
  gameRuntime.surfaceKerb = mode !== 'open_world' && absX > 10.6 && absX < 13.4;

  // Chassis pitch (acceleration squat / brake dive) & corner roll
  const targetPitch = gameRuntime.brake * 0.042 - gameRuntime.throttle * 0.018;
  const targetRoll = -gameRuntime.steering * 0.055 * speedRatio;
  gameRuntime.rotation.x = damp(gameRuntime.rotation.x, targetPitch, 10, dt);
  gameRuntime.rotation.z = damp(gameRuntime.rotation.z, targetRoll, 10, dt);

  // Camera shake (kerbs + 6th gear failure)
  const kerbShake = gameRuntime.surfaceKerb ? speedRatio * 0.55 : 0;
  const gearShake = gameRuntime.transmissionFailed ? 0.25 + speedRatio * 0.25 : 0;
  gameRuntime.shakeIntensity = Math.max(kerbShake, gearShake);

  // Gear & RPM telemetry
  const { gear, rpm } = computeGearAndRpm(gameRuntime.speed, gameRuntime.gearLocked);
  gameRuntime.gear = gear;
  gameRuntime.rpm = damp(gameRuntime.rpm, rpm, 14, dt);
}
