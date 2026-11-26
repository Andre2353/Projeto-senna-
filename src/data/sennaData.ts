import type {
  CarLivery,
  ChapterMonument,
  GameSettings,
  OpponentSpec,
  StageConfig,
  TimelineCarEntry,
} from '../types/game';

export const CORRIDOR_START_Z = 0;
export const CORRIDOR_END_Z = -950;
export const CORRIDOR_HALF_WIDTH = 14;
export const PORTAL_Z_POSITIONS = [-90, -210, -330, -450, -570, -690, -810] as const;

export const STORAGE_KEY = 'senna_portais_legado_state';
export const STORAGE_VERSION = 1;

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.65,
  muted: false,
  quality: 'high',
  steeringSensitivity: 1.0,
  cameraDistance: 1.0,
  reducedMotion: false,
};

export const DEFAULT_MCLAREN_LIVERY: CarLivery = {
  id: 'mclaren-classic',
  teamName: 'McLaren Honda',
  chassisName: 'MP4/4',
  primary: '#F8FAFC',
  secondary: '#EF4444',
  accent: '#FACC15',
  stripe: '#09090B',
  numberText: '12',
};

const WILLIAMS_LIVERY: CarLivery = {
  id: 'williams-fw14b',
  teamName: 'Williams',
  chassisName: 'FW14B',
  primary: '#1D4ED8',
  secondary: '#EAB308',
  accent: '#F8FAFC',
  stripe: '#FFFFFF',
  numberText: '5',
};

const FERRARI_LIVERY: CarLivery = {
  id: 'ferrari-156-85',
  teamName: 'Ferrari',
  chassisName: 'F1/87',
  primary: '#DC2626',
  secondary: '#09090B',
  accent: '#FACC15',
  stripe: '#FFFFFF',
  numberText: '27',
};

const TYRRELL_LIVERY: CarLivery = {
  id: 'tyrrell-019',
  teamName: 'Tyrrell',
  chassisName: '019',
  primary: '#1E3A8A',
  secondary: '#F8FAFC',
  accent: '#38BDF8',
  stripe: '#09090B',
  numberText: '4',
};

const BENETTON_LIVERY: CarLivery = {
  id: 'benetton-b193',
  teamName: 'Benetton',
  chassisName: 'B193',
  primary: '#16A34A',
  secondary: '#EAB308',
  accent: '#1D4ED8',
  stripe: '#FFFFFF',
  numberText: '5',
};

const SAUBER_LIVERY: CarLivery = {
  id: 'sauber-c12',
  teamName: 'Sauber',
  chassisName: 'C12',
  primary: '#18181B',
  secondary: '#3F3F46',
  accent: '#F8FAFC',
  stripe: '#71717A',
  numberText: '29',
};

const PROST_MCLAREN_LIVERY: CarLivery = {
  id: 'mclaren-prost',
  teamName: 'McLaren',
  chassisName: 'MP4',
  primary: '#F8FAFC',
  secondary: '#EF4444',
  accent: '#09090B',
  stripe: '#DC2626',
  numberText: '7',
};

const BRABHAM_LIVERY: CarLivery = {
  id: 'brabham-bt53',
  teamName: 'Brabham',
  chassisName: 'BT53',
  primary: '#1E293B',
  secondary: '#F8FAFC',
  accent: '#38BDF8',
  stripe: '#EAB308',
  numberText: '1',
};

const LOTUS_BLACK_LIVERY: CarLivery = {
  id: 'lotus-jps',
  teamName: 'Lotus',
  chassisName: '97T',
  primary: '#09090B',
  secondary: '#EAB308',
  accent: '#FACC15',
  stripe: '#CA8A04',
  numberText: '11',
};

const LOTUS_CAMEL_LIVERY: CarLivery = {
  id: 'lotus-camel',
  teamName: 'Lotus',
  chassisName: '100T',
  primary: '#EAB308',
  secondary: '#1D4ED8',
  accent: '#F8FAFC',
  stripe: '#09090B',
  numberText: '1',
};

const LIGIER_LIVERY: CarLivery = {
  id: 'ligier-js',
  teamName: 'Ligier',
  chassisName: 'JS33',
  primary: '#2563EB',
  secondary: '#F8FAFC',
  accent: '#DC2626',
  stripe: '#F8FAFC',
  numberText: '25',
};

const MARCH_LIVERY: CarLivery = {
  id: 'march-leyton',
  teamName: 'Leyton House',
  chassisName: 'CG901',
  primary: '#0EA5E9',
  secondary: '#0F172A',
  accent: '#F8FAFC',
  stripe: '#38BDF8',
  numberText: '16',
};

interface RivalTemplate {
  id: string;
  name: string;
  shortName: string;
  team: string;
  helmetColor: string;
  livery: CarLivery;
  number: string;
  baseSpeedKmh: number;
  cornerSkill: number;
  aggression: number;
}

function buildGridOpponents(
  stageSlug: string,
  playerGridPos: number,
  templates: readonly RivalTemplate[]
): OpponentSpec[] {
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((pos) => pos !== playerGridPos);
  return templates.slice(0, 9).map((tpl, idx) => {
    const slot = slots[idx] ?? idx + 1;
    const laneX = slot % 2 === 1 ? -2.6 : 2.6;
    const initialOffsetZ = 4 + (slot - 1) * 6.5;
    return {
      id: `${stageSlug}-${tpl.id}`,
      name: tpl.name,
      shortName: tpl.shortName,
      team: tpl.team,
      helmetColor: tpl.helmetColor,
      livery: { ...tpl.livery, numberText: tpl.number },
      initialOffsetZ,
      laneX,
      baseSpeedKmh: tpl.baseSpeedKmh,
      cornerSkill: tpl.cornerSkill,
      aggression: tpl.aggression,
    };
  });
}

