import type {
  CarLivery,
  ChapterMonument,
  GameSettings,
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
  teamName: 'Williams Renault',
  chassisName: 'FW14B',
  primary: '#1D4ED8',
  secondary: '#EAB308',
  accent: '#F8FAFC',
  stripe: '#FFFFFF',
  numberText: '5',
};

const FERRARI_LIVERY: CarLivery = {
  id: 'ferrari-156-85',
  teamName: 'Scuderia Ferrari',
  chassisName: '156/85',
  primary: '#DC2626',
  secondary: '#09090B',
  accent: '#FACC15',
  stripe: '#FFFFFF',
  numberText: '27',
};

const TYRRELL_LIVERY: CarLivery = {
  id: 'tyrrell-019',
  teamName: 'Tyrrell Racing',
  chassisName: '019',
  primary: '#1E3A8A',
  secondary: '#F8FAFC',
  accent: '#38BDF8',
  stripe: '#09090B',
  numberText: '4',
};

const BENETTON_LIVERY: CarLivery = {
  id: 'benetton-b193',
  teamName: 'Benetton Ford',
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

export const STAGES: readonly StageConfig[] = [
  {
    id: 1,
    slug: 'monaco-1984',
    portalSide: 'left',
    portalZ: -90,
    circuit: 'MÔNACO',
    year: 1984,
    raceDistance: 1250,
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
      fogNear: 25,
      fogFar: 220,
      sunColor: '#94a3b8',
      sunIntensity: 1.1,
      ambientIntensity: 0.75,
      rain: 1.0,
      wetAsphalt: true,
    },
    opponents: [
      {
        id: 'prost-84',
        name: 'ALAIN PROST',
        team: 'McLaren',
        livery: PROST_MCLAREN_LIVERY,
        initialOffsetZ: -55,
        laneX: 2.2,
        baseSpeedKmh: 215,
        aggression: 0.45,
      },
    ],
    targetOvertakes: 1,
  },
  {
    id: 2,
    slug: 'estoril-1985',
    portalSide: 'right',
    portalZ: -210,
    circuit: 'ESTORIL',
    year: 1985,
    raceDistance: 1350,
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
      fogNear: 28,
      fogFar: 240,
      sunColor: '#64748b',
      sunIntensity: 0.95,
      ambientIntensity: 0.65,
      rain: 0.9,
      wetAsphalt: true,
    },
    opponents: [
      {
        id: 'alboreto-85',
        name: 'MICHELE ALBORETO',
        team: 'Ferrari',
        livery: FERRARI_LIVERY,
        initialOffsetZ: -65,
        laneX: -2.0,
        baseSpeedKmh: 238,
        aggression: 0.55,
      },
    ],
    targetOvertakes: 1,
  },
  {
    id: 3,
    slug: 'suzuka-1988',
    portalSide: 'left',
    portalZ: -330,
    circuit: 'SUZUKA',
    year: 1988,
    raceDistance: 1450,
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
    opponents: [
      {
        id: 'pack-88-a',
        name: 'GERHARD BERGER',
        team: 'Ferrari',
        livery: FERRARI_LIVERY,
        initialOffsetZ: -40,
        laneX: -3.0,
        baseSpeedKmh: 226,
        aggression: 0.35,
      },
      {
        id: 'pack-88-b',
        name: 'NELSON PIQUET',
        team: 'Lotus',
        livery: {
          id: 'lotus-camel',
          teamName: 'Lotus',
          chassisName: '100T',
          primary: '#EAB308',
          secondary: '#1D4ED8',
          accent: '#F8FAFC',
          stripe: '#09090B',
          numberText: '1',
        },
        initialOffsetZ: -75,
        laneX: 2.8,
        baseSpeedKmh: 238,
        aggression: 0.45,
      },
      {
        id: 'prost-88',
        name: 'ALAIN PROST',
        team: 'McLaren',
        livery: PROST_MCLAREN_LIVERY,
        initialOffsetZ: -115,
        laneX: 0.6,
        baseSpeedKmh: 248,
        aggression: 0.7,
      },
    ],
    targetOvertakes: 3,
  },
  {
    id: 4,
    slug: 'phoenix-1990',
    portalSide: 'right',
    portalZ: -450,
    circuit: 'PHOENIX',
    year: 1990,
    raceDistance: 1350,
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
    opponents: [
      {
        id: 'alesi-90',
        name: 'JEAN ALESI',
        team: 'Tyrrell',
        livery: TYRRELL_LIVERY,
        initialOffsetZ: -45,
        laneX: -1.8,
        baseSpeedKmh: 254,
        aggression: 0.92,
      },
    ],
    targetOvertakes: 1,
  },
  {
    id: 5,
    slug: 'interlagos-1991',
    portalSide: 'left',
    portalZ: -570,
    circuit: 'INTERLAGOS',
    year: 1991,
    raceDistance: 1450,
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
    opponents: [
      {
        id: 'patrese-91',
        name: 'RICCARDO PATRESE',
        team: 'Williams',
        livery: WILLIAMS_LIVERY,
        initialOffsetZ: -55,
        laneX: 2.0,
        baseSpeedKmh: 238,
        aggression: 0.65,
      },
    ],
    targetOvertakes: 1,
  },
  {
    id: 6,
    slug: 'monaco-1992',
    portalSide: 'right',
    portalZ: -690,
    circuit: 'MÔNACO',
    year: 1992,
    raceDistance: 1350,
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
    opponents: [
      {
        id: 'mansell-92',
        name: 'NIGEL MANSELL',
        team: 'Williams',
        livery: WILLIAMS_LIVERY,
        initialOffsetZ: 15,
        laneX: 2.2,
        baseSpeedKmh: 278,
        aggression: 0.96,
      },
    ],
    targetOvertakes: 0,
  },
  {
    id: 7,
    slug: 'donington-1993',
    portalSide: 'left',
    portalZ: -810,
    circuit: 'DONINGTON PARK',
    year: 1993,
    raceDistance: 1600,
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
      fogFar: 245,
      sunColor: '#94a3b8',
      sunIntensity: 1.0,
      ambientIntensity: 0.72,
      rain: 0.85,
      wetAsphalt: true,
      lightning: true,
    },
    opponents: [
      {
        id: 'wendlinger-93',
        name: 'KARL WENDLINGER',
        team: 'Sauber',
        livery: SAUBER_LIVERY,
        initialOffsetZ: -40,
        laneX: -2.8,
        baseSpeedKmh: 214,
        aggression: 0.35,
      },
      {
        id: 'schumacher-93',
        name: 'MICHAEL SCHUMACHER',
        team: 'Benetton',
        livery: BENETTON_LIVERY,
        initialOffsetZ: -90,
        laneX: 2.6,
        baseSpeedKmh: 224,
        aggression: 0.6,
      },
      {
        id: 'hill-93',
        name: 'DAMON HILL',
        team: 'Williams',
        livery: { ...WILLIAMS_LIVERY, numberText: '0' },
        initialOffsetZ: -140,
        laneX: -2.2,
        baseSpeedKmh: 234,
        aggression: 0.65,
      },
      {
        id: 'prost-93',
        name: 'ALAIN PROST',
        team: 'Williams',
        livery: { ...WILLIAMS_LIVERY, numberText: '2' },
        initialOffsetZ: -190,
        laneX: 1.6,
        baseSpeedKmh: 242,
        aggression: 0.75,
      },
    ],
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
        'Monocoque em fibra de carbono e Kevlar projetado por Rory Byrne. Motor Hart 415T 1.5L 4 cilindros Turbo (~600 cv) e câmbio manual de 5 marchas.',
      rearTraction:
        'Asa traseira dupla com endplates altos e difusor Venturi trabalhando junto aos pneus slick/chuva para estabilizar a traseira arisca do turbo.',
      cockpitDriver:
        'Cockpit aberto estreito, alavanca de câmbio mecânica à direita e capacete amarelo com faixas verde e azul já consolidado como marca registrada.',
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
  },
];
