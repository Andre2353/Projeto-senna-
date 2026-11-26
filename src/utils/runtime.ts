import { STAGES } from '../data/sennaData';
import type { GameRuntime, RaceStandingEntry, StageConfig } from '../types/game';
import { getTrackOffsetX } from './trackLayout';

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
  racePhase: 'racing',
  countdownLights: 0,
  countdownGoFlashUntil: 0,
  playerLap: 1,
  playerTotalDistance: 0,
  playerRank: 1,
  lapStartMs: 0,
  currentLapMs: 0,
  bestLapMs: null,
  lastLapMs: null,
  finishTimeMs: null,
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
  gameRuntime.racePhase = 'racing';
  gameRuntime.countdownLights = 0;
  gameRuntime.countdownGoFlashUntil = 0;
  gameRuntime.playerLap = 1;
  gameRuntime.playerTotalDistance = 0;
  gameRuntime.playerRank = 1;
  gameRuntime.lapStartMs = 0;
  gameRuntime.currentLapMs = 0;
  gameRuntime.bestLapMs = null;
  gameRuntime.lastLapMs = null;
  gameRuntime.finishTimeMs = null;
  gameRuntime.opponents = [];
  gameRuntime.rainIntensity = 0.12;
  gameRuntime.lightningFlash = 0;
  gameRuntime.overtakePulseAt = 0;
}

export function initializeStageRuntime(stage: StageConfig): void {
  const playerSlot = stage.playerGridPosition;
  const startZ = 4 + (playerSlot - 1) * 6.5;
  const startLaneX = playerSlot % 2 === 1 ? -2.6 : 2.6;
  const startTrackX = getTrackOffsetX(stage.id, startZ, stage.lapLength);
  const startWorldX = startTrackX + startLaneX;

  gameRuntime.activeStageId = stage.id;
  resetCarPose(startZ, startWorldX, 0);
  gameRuntime.speed = 0;
  gameRuntime.rpm = 4200;
  gameRuntime.gear = 1;
  gameRuntime.distance = 0;
  gameRuntime.gearLocked = false;
  gameRuntime.transmissionFailed = false;
  gameRuntime.stumbleElapsed = 0;
  gameRuntime.stumbleTriggered = false;
  gameRuntime.overtakesCompleted = 0;
  gameRuntime.raceElapsed = 0;
  gameRuntime.raceFinished = false;
  gameRuntime.racePhase = 'countdown';
  gameRuntime.countdownLights = 0;
  gameRuntime.countdownGoFlashUntil = 0;
  gameRuntime.playerLap = 1;
  gameRuntime.playerTotalDistance = -startZ;
  gameRuntime.playerRank = playerSlot;
  gameRuntime.lapStartMs = 0;
  gameRuntime.currentLapMs = 0;
  gameRuntime.bestLapMs = null;
  gameRuntime.lastLapMs = null;
  gameRuntime.finishTimeMs = null;
  gameRuntime.rainIntensity = stage.weather.rain;
  gameRuntime.lightningFlash = 0;
  gameRuntime.overtakePulseAt = 0;

  gameRuntime.opponents = stage.opponents.map((spec) => {
    const oppTrackX = getTrackOffsetX(stage.id, spec.initialOffsetZ, stage.lapLength);
    const parts = spec.name.trim().split(' ');
    const fallbackShort = parts[parts.length - 1] ?? spec.name;
    const totalDist = -spec.initialOffsetZ;

    return {
      id: spec.id,
      name: spec.name,
      shortName: spec.shortName || fallbackShort,
      team: spec.team,
      carNumber: spec.livery.numberText,
      primaryColor: spec.livery.primary,
      secondaryColor: spec.livery.secondary,
      lap: 1,
      x: oppTrackX + spec.laneX,
      laneOffsetX: spec.laneX,
      z: spec.initialOffsetZ,
      totalDistance: totalDist,
      visualZ: spec.initialOffsetZ,
      visualX: oppTrackX + spec.laneX,
      visualVisible: Math.abs(totalDist - (-startZ)) < 450,
      speed: 0,
      heading: 0,
      aiState: 'cruising',
      overtakenByPlayer: spec.initialOffsetZ > startZ,
      targetLaneX: spec.laneX,
      currentLapStartMs: 0,
      bestLapMs: null,
      finished: false,
      finishTimeMs: null,
    };
  });
}

export function buildRaceStandings(stage: StageConfig): RaceStandingEntry[] {
  const entries: RaceStandingEntry[] = [
    {
      id: 'player',
      name: 'AYRTON SENNA',
      team: stage.car.teamName,
      carNumber: stage.car.numberText,
      primaryColor: stage.car.primary,
      secondaryColor: stage.car.secondary,
      isPlayer: true,
      position: 1,
      lap: gameRuntime.playerLap,
      totalDistance: gameRuntime.playerTotalDistance,
      bestLapMs: gameRuntime.bestLapMs,
      finishTimeMs: gameRuntime.finishTimeMs,
      finished: gameRuntime.raceFinished,
    },
    ...gameRuntime.opponents.map((opp) => ({
      id: opp.id,
      name: opp.name,
      team: opp.team,
      carNumber: opp.carNumber,
      primaryColor: opp.primaryColor,
      secondaryColor: opp.secondaryColor,
      isPlayer: false,
      position: 1,
      lap: opp.lap,
      totalDistance: opp.totalDistance,
      bestLapMs: opp.bestLapMs,
      finishTimeMs: opp.finishTimeMs,
      finished: opp.finished,
    })),
  ];

  entries.sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
    }
    if (a.finished !== b.finished) {
      return a.finished ? -1 : 1;
    }
    return b.totalDistance - a.totalDistance;
  });

  for (let i = 0; i < entries.length; i++) {
    entries[i]!.position = i + 1;
  }

  return entries;
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
  gameRuntime.racePhase = 'racing';
  gameRuntime.countdownLights = 0;
  gameRuntime.playerLap = 1;
  gameRuntime.playerTotalDistance = 0;
  gameRuntime.playerRank = 1;
  gameRuntime.opponents = [];
  gameRuntime.rainIntensity = 0;
  gameRuntime.lightningFlash = 0;
  gameRuntime.nearestMonumentId = 1;
  gameRuntime.nearestMonumentDistance = 210;
  gameRuntime.compassAngle = 0;
}