export const STAGES: readonly StageConfig[] = [
  {
    id: 1,
    slug: 'monaco-1984',
    portalSide: 'left',
    portalZ: -90,
    circuit: 'MÔNACO',
    year: 1984,
    lapLength: 1440,
    totalLaps: 3,
    playerGridPosition: 6,
    raceDistance: 1440 * 3,
    mechanic: 'overtake_rain',
    car: {
      id: 'toleman-tg184',
      teamName: 'Toleman Hart',
      chassisName: 'TG184',
      primary: '#F8FAFC',
      secondary: '#1D4ED8',
      accent: '#EF4444',
      stripe: '#1E3A8A',
      numberText: '19',
    },
    weather: {
      skyColor: '#1e293b',
      fogColor: '#1e293b',
      fogNear: 28,
      fogFar: 250,
      sunColor: '#94a3b8',
      sunIntensity: 1.15,
      ambientIntensity: 0.78,
      rain: 1.0,
      wetAsphalt: true,
    },
    opponents: buildGridOpponents('monaco84', 6, [
      { id: 'prost', name: 'ALAIN PROST', shortName: 'PROST', team: 'McLaren', helmetColor: '#F8FAFC', livery: PROST_MCLAREN_LIVERY, number: '7', baseSpeedKmh: 246, cornerSkill: 0.94, aggression: 0.68 },
      { id: 'mansell', name: 'NIGEL MANSELL', shortName: 'MANSELL', team: 'Lotus', helmetColor: '#1D4ED8', livery: LOTUS_BLACK_LIVERY, number: '12', baseSpeedKmh: 244, cornerSkill: 0.92, aggression: 0.8 },
      { id: 'lauda', name: 'NIKI LAUDA', shortName: 'LAUDA', team: 'McLaren', helmetColor: '#DC2626', livery: PROST_MCLAREN_LIVERY, number: '8', baseSpeedKmh: 242, cornerSkill: 0.93, aggression: 0.6 },
      { id: 'piquet', name: 'NELSON PIQUET', shortName: 'PIQUET', team: 'Brabham', helmetColor: '#FACC15', livery: BRABHAM_LIVERY, number: '1', baseSpeedKmh: 240, cornerSkill: 0.9, aggression: 0.65 },
      { id: 'alboreto', name: 'MICHELE ALBORETO', shortName: 'ALBORETO', team: 'Ferrari', helmetColor: '#FACC15', livery: FERRARI_LIVERY, number: '27', baseSpeedKmh: 238, cornerSkill: 0.89, aggression: 0.62 },
      { id: 'rosberg', name: 'KEKE ROSBERG', shortName: 'ROSBERG', team: 'Williams', helmetColor: '#F8FAFC', livery: WILLIAMS_LIVERY, number: '6', baseSpeedKmh: 235, cornerSkill: 0.88, aggression: 0.72 },
      { id: 'angelis', name: 'ELIO DE ANGELIS', shortName: 'DE ANGELIS', team: 'Lotus', helmetColor: '#F8FAFC', livery: LOTUS_BLACK_LIVERY, number: '11', baseSpeedKmh: 232, cornerSkill: 0.87, aggression: 0.5 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Alfa Romeo', helmetColor: '#EAB308', livery: FERRARI_LIVERY, number: '22', baseSpeedKmh: 229, cornerSkill: 0.85, aggression: 0.52 },
      { id: 'tambay', name: 'PATRICK TAMBAY', shortName: 'TAMBAY', team: 'Renault', helmetColor: '#38BDF8', livery: LOTUS_CAMEL_LIVERY, number: '15', baseSpeedKmh: 225, cornerSkill: 0.84, aggression: 0.45 },
    ]),
    targetOvertakes: 5,
  },
  {
    id: 2,
    slug: 'estoril-1985',
    portalSide: 'right',
    portalZ: -210,
    circuit: 'ESTORIL',
    year: 1985,
    lapLength: 1560,
    totalLaps: 3,
    playerGridPosition: 1,
    raceDistance: 1560 * 3,
    mechanic: 'storm_speed',
    car: {
      id: 'lotus-97t',
      teamName: 'Lotus Renault',
      chassisName: '97T',
      primary: '#09090B',
      secondary: '#EAB308',
      accent: '#FACC15',
      stripe: '#CA8A04',
      numberText: '12',
    },
    weather: {
      skyColor: '#0f172a',
      fogColor: '#0f172a',
      fogNear: 32,
      fogFar: 265,
      sunColor: '#64748b',
      sunIntensity: 1.0,
      ambientIntensity: 0.7,
      rain: 0.9,
      wetAsphalt: true,
    },
    opponents: buildGridOpponents('estoril85', 1, [
      { id: 'prost', name: 'ALAIN PROST', shortName: 'PROST', team: 'McLaren', helmetColor: '#F8FAFC', livery: PROST_MCLAREN_LIVERY, number: '2', baseSpeedKmh: 256, cornerSkill: 0.95, aggression: 0.74 },
      { id: 'alboreto', name: 'MICHELE ALBORETO', shortName: 'ALBORETO', team: 'Ferrari', helmetColor: '#FACC15', livery: FERRARI_LIVERY, number: '27', baseSpeedKmh: 254, cornerSkill: 0.92, aggression: 0.7 },
      { id: 'angelis', name: 'ELIO DE ANGELIS', shortName: 'DE ANGELIS', team: 'Lotus', helmetColor: '#F8FAFC', livery: LOTUS_BLACK_LIVERY, number: '11', baseSpeedKmh: 250, cornerSkill: 0.91, aggression: 0.58 },
      { id: 'mansell', name: 'NIGEL MANSELL', shortName: 'MANSELL', team: 'Williams', helmetColor: '#1D4ED8', livery: WILLIAMS_LIVERY, number: '5', baseSpeedKmh: 249, cornerSkill: 0.9, aggression: 0.78 },
      { id: 'lauda', name: 'NIKI LAUDA', shortName: 'LAUDA', team: 'McLaren', helmetColor: '#DC2626', livery: PROST_MCLAREN_LIVERY, number: '1', baseSpeedKmh: 246, cornerSkill: 0.9, aggression: 0.55 },
      { id: 'piquet', name: 'NELSON PIQUET', shortName: 'PIQUET', team: 'Brabham', helmetColor: '#FACC15', livery: BRABHAM_LIVERY, number: '7', baseSpeedKmh: 243, cornerSkill: 0.89, aggression: 0.62 },
      { id: 'rosberg', name: 'KEKE ROSBERG', shortName: 'ROSBERG', team: 'Williams', helmetColor: '#F8FAFC', livery: WILLIAMS_LIVERY, number: '6', baseSpeedKmh: 241, cornerSkill: 0.88, aggression: 0.68 },
      { id: 'berger', name: 'GERHARD BERGER', shortName: 'BERGER', team: 'Arrows', helmetColor: '#1D4ED8', livery: TYRRELL_LIVERY, number: '17', baseSpeedKmh: 236, cornerSkill: 0.86, aggression: 0.56 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Alfa Romeo', helmetColor: '#EAB308', livery: FERRARI_LIVERY, number: '22', baseSpeedKmh: 232, cornerSkill: 0.85, aggression: 0.5 },
    ]),
    targetOvertakes: 0,
  },
  {
    id: 3,
    slug: 'suzuka-1988',
    portalSide: 'left',
    portalZ: -330,
    circuit: 'SUZUKA',
    year: 1988,
    lapLength: 1680,
    totalLaps: 3,
    playerGridPosition: 4,
    raceDistance: 1680 * 3,
    mechanic: 'stumble_recovery',
    car: {
      id: 'mclaren-mp4-4',
      teamName: 'McLaren Honda',
      chassisName: 'MP4/4',
      primary: '#F8FAFC',
      secondary: '#EF4444',
      accent: '#FACC15',
      stripe: '#09090B',
      numberText: '12',
    },
    weather: {
      skyColor: '#7c2d12',
      fogColor: '#9a3412',
      fogNear: 75,
      fogFar: 460,
      sunColor: '#fdba74',
      sunIntensity: 2.3,
      ambientIntensity: 0.85,
      rain: 0,
      wetAsphalt: false,
    },
    opponents: buildGridOpponents('suzuka88', 4, [
      { id: 'prost', name: 'ALAIN PROST', shortName: 'PROST', team: 'McLaren', helmetColor: '#F8FAFC', livery: PROST_MCLAREN_LIVERY, number: '11', baseSpeedKmh: 266, cornerSkill: 0.96, aggression: 0.75 },
      { id: 'berger', name: 'GERHARD BERGER', shortName: 'BERGER', team: 'Ferrari', helmetColor: '#1D4ED8', livery: FERRARI_LIVERY, number: '28', baseSpeedKmh: 261, cornerSkill: 0.93, aggression: 0.68 },
      { id: 'piquet', name: 'NELSON PIQUET', shortName: 'PIQUET', team: 'Lotus', helmetColor: '#FACC15', livery: LOTUS_CAMEL_LIVERY, number: '1', baseSpeedKmh: 258, cornerSkill: 0.92, aggression: 0.64 },
      { id: 'alboreto', name: 'MICHELE ALBORETO', shortName: 'ALBORETO', team: 'Ferrari', helmetColor: '#FACC15', livery: FERRARI_LIVERY, number: '27', baseSpeedKmh: 255, cornerSkill: 0.91, aggression: 0.6 },
      { id: 'mansell', name: 'NIGEL MANSELL', shortName: 'MANSELL', team: 'Williams', helmetColor: '#1D4ED8', livery: WILLIAMS_LIVERY, number: '5', baseSpeedKmh: 254, cornerSkill: 0.91, aggression: 0.78 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Williams', helmetColor: '#EAB308', livery: WILLIAMS_LIVERY, number: '6', baseSpeedKmh: 249, cornerSkill: 0.89, aggression: 0.56 },
      { id: 'nannini', name: 'ALESSANDRO NANNINI', shortName: 'NANNINI', team: 'Benetton', helmetColor: '#F8FAFC', livery: BENETTON_LIVERY, number: '19', baseSpeedKmh: 246, cornerSkill: 0.88, aggression: 0.58 },
      { id: 'boutsen', name: 'THIERRY BOUTSEN', shortName: 'BOUTSEN', team: 'Benetton', helmetColor: '#EF4444', livery: BENETTON_LIVERY, number: '20', baseSpeedKmh: 243, cornerSkill: 0.87, aggression: 0.52 },
      { id: 'capelli', name: 'IVAN CAPELLI', shortName: 'CAPELLI', team: 'March', helmetColor: '#FACC15', livery: MARCH_LIVERY, number: '16', baseSpeedKmh: 239, cornerSkill: 0.86, aggression: 0.55 },
    ]),
    targetOvertakes: 3,
  },
  {
    id: 4,
    slug: 'phoenix-1990',
    portalSide: 'right',
    portalZ: -450,
    circuit: 'PHOENIX',
    year: 1990,
    lapLength: 1520,
    totalLaps: 3,
    playerGridPosition: 5,
    raceDistance: 1520 * 3,
    mechanic: 'wheel_to_wheel',
    car: {
      id: 'mclaren-mp4-5b',
      teamName: 'McLaren Honda',
      chassisName: 'MP4/5B',
      primary: '#F8FAFC',
      secondary: '#EF4444',
      accent: '#FACC15',
      stripe: '#09090B',
      numberText: '27',
    },
    weather: {
      skyColor: '#0284c7',
      fogColor: '#38bdf8',
      fogNear: 90,
      fogFar: 520,
      sunColor: '#fef3c7',
      sunIntensity: 2.6,
      ambientIntensity: 0.9,
      rain: 0,
      wetAsphalt: false,
    },
    opponents: buildGridOpponents('phoenix90', 5, [
      { id: 'alesi', name: 'JEAN ALESI', shortName: 'ALESI', team: 'Tyrrell', helmetColor: '#F8FAFC', livery: TYRRELL_LIVERY, number: '4', baseSpeedKmh: 266, cornerSkill: 0.96, aggression: 0.9 },
      { id: 'prost', name: 'ALAIN PROST', shortName: 'PROST', team: 'Ferrari', helmetColor: '#F8FAFC', livery: FERRARI_LIVERY, number: '1', baseSpeedKmh: 264, cornerSkill: 0.95, aggression: 0.72 },
      { id: 'berger', name: 'GERHARD BERGER', shortName: 'BERGER', team: 'McLaren', helmetColor: '#1D4ED8', livery: PROST_MCLAREN_LIVERY, number: '28', baseSpeedKmh: 261, cornerSkill: 0.93, aggression: 0.68 },
      { id: 'mansell', name: 'NIGEL MANSELL', shortName: 'MANSELL', team: 'Ferrari', helmetColor: '#1D4ED8', livery: FERRARI_LIVERY, number: '2', baseSpeedKmh: 258, cornerSkill: 0.92, aggression: 0.8 },
      { id: 'piquet', name: 'NELSON PIQUET', shortName: 'PIQUET', team: 'Benetton', helmetColor: '#FACC15', livery: BENETTON_LIVERY, number: '20', baseSpeedKmh: 255, cornerSkill: 0.91, aggression: 0.66 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Williams', helmetColor: '#EAB308', livery: WILLIAMS_LIVERY, number: '6', baseSpeedKmh: 252, cornerSkill: 0.9, aggression: 0.6 },
      { id: 'boutsen', name: 'THIERRY BOUTSEN', shortName: 'BOUTSEN', team: 'Williams', helmetColor: '#EF4444', livery: WILLIAMS_LIVERY, number: '5', baseSpeedKmh: 249, cornerSkill: 0.89, aggression: 0.56 },
      { id: 'nannini', name: 'ALESSANDRO NANNINI', shortName: 'NANNINI', team: 'Benetton', helmetColor: '#F8FAFC', livery: BENETTON_LIVERY, number: '19', baseSpeedKmh: 245, cornerSkill: 0.88, aggression: 0.58 },
      { id: 'capelli', name: 'IVAN CAPELLI', shortName: 'CAPELLI', team: 'Leyton House', helmetColor: '#FACC15', livery: MARCH_LIVERY, number: '16', baseSpeedKmh: 241, cornerSkill: 0.86, aggression: 0.52 },
    ]),
    targetOvertakes: 4,
  },
  {
    id: 5,
    slug: 'interlagos-1991',
    portalSide: 'left',
    portalZ: -570,
    circuit: 'INTERLAGOS',
    year: 1991,
    lapLength: 1640,
    totalLaps: 3,
    playerGridPosition: 3,
    raceDistance: 1640 * 3,
    mechanic: 'sixth_gear_failure',
    car: {
      id: 'mclaren-mp4-6',
      teamName: 'McLaren Honda',
      chassisName: 'MP4/6',
      primary: '#F8FAFC',
      secondary: '#EF4444',
      accent: '#FACC15',
      stripe: '#09090B',
      numberText: '1',
    },
    weather: {
      skyColor: '#334155',
      fogColor: '#475569',
      fogNear: 55,
      fogFar: 360,
      sunColor: '#cbd5e1',
      sunIntensity: 1.5,
      ambientIntensity: 0.8,
      rain: 0.2,
      wetAsphalt: true,
    },
    opponents: buildGridOpponents('interlagos91', 3, [
      { id: 'mansell', name: 'NIGEL MANSELL', shortName: 'MANSELL', team: 'Williams', helmetColor: '#1D4ED8', livery: WILLIAMS_LIVERY, number: '5', baseSpeedKmh: 268, cornerSkill: 0.96, aggression: 0.85 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Williams', helmetColor: '#EAB308', livery: WILLIAMS_LIVERY, number: '6', baseSpeedKmh: 265, cornerSkill: 0.94, aggression: 0.72 },
      { id: 'berger', name: 'GERHARD BERGER', shortName: 'BERGER', team: 'McLaren', helmetColor: '#1D4ED8', livery: PROST_MCLAREN_LIVERY, number: '2', baseSpeedKmh: 260, cornerSkill: 0.93, aggression: 0.65 },
      { id: 'prost', name: 'ALAIN PROST', shortName: 'PROST', team: 'Ferrari', helmetColor: '#F8FAFC', livery: FERRARI_LIVERY, number: '27', baseSpeedKmh: 258, cornerSkill: 0.93, aggression: 0.68 },
      { id: 'alesi', name: 'JEAN ALESI', shortName: 'ALESI', team: 'Ferrari', helmetColor: '#F8FAFC', livery: FERRARI_LIVERY, number: '28', baseSpeedKmh: 255, cornerSkill: 0.91, aggression: 0.74 },
      { id: 'piquet', name: 'NELSON PIQUET', shortName: 'PIQUET', team: 'Benetton', helmetColor: '#FACC15', livery: BENETTON_LIVERY, number: '20', baseSpeedKmh: 252, cornerSkill: 0.9, aggression: 0.62 },
      { id: 'moreno', name: 'ROBERTO MORENO', shortName: 'MORENO', team: 'Benetton', helmetColor: '#FACC15', livery: BENETTON_LIVERY, number: '19', baseSpeedKmh: 248, cornerSkill: 0.88, aggression: 0.56 },
      { id: 'hakkinen', name: 'MIKA HÄKKINEN', shortName: 'HÄKKINEN', team: 'Lotus', helmetColor: '#38BDF8', livery: LOTUS_CAMEL_LIVERY, number: '11', baseSpeedKmh: 245, cornerSkill: 0.88, aggression: 0.6 },
      { id: 'modena', name: 'STEFANO MODENA', shortName: 'MODENA', team: 'Tyrrell', helmetColor: '#F8FAFC', livery: TYRRELL_LIVERY, number: '4', baseSpeedKmh: 242, cornerSkill: 0.86, aggression: 0.54 },
    ]),
    targetOvertakes: 2,
  },
  {
    id: 6,
    slug: 'monaco-1992',
    portalSide: 'right',
    portalZ: -690,
    circuit: 'MÔNACO',
    year: 1992,
    lapLength: 1480,
    totalLaps: 3,
    playerGridPosition: 1,
    raceDistance: 1480 * 3,
    mechanic: 'defend_lead',
    car: {
      id: 'mclaren-mp4-7a',
      teamName: 'McLaren Honda',
      chassisName: 'MP4/7A',
      primary: '#F8FAFC',
      secondary: '#EF4444',
      accent: '#FACC15',
      stripe: '#09090B',
      numberText: '1',
    },
    weather: {
      skyColor: '#0369a1',
      fogColor: '#0284c7',
      fogNear: 85,
      fogFar: 520,
      sunColor: '#fde68a',
      sunIntensity: 2.4,
      ambientIntensity: 0.9,
      rain: 0,
      wetAsphalt: false,
    },
    opponents: buildGridOpponents('monaco92', 1, [
      { id: 'mansell', name: 'NIGEL MANSELL', shortName: 'MANSELL', team: 'Williams', helmetColor: '#1D4ED8', livery: WILLIAMS_LIVERY, number: '5', baseSpeedKmh: 274, cornerSkill: 0.98, aggression: 0.95 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Williams', helmetColor: '#EAB308', livery: WILLIAMS_LIVERY, number: '6', baseSpeedKmh: 266, cornerSkill: 0.94, aggression: 0.72 },
      { id: 'schumacher', name: 'MICHAEL SCHUMACHER', shortName: 'SCHUMACHER', team: 'Benetton', helmetColor: '#EF4444', livery: BENETTON_LIVERY, number: '19', baseSpeedKmh: 264, cornerSkill: 0.94, aggression: 0.8 },
      { id: 'berger', name: 'GERHARD BERGER', shortName: 'BERGER', team: 'McLaren', helmetColor: '#1D4ED8', livery: PROST_MCLAREN_LIVERY, number: '2', baseSpeedKmh: 261, cornerSkill: 0.92, aggression: 0.65 },
      { id: 'alesi', name: 'JEAN ALESI', shortName: 'ALESI', team: 'Ferrari', helmetColor: '#F8FAFC', livery: FERRARI_LIVERY, number: '27', baseSpeedKmh: 256, cornerSkill: 0.91, aggression: 0.7 },
      { id: 'brundle', name: 'MARTIN BRUNDLE', shortName: 'BRUNDLE', team: 'Benetton', helmetColor: '#38BDF8', livery: BENETTON_LIVERY, number: '20', baseSpeedKmh: 252, cornerSkill: 0.9, aggression: 0.6 },
      { id: 'capelli', name: 'IVAN CAPELLI', shortName: 'CAPELLI', team: 'Ferrari', helmetColor: '#FACC15', livery: FERRARI_LIVERY, number: '28', baseSpeedKmh: 248, cornerSkill: 0.88, aggression: 0.55 },
      { id: 'hakkinen', name: 'MIKA HÄKKINEN', shortName: 'HÄKKINEN', team: 'Lotus', helmetColor: '#38BDF8', livery: LOTUS_CAMEL_LIVERY, number: '11', baseSpeedKmh: 245, cornerSkill: 0.88, aggression: 0.62 },
      { id: 'boutsen', name: 'THIERRY BOUTSEN', shortName: 'BOUTSEN', team: 'Ligier', helmetColor: '#EF4444', livery: LIGIER_LIVERY, number: '25', baseSpeedKmh: 241, cornerSkill: 0.86, aggression: 0.52 },
    ]),
    targetOvertakes: 0,
  },
  {
    id: 7,
    slug: 'donington-1993',
    portalSide: 'left',
    portalZ: -810,
    circuit: 'DONINGTON PARK',
    year: 1993,
    lapLength: 1760,
    totalLaps: 3,
    playerGridPosition: 5,
    raceDistance: 1760 * 3,
    mechanic: 'four_overtakes',
    car: {
      id: 'mclaren-mp4-8',
      teamName: 'McLaren Ford',
      chassisName: 'MP4/8',
      primary: '#F8FAFC',
      secondary: '#EF4444',
      accent: '#FACC15',
      stripe: '#09090B',
      numberText: '8',
    },
    weather: {
      skyColor: '#1e293b',
      fogColor: '#1e293b',
      fogNear: 30,
      fogFar: 255,
      sunColor: '#94a3b8',
      sunIntensity: 1.05,
      ambientIntensity: 0.74,
      rain: 0.85,
      wetAsphalt: true,
      lightning: true,
    },
    opponents: buildGridOpponents('donington93', 5, [
      { id: 'prost', name: 'ALAIN PROST', shortName: 'PROST', team: 'Williams', helmetColor: '#F8FAFC', livery: WILLIAMS_LIVERY, number: '2', baseSpeedKmh: 266, cornerSkill: 0.95, aggression: 0.78 },
      { id: 'hill', name: 'DAMON HILL', shortName: 'HILL', team: 'Williams', helmetColor: '#09090B', livery: WILLIAMS_LIVERY, number: '0', baseSpeedKmh: 262, cornerSkill: 0.93, aggression: 0.72 },
      { id: 'schumacher', name: 'MICHAEL SCHUMACHER', shortName: 'SCHUMACHER', team: 'Benetton', helmetColor: '#EF4444', livery: BENETTON_LIVERY, number: '5', baseSpeedKmh: 260, cornerSkill: 0.94, aggression: 0.82 },
      { id: 'wendlinger', name: 'KARL WENDLINGER', shortName: 'WENDLINGER', team: 'Sauber', helmetColor: '#FACC15', livery: SAUBER_LIVERY, number: '29', baseSpeedKmh: 254, cornerSkill: 0.9, aggression: 0.6 },
      { id: 'berger', name: 'GERHARD BERGER', shortName: 'BERGER', team: 'Ferrari', helmetColor: '#1D4ED8', livery: FERRARI_LIVERY, number: '28', baseSpeedKmh: 251, cornerSkill: 0.9, aggression: 0.64 },
      { id: 'alesi', name: 'JEAN ALESI', shortName: 'ALESI', team: 'Ferrari', helmetColor: '#F8FAFC', livery: FERRARI_LIVERY, number: '27', baseSpeedKmh: 248, cornerSkill: 0.89, aggression: 0.7 },
      { id: 'patrese', name: 'RICCARDO PATRESE', shortName: 'PATRESE', team: 'Benetton', helmetColor: '#EAB308', livery: BENETTON_LIVERY, number: '6', baseSpeedKmh: 245, cornerSkill: 0.88, aggression: 0.56 },
      { id: 'brundle', name: 'MARTIN BRUNDLE', shortName: 'BRUNDLE', team: 'Ligier', helmetColor: '#38BDF8', livery: LIGIER_LIVERY, number: '25', baseSpeedKmh: 241, cornerSkill: 0.87, aggression: 0.54 },
      { id: 'lehto', name: 'JJ LEHTO', shortName: 'LEHTO', team: 'Sauber', helmetColor: '#E2E8F0', livery: SAUBER_LIVERY, number: '30', baseSpeedKmh: 237, cornerSkill: 0.85, aggression: 0.52 },
    ]),
    targetOvertakes: 4,
  },
];

export const OPEN_WORLD_CHAPTERS: readonly ChapterMonument[] = [
  {
    id: 1,
    title: 'CAPÍTULO 1 — RAÍZES NO KART',
    period: '1973–1981',
    text: 'Antes dos grandes circuitos, existia uma criança que encontrou no kart a sua primeira linguagem. A obsessão pela precisão começou muito antes da Fórmula 1.',
    position: { x: -95, z: -1120 },
    accentColor: '#FACC15',
    visualType: 'kart',
  },
  {
    id: 2,
    title: 'CAPÍTULO 2 — A CHEGADA À ELITE',
    period: '1984–1987',
    text: 'Toleman, Lotus e uma capacidade extraordinária de transformar velocidade em desempenho. A classificação se tornou um dos grandes palcos de sua precisão.',
    position: { x: 115, z: -1255 },
    accentColor: '#EAB308',
    visualType: 'toleman_lotus',
  },
  {
    id: 3,
    title: 'CAPÍTULO 3 — O TRICAMPEONATO MUNDIAL',
    period: '1988, 1990 e 1991',
    text: 'Com a McLaren-Honda, Ayrton construiu uma das fases mais marcantes da história da Fórmula 1. Três campeonatos mundiais consolidaram sua posição entre os grandes.',
    position: { x: -135, z: -1405 },
    accentColor: '#EF4444',
    visualType: 'mclaren_arches',
  },
  {
    id: 4,
    title: 'CAPÍTULO 4 — O REI DA CHUVA E DE MÔNACO',
    period: 'MÔNACO & CHUVA',
    text: 'Seis vitórias em Mônaco. Uma relação extraordinária com o circuito mais exigente da Fórmula 1. Sob chuva, Senna transformava dificuldade em oportunidade.',
    position: { x: 125, z: -1555 },
    accentColor: '#1D4ED8',
    visualType: 'monaco_water',
  },
  {
    id: 5,
    title: 'CAPÍTULO 5 — INSTITUTO AYRTON SENNA',
    period: 'EDUCAÇÃO & FUTURO',
    text: 'O desejo de transformação não terminou nas corridas. O Instituto Ayrton Senna representa a continuidade de um sonho: ampliar oportunidades e transformar a vida de crianças e jovens por meio da educação.',
    position: { x: -85, z: -1715 },
    accentColor: '#FACC15',
    visualType: 'instituto_sun',
  },
  {
    id: 6,
    title: 'CAPÍTULO 6 — LEGADO ETERNO',
    period: 'ETERNO',
    text: 'Seja você quem for, qualquer posição que tenha na vida, tenha sempre como meta muita força, muita determinação.',
    position: { x: 0, z: -1895 },
    accentColor: '#16A34A',
    visualType: 'eternal_helmet',
  },
];

export const TIMELINE_CARS: readonly TimelineCarEntry[] = [
  {
    stageId: 1,
    year: 1984,
    eraTitle: 'Estreia e Mônaco 84',
    chassis: 'Toleman TG184',
    team: 'Toleman Group Motorsport',
    circuitLabel: 'MÔNACO 1984',
    summary:
      'Temporada de estreia na Fórmula 1. Sob dilúvio nas ruas de Monte Carlo, Senna escalou o pelotão com um carro modesto e anunciou ao mundo uma precisão fora de série.',
    livery: STAGES[0]!.car,
    specs: {
      aeroFront:
        'Asa dianteira biplano de alta carga aerodinâmica para máxima aderência em curvas lentas de rua e piso encharcado.',
      engineChassis:
        'Monocoque em fibra de carbono e Kevlar projetado por Rory Byrne. Motor Hart 415T 1.5L Turbo (~600 cv) e câmbio manual de 5 marchas.',
      rearTraction:
        'Asa traseira dupla com endplates altos e difusor Venturi trabalhando junto aos pneus slick/chuva para estabilizar a traseira arisca do turbo.',
      cockpitDriver:
        'Cockpit aberto estreito, alavanca de câmbio mecânica à direita e capacete amarelo com faixas verde e azul já consolidado como marca registrada.',
    },
    technical: {
      engineType: 'Hart 415T Turbo',
      displacement: '1.496 cc · 600 cv @ 10.500 RPM',
      engineArch: 'V6',
      valveCoverColor: '#3f3f46',
      gearbox: 'Hewland / Toleman Manual 5 marchas',
      brakes: 'Discos ventilados com pinças AP Racing',
      aero: 'Asas biplano alta carga · Assoalho plano',
      weight: '540 kg',
    },
  },
  {
    stageId: 2,
    year: 1985,
    eraTitle: 'Primeira Vitória — Estoril 85',
    chassis: 'Lotus 97T',
    team: 'John Player Special Team Lotus',
    circuitLabel: 'ESTORIL 1985',
    summary:
      'Na icônica pintura preta e dourada, Senna conquistou sua primeira pole position e sua primeira vitória na Fórmula 1 em Estoril, liderando de ponta a ponta sob tempestade.',
    livery: STAGES[1]!.car,
    specs: {
      aeroFront:
        'Bico afilado com placas terminais esculpidas e dutos de refrigeração integrados para equilibrar o carro em freadas de alta velocidade.',
      engineChassis:
        'Chassi Lotus 97T em colmeia de alumínio e carbono. Motor Renault EF4B 1.5L V6 Biturbo (~780 cv em corrida, >950 cv em classificação) com 540 kg.',
      rearTraction:
        'Sidepods recortados direcionando fluxo limpo para o conjunto traseiro e asa de alto arrasto otimizada para tração na saída de curva.',
      cockpitDriver:
        'Posição de pilotagem recuada, volante de três raios em camurça e resposta imediata de pedal para domar o lag do biturbo francês.',
    },
    technical: {
      engineType: 'Renault Gordini EF4B V6 Biturbo',
      displacement: '1.492 cc · 780–950 cv @ 11.500 RPM',
      engineArch: 'V6',
      valveCoverColor: '#eab308',
      gearbox: 'Lotus / Hewland Manual 5 marchas',
      brakes: 'Discos de carbono Brembo / AP',
      aero: 'Sidepods undercut + defletores de fluxo',
      weight: '540 kg',
    },
  },
  {
    stageId: 3,
    year: 1988,
    eraTitle: 'Primeiro Título — Suzuka 88',
    chassis: 'McLaren MP4/4',
    team: 'Honda Marlboro McLaren',
    circuitLabel: 'SUZUKA 1988',
    summary:
      'Um dos monopostos mais dominantes da história. Após uma queda de rotação na largada em Suzuka, Senna recuperou posição por posição para conquistar seu primeiro campeonato mundial.',
    livery: STAGES[2]!.car,
    specs: {
      aeroFront:
        'Frente extremamente baixa assinada por Steve Nichols e Gordon Murray, reduzindo drasticamente a área frontal e alimentando o assoalho plano.',
      engineChassis:
        'Chassi ultrabaixo em fibra de carbono. Motor Honda RA168E 1.5L V6 Biturbo (limitado a 2.5 bar, ~685 cv), câmbio transversal de 6 marchas e 540 kg.',
      rearTraction:
        'Fluxo traseiro limpo sobre a tampa do motor em perfil baixo, maximizando a eficiência do difusor Venturi e da asa traseira biplano.',
      cockpitDriver:
        'Piloto praticamente deitado no monocoque ultrabaixo; proteção frontal reduzida e viseira escura focada nos S de Suzuka.',
    },
    technical: {
      engineType: 'Honda RA168E V6 Biturbo (2.5 bar)',
      displacement: '1.494 cc · ~685 cv @ 12.500 RPM',
      engineArch: 'V6',
      valveCoverColor: '#dc2626',
      gearbox: 'McLaren / Weismann Transversal 6 marchas',
      brakes: 'Discos de carbono ventilados SEP/Brembo',
      aero: 'Monocoque ultrabaixo · Difusor Venturi',
      weight: '540 kg',
    },
  },
  {
    stageId: 4,
    year: 1990,
    eraTitle: 'Bicampeonato — Phoenix 90',
    chassis: 'McLaren MP4/5B',
    team: 'Honda Marlboro McLaren',
    circuitLabel: 'PHOENIX 1990',
    summary:
      'Na era dos motores aspirados, Senna defendeu sua posição em duelos intensos como contra Jean Alesi em Phoenix, encaminhando o bicampeonato mundial.',
    livery: STAGES[3]!.car,
    specs: {
      aeroFront:
        'Bico fino com asa dianteira elevada nas extremidades para canalizar vórtices energizados sob os sidepods laterais.',
      engineChassis:
        'Monocoque em carbono McLaren com motor Honda RA100E 3.5L V10 atmosférico (~690 cv a 13.000 RPM), câmbio manual de 6 marchas e 505 kg.',
      rearTraction:
        'Traseira compactada em formato coca-cola com difusor multicanais de alta eficiência para compensar curvas urbanas de baixa aderência.',
      cockpitDriver:
        'Tomada de ar superior elevada acima do santo-antônio alimentando o V10 aspirado logo atrás do capacete amarelo.',
    },
    technical: {
      engineType: 'Honda RA100E V10 72° Aspirado',
      displacement: '3.493 cc · ~690 cv @ 13.000 RPM',
      engineArch: 'V10',
      valveCoverColor: '#dc2626',
      gearbox: 'McLaren Transversal Manual 6 marchas',
      brakes: 'Carbono-carbono Hitco / Brembo 4 pistões',
      aero: 'Traseira coca-cola + asas de média/alta carga',
      weight: '505 kg',
    },
  },
  {
    stageId: 5,
    year: 1991,
    eraTitle: 'Tricampeonato — Interlagos 91',
    chassis: 'McLaren MP4/6',
    team: 'Honda Marlboro McLaren',
    circuitLabel: 'INTERLAGOS 1991',
    summary:
      'Com o novo V12 da Honda, Senna finalmente venceu em Interlagos após perder as marchas finais e terminar a prova pilotando apenas em 6ª marcha sob chuva leve.',
    livery: STAGES[4]!.car,
    specs: {
      aeroFront:
        'Asa dianteira de dois elementos com endplates curvados para minimizar turbulência das rodas dianteiras e preservar estabilidade direcional.',
      engineChassis:
        'Chassi MP4/6 em carbono estrutural com motor Honda RA121E 3.5L V12 atmosférico (~725 cv a 13.800 RPM), câmbio manual em H de 6 marchas e 505 kg.',
      rearTraction:
        'Conjunto traseiro reforçado para acomodar o longo bloco V12 e entregar tração progressiva na subida da Junção em Interlagos.',
      cockpitDriver:
        'Último carro campeão da F1 com câmbio manual em H — exigiu força física extrema de Senna ao travar na 6ª marcha no Brasil.',
    },
    technical: {
      engineType: 'Honda RA121E V12 60° Aspirado',
      displacement: '3.497 cc · ~725 cv @ 13.800 RPM',
      engineArch: 'V12',
      valveCoverColor: '#dc2626',
      gearbox: 'McLaren Manual em H 6 marchas',
      brakes: 'Carbono-carbono Carbone Industrie / Brembo',
      aero: 'Bico fino · Sidepods alongados para o V12',
      weight: '505 kg',
    },
  },
  {
    stageId: 6,
    year: 1992,
    eraTitle: 'Defesa Histórica — Mônaco 92',
    chassis: 'McLaren MP4/7A',
    team: 'Honda Marlboro McLaren',
    circuitLabel: 'MÔNACO 1992',
    summary:
      'Em um ano de domínio técnico rival, Senna segurou Nigel Mansell nas voltas finais de Mônaco com posicionamento defensivo cirúrgico para conquistar sua quinta vitória no Principado.',
    livery: STAGES[5]!.car,
    specs: {
      aeroFront:
        'Asa dianteira de carga máxima específica para Monte Carlo, garantindo precisão milimétrica a centímetros dos guard-rails.',
      engineChassis:
        'Primeiro McLaren com câmbio semiautomático por borboletas e acelerador eletrônico. Motor Honda RA122E/B 3.5L V12 (~750 cv) e 505 kg.',
      rearTraction:
        'Pacote traseiro de máximo downforce e estabilidade em frenagem para fechar a porta na saída do túnel e na chicane do porto.',
      cockpitDriver:
        'Volante equipado com comandos eletrônicos e borboletas de troca rápida, mantendo as duas mãos no volante entre os muros de Mônaco.',
    },
    technical: {
      engineType: 'Honda RA122E/B V12 75° Aspirado',
      displacement: '3.498 cc · ~750 cv @ 14.000 RPM',
      engineArch: 'V12',
      valveCoverColor: '#dc2626',
      gearbox: 'McLaren Semiautomático 6 marchas (borboletas)',
      brakes: 'Carbono-carbono Brembo de alta resposta',
      aero: 'Pacote Monte Carlo · Máximo downforce',
      weight: '505 kg',
    },
  },
  {
    stageId: 7,
    year: 1993,
    eraTitle: 'A Volta dos Deuses — Donington 93',
    chassis: 'McLaren MP4/8',
    team: 'Marlboro McLaren',
    circuitLabel: 'DONINGTON 1993',
    summary:
      'Mesmo em desvantagem de potência, Senna assinou uma das maiores primeiras voltas da história em Donington Park, superando quatro adversários sob chuva em menos de uma volta.',
    livery: STAGES[6]!.car,
    specs: {
      aeroFront:
        'Bico alto com suportes verticais e flaps adicionais que ampliavam o fluxo limpo sob o assoalho em conjunto com a suspensão ativa.',
      engineChassis:
        'Chassi ágil com suspensão ativa eletrônica e controle de tração. Motor Ford Cosworth HBD7 3.5L V8 (~680 cv), câmbio semiautomático de 6 marchas e 505 kg.',
      rearTraction:
        'Asa traseira compacta e difusor refinado trabalhando com a altura dinâmica controlada eletronicamente no asfalto encharcado.',
      cockpitDriver:
        'Cockpit equipado com telemetria avançada e leitura de pista impecável sob spray intenso, permitindo linhas externas impossíveis.',
    },
    technical: {
      engineType: 'Ford Cosworth HBD7 V8 75°',
      displacement: '3.494 cc · ~680 cv @ 13.000 RPM',
      engineArch: 'V8',
      valveCoverColor: '#1e3a8a',
      gearbox: 'McLaren Semiautomático 6 marchas',
      brakes: 'Carbono-carbono + controle eletrônico',
      aero: 'Bico elevado · Suspensão ativa eletrônica',
      weight: '505 kg',
    },
  },
];
