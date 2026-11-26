export type GameMode = 'landing' | 'corridor' | 'race' | 'open_world' | 'credits';

export type ShowroomAngleZone = 'front' | 'right' | 'rear' | 'left';

export type ExplodedPart = 'engine' | 'wheels' | 'aero' | 'cockpit';

export type EngineArchitecture = 'V6' | 'V8' | 'V10' | 'V12';

export interface TimelineTechnicalSheet {
  engineType: string;
  displacement: string;
  engineArch: EngineArchitecture;
  valveCoverColor: string;
  gearbox: string;
  brakes: string;
  aero: string;
  weight: string;
}

export interface TimelineCarSpecs {
  aeroFront: string;
  engineChassis: string;
  rearTraction: string;
  cockpitDriver: string;
}

export interface TimelineCarEntry {
  stageId: number;
  year: number;
  eraTitle: string;
  chassis: string;
  team: string;
  circuitLabel: string;
  summary: string;
  livery: CarLivery;
  specs: TimelineCarSpecs;
  technical: TimelineTechnicalSheet;
}

export type PortalSide = 'left' | 'right';

export type GraphicsQuality = 'high' | 'medium' | 'low';

export type RaceMechanic =
  | 'overtake_rain'
  | 'storm_speed'
  | 'stumble_recovery'
  | 'wheel_to_wheel'
  | 'sixth_gear_failure'
  | 'defend_lead'
  | 'four_overtakes';

export type OpponentAIState =
  | 'cruising'
  | 'defending'
  | 'attacking'
  | 'avoiding'
  | 'overtaken'
  | 'finished';

export type MonumentVisualType =
  | 'kart'
  | 'toleman_lotus'
  | 'mclaren_arches'
  | 'monaco_water'
  | 'instituto_sun'
  | 'eternal_helmet';

export interface CarLivery {
  id: string;
  teamName: string;
  chassisName: string;
  primary: string;
  secondary: string;
  accent: string;
  stripe: string;
  numberText: string;
}

export interface StageWeather {
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  sunColor: string;
  sunIntensity: number;
  ambientIntensity: number;
  rain: number;
  wetAsphalt: boolean;
  lightning?: boolean;
}

export interface OpponentSpec {
  id: string;
  name: string;
  team: string;
  livery: CarLivery;
  initialOffsetZ: number;
  laneX: number;
  baseSpeedKmh: number;
  aggression: number;
}

export interface StageConfig {
  id: number;
  slug: string;
  portalSide: PortalSide;
  portalZ: number;
  circuit: string;
  year: number;
  raceDistance: number;
  mechanic: RaceMechanic;
  car: CarLivery;
  weather: StageWeather;
  opponents: OpponentSpec[];
  targetOvertakes: number;
}

export interface ChapterMonument {
  id: number;
  title: string;
  period: string;
  text: string;
  position: { x: number; z: number };
  accentColor: string;
  visualType: MonumentVisualType;
}

export interface GameSettings {
  masterVolume: number;
  muted: boolean;
  quality: GraphicsQuality;
  steeringSensitivity: number;
  cameraDistance: number;
  reducedMotion: boolean;
}

export interface PersistedProgress {
  version: number;
  completedStages: number[];
  unlockedChapters: number[];
  settings: GameSettings;
}

export interface RaceResultState {
  status: 'victory' | 'defeat';
  stageId: number;
  position: number;
  overtakesCompleted: number;
  overtakesRequired: number;
  elapsedSeconds: number;
}

export interface TransitionBanner {
  title: string;
  subtitle: string;
  accentColor?: string;
}

export interface OpponentRuntimeState {
  id: string;
  name: string;
  x: number;
  z: number;
  speed: number;
  heading: number;
  aiState: OpponentAIState;
  overtakenByPlayer: boolean;
  targetLaneX: number;
}

export interface GameRuntime {
  speed: number;
  rpm: number;
  gear: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  steering: number;
  throttle: number;
  brake: number;
  distance: number;
  drift: number;
  rainIntensity: number;
  activeStageId: number | null;
  lastHudUpdate: number;
  previousPosition: { x: number; y: number; z: number };
  heading: number;
  angularVelocity: number;
  gearLocked: boolean;
  transmissionFailed: boolean;
  stumbleElapsed: number;
  stumbleTriggered: boolean;
  overtakesCompleted: number;
  raceElapsed: number;
  raceFinished: boolean;
  shakeIntensity: number;
  surfaceKerb: boolean;
  handbrake: boolean;
  opponents: OpponentRuntimeState[];
  nearestMonumentId: number | null;
  nearestMonumentDistance: number;
  compassAngle: number;
  lightningFlash: number;
  overtakePulseAt: number;
  audioReady: boolean;
  cameraIntroProgress: number;
}
