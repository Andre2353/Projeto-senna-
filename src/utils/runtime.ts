import { STAGES } from '../data/sennaData';
import type { GameRuntime, StageConfig } from '../types/game';

export const gameRuntime: GameRuntime = {
  speed: 0,
  rpm: 3200,
  gear: 1,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  steering: 0,
  throttle: 0,
  brake: 0,
  distance: 0,
  drift: 0,
  rainIntensity: 0.15,
  activeStageId: null,
  lastHudUpdate: 0,
  previousPosition: { x: 0, y: 0, z: 0 },
  heading: 0,
  angularVelocity: 0,
  gearLocked: false,
  transmissionFailed: false,
  stumbleElapsed: 0,
  stumbleTriggered: false,
  overtakesCompleted: 0,
  raceElapsed: 0,
  raceFinished: false,
  shakeIntensity: 0,
  surfaceKerb: false,
  handbrake: false,
  opponents: [],
  nearestMonumentId: 1,
  nearestMonumentDistance: 0,
  compassAngle: 0,
  lightningFlash: 0,
  overtakePulseAt: 0,
  audioReady: false,
  cameraIntroProgress: 0,
};

export function getActiveStageConfig(): StageConfig | null {
  if (gameRuntime.activeStageId === null) {
    return null;
  }
  return STAGES.find((stage) => stage.id === gameRuntime.activeStageId) ?? null;
}

export function resetCarPose(z: number, x = 0, heading = 0): void {
  gameRuntime.position.x = x;
  gameRuntime.position.y = 0;
  gameRuntime.position.z = z;
  gameRuntime.previousPosition.x = x;
  gameRuntime.previousPosition.y = 0;
  gameRuntime.previousPosition.z = z;
  gameRuntime.rotation.x = 0;
  gameRuntime.rotation.y = heading;
  gameRuntime.rotation.z = 0;
  gameRuntime.heading = heading;
  gameRuntime.angularVelocity = 0;
  gameRuntime.steering = 0;
  gameRuntime.throttle = 0;
  gameRuntime.brake = 0;
  gameRuntime.drift = 0;
  gameRuntime.surfaceKerb = false;
  gameRuntime.handbrake = false;
  gameRuntime.shakeIntensity = 0;
}

export function resetForCorridor(z = 0, keepSpeed = false): void {
  gameRuntime.activeStageId = null;
  resetCarPose(z, 0, 0);
  if (!keepSpeed) {
    gameRuntime.speed = 0;
    gameRuntime.rpm = 3200;
    gameRuntime.gear = 1;
  }
  gameRuntime.distance = Math.abs(z);
  gameRuntime.gearLocked = false;
  gameRuntime.transmissionFailed = false;
  gameRuntime.stumbleElapsed = 0;
  gameRuntime.stumbleTriggered = false;
  gameRuntime.overtakesCompleted = 0;
  gameRuntime.raceElapsed = 0;
  gameRuntime.raceFinished = false;
  gameRuntime.opponents = [];
  gameRuntime.rainIntensity = 0.12;
  gameRuntime.lightningFlash = 0;
  gameRuntime.overtakePulseAt = 0;
}

export function initializeStageRuntime(stage: StageConfig): void {
  gameRuntime.activeStageId = stage.id;
  resetCarPose(0, 0, 0);
  gameRuntime.speed = stage.mechanic === 'defend_lead' ? 185 : 95;
  gameRuntime.rpm = 8500;
  gameRuntime.gear = stage.mechanic === 'defend_lead' ? 4 : 2;
  gameRuntime.distance = 0;
  gameRuntime.gearLocked = false;
  gameRuntime.transmissionFailed = false;
  gameRuntime.stumbleElapsed = 0;
  gameRuntime.stumbleTriggered = false;
  gameRuntime.overtakesCompleted = 0;
  gameRuntime.raceElapsed = 0;
  gameRuntime.raceFinished = false;
  gameRuntime.rainIntensity = stage.weather.rain;
  gameRuntime.lightningFlash = 0;
  gameRuntime.overtakePulseAt = 0;

  gameRuntime.opponents = stage.opponents.map((spec) => ({
    id: spec.id,
    name: spec.name,
    x: spec.laneX,
    z: spec.initialOffsetZ,
    speed: spec.baseSpeedKmh * 0.72,
    heading: 0,
    aiState: stage.mechanic === 'defend_lead' ? 'attacking' : 'cruising',
    overtakenByPlayer: false,
    targetLaneX: spec.laneX,
  }));
}

export function resetForOpenWorld(startZ = -965): void {
  gameRuntime.activeStageId = null;
  resetCarPose(startZ, 0, 0);
  gameRuntime.speed = 145;
  gameRuntime.rpm = 9200;
  gameRuntime.gear = 3;
  gameRuntime.gearLocked = false;
  gameRuntime.transmissionFailed = false;
  gameRuntime.stumbleElapsed = 0;
  gameRuntime.stumbleTriggered = false;
  gameRuntime.overtakesCompleted = 0;
  gameRuntime.raceElapsed = 0;
  gameRuntime.raceFinished = false;
  gameRuntime.opponents = [];
  gameRuntime.rainIntensity = 0;
  gameRuntime.lightningFlash = 0;
  gameRuntime.nearestMonumentId = 1;
  gameRuntime.nearestMonumentDistance = 210;
  gameRuntime.compassAngle = 0;
}
