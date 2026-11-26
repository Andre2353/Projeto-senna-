import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  OPEN_WORLD_CHAPTERS,
  STAGES,
  STORAGE_KEY,
  STORAGE_VERSION,
} from '../data/sennaData';
import type {
  GameMode,
  GameSettings,
  PersistedProgress,
  RaceResultState,
  ShowroomAngleZone,
  TransitionBanner,
} from '../types/game';
import {
  gameRuntime,
  initializeStageRuntime,
  resetForCorridor,
  resetForOpenWorld,
} from '../utils/runtime';

function loadPersistedState(): PersistedProgress {
  if (typeof window === 'undefined') {
    return {
      version: STORAGE_VERSION,
      completedStages: [],
      unlockedChapters: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: STORAGE_VERSION,
        completedStages: [],
        unlockedChapters: [],
        settings: { ...DEFAULT_SETTINGS },
      };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedProgress>;
    if (parsed.version !== STORAGE_VERSION) {
      return {
        version: STORAGE_VERSION,
        completedStages: [],
        unlockedChapters: [],
        settings: { ...DEFAULT_SETTINGS },
      };
    }

    const validStageIds = new Set(STAGES.map((stage) => stage.id));
    const validChapterIds = new Set(OPEN_WORLD_CHAPTERS.map((ch) => ch.id));

    return {
      version: STORAGE_VERSION,
      completedStages: Array.isArray(parsed.completedStages)
        ? parsed.completedStages.filter((id): id is number => typeof id === 'number' && validStageIds.has(id))
        : [],
      unlockedChapters: Array.isArray(parsed.unlockedChapters)
        ? parsed.unlockedChapters.filter((id): id is number => typeof id === 'number' && validChapterIds.has(id))
        : [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return {
      version: STORAGE_VERSION,
      completedStages: [],
      unlockedChapters: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

function savePersistedState(state: {
  completedStages: number[];
  unlockedChapters: number[];
  settings: GameSettings;
}): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload: PersistedProgress = {
      version: STORAGE_VERSION,
      completedStages: state.completedStages,
      unlockedChapters: state.unlockedChapters,
      settings: state.settings,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private-mode errors safely.
  }
}

interface GameStoreState {
  isLoaded: boolean;
  loadProgress: number;
  webglSupported: boolean;
  mode: GameMode;
  activeStageId: number | null;
  completedStages: number[];
  unlockedChapters: number[];
  activeChapterId: number | null;
  isPaused: boolean;
  showSettings: boolean;
  transitionBanner: TransitionBanner | null;
  tacticalAlert: string | null;
  raceResult: RaceResultState | null;
  settings: GameSettings;
  selectedTimelineIndex: number;
  showroomZone: ShowroomAngleZone;

  setLoadProgress: (progress: number) => void;
  markLoaded: () => void;
  setWebglSupported: (supported: boolean) => void;
  setSelectedTimelineIndex: (index: number) => void;
  setShowroomZone: (zone: ShowroomAngleZone) => void;
  returnToTimeline: () => void;
  startExperience: () => void;
  enterStage: (stageId: number) => void;
  restartCurrentStage: () => void;
  finishRace: (result: RaceResultState) => void;
  returnToCorridor: (afterStageId?: number | null) => void;
  enterOpenWorld: () => void;
  unlockChapter: (chapterId: number) => void;
  openChapterCard: (chapterId: number) => void;
  closeChapterCard: () => void;
  openCredits: () => void;
  closeCredits: () => void;
  togglePause: (force?: boolean) => void;
  setShowSettings: (show: boolean) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  setTransitionBanner: (banner: TransitionBanner | null) => void;
  setTacticalAlert: (alert: string | null) => void;
  resetAllProgress: () => void;
}

const initialPersisted = loadPersistedState();

export const useGameStore = create<GameStoreState>((set, get) => ({
  isLoaded: false,
  loadProgress: 12,
  webglSupported: true,
  mode: 'landing',
  activeStageId: null,
  completedStages: initialPersisted.completedStages,
  unlockedChapters: initialPersisted.unlockedChapters,
  activeChapterId: null,
  isPaused: false,
  showSettings: false,
  transitionBanner: null,
  tacticalAlert: null,
  raceResult: null,
  settings: initialPersisted.settings,
  selectedTimelineIndex: 0,
  showroomZone: 'front',

  setLoadProgress: (progress) => set({ loadProgress: Math.min(100, Math.max(0, progress)) }),

  markLoaded: () => set({ isLoaded: true, loadProgress: 100 }),

  setWebglSupported: (supported) => set({ webglSupported: supported }),

  setSelectedTimelineIndex: (index) => set({ selectedTimelineIndex: index }),

  setShowroomZone: (zone) => set({ showroomZone: zone }),

  returnToTimeline: () => {
    resetForCorridor(0, false);
    set({
      mode: 'landing',
      activeStageId: null,
      isPaused: false,
      showSettings: false,
      raceResult: null,
      tacticalAlert: null,
      transitionBanner: null,
      activeChapterId: null,
    });
  },

  startExperience: () => {
    resetForCorridor(0, false);
    gameRuntime.speed = 68;
    gameRuntime.gear = 2;
    gameRuntime.rpm = 7400;
    gameRuntime.cameraIntroProgress = 0;
    set({
      mode: 'corridor',
      activeStageId: null,
      isPaused: false,
      showSettings: false,
      raceResult: null,
      tacticalAlert: null,
      transitionBanner: {
        title: 'CORREDOR DOS PORTAIS',
        subtitle: 'ESTERCE PARA OS PORTAIS OU ACELERE RETO PARA A HISTÓRIA',
        accentColor: '#FACC15',
      },
    });
  },

  enterStage: (stageId) => {
    const stage = STAGES.find((item) => item.id === stageId);
    if (!stage) {
      return;
    }
    initializeStageRuntime(stage);
    set({
      mode: 'race',
      activeStageId: stage.id,
      isPaused: false,
      showSettings: false,
      raceResult: null,
      tacticalAlert: null,
      activeChapterId: null,
      transitionBanner: {
        title: `${stage.circuit} ${stage.year}`,
        subtitle: `${stage.car.teamName.toUpperCase()} · ${stage.car.chassisName}`,
        accentColor: stage.car.secondary,
      },
    });
  },

  restartCurrentStage: () => {
    const stageId = get().activeStageId;
    if (stageId === null) {
      return;
    }
    get().enterStage(stageId);
  },

  finishRace: (result) => {
    const state = get();
    let updatedCompleted = state.completedStages;

    if (result.status === 'victory' && !state.completedStages.includes(result.stageId)) {
      updatedCompleted = [...state.completedStages, result.stageId].sort((a, b) => a - b);
      savePersistedState({
        completedStages: updatedCompleted,
        unlockedChapters: state.unlockedChapters,
        settings: state.settings,
      });
    }

    set({
      completedStages: updatedCompleted,
      raceResult: result,
      tacticalAlert: result.status === 'victory' ? 'BANDEIRADA' : 'P2 — FINAL',
    });
  },

  returnToCorridor: (afterStageId) => {
    const refStageId = afterStageId ?? get().activeStageId;
    const stage = STAGES.find((item) => item.id === refStageId);
    const resumeZ = stage ? stage.portalZ - 26 : 0;
    resetForCorridor(resumeZ, false);
    gameRuntime.speed = 92;
    gameRuntime.gear = 2;
    gameRuntime.rpm = 7900;
    set({
      mode: 'corridor',
      activeStageId: null,
      isPaused: false,
      showSettings: false,
      raceResult: null,
      tacticalAlert: null,
      transitionBanner: {
        title: 'CORREDOR PRINCIPAL',
        subtitle: 'SIGA PARA OS PRÓXIMOS PORTAIS OU ACELERE ATÉ O HORIZONTE',
        accentColor: '#16A34A',
      },
    });
  },

  enterOpenWorld: () => {
    resetForOpenWorld(-965);
    set({
      mode: 'open_world',
      activeStageId: null,
      isPaused: false,
      showSettings: false,
      raceResult: null,
      tacticalAlert: null,
      transitionBanner: {
        title: 'MUNDO ABERTO — A TRAJETÓRIA',
        subtitle: 'ATRAVESSE OS 6 MONUMENTOS EM SEQUÊNCIA PARA DESBLOQUEAR O LEGADO',
        accentColor: '#FACC15',
      },
    });
  },

  unlockChapter: (chapterId) => {
    const state = get();
    const alreadyUnlocked = state.unlockedChapters.includes(chapterId);
    const nextChapters = alreadyUnlocked
      ? state.unlockedChapters
      : [...state.unlockedChapters, chapterId].sort((a, b) => a - b);

    if (!alreadyUnlocked) {
      savePersistedState({
        completedStages: state.completedStages,
        unlockedChapters: nextChapters,
        settings: state.settings,
      });
    }

    set({
      unlockedChapters: nextChapters,
      activeChapterId: chapterId,
    });
  },

  openChapterCard: (chapterId) => {
    const state = get();
    if (state.unlockedChapters.includes(chapterId)) {
      set({ activeChapterId: chapterId });
    }
  },

  closeChapterCard: () => set({ activeChapterId: null }),

  openCredits: () => set({ mode: 'credits', activeChapterId: null, isPaused: false }),

  closeCredits: () => set({ mode: 'open_world' }),

  togglePause: (force) => {
    const state = get();
    if (state.mode === 'landing' || state.mode === 'credits') {
      return;
    }
    const nextPaused = typeof force === 'boolean' ? force : !state.isPaused;
    set({
      isPaused: nextPaused,
      showSettings: nextPaused ? state.showSettings : false,
    });
  },

  setShowSettings: (show) => set({ showSettings: show }),

  updateSettings: (partial) => {
    const state = get();
    const nextSettings = { ...state.settings, ...partial };
    savePersistedState({
      completedStages: state.completedStages,
      unlockedChapters: state.unlockedChapters,
      settings: nextSettings,
    });
    set({ settings: nextSettings });
  },

  setTransitionBanner: (banner) => set({ transitionBanner: banner }),

  setTacticalAlert: (alert) => set({ tacticalAlert: alert }),

  resetAllProgress: () => {
    const currentSettings = get().settings;
    savePersistedState({
      completedStages: [],
      unlockedChapters: [],
      settings: currentSettings,
    });
    resetForCorridor(0, false);
    set({
      mode: 'landing',
      activeStageId: null,
      completedStages: [],
      unlockedChapters: [],
      activeChapterId: null,
      isPaused: false,
      showSettings: false,
      raceResult: null,
      tacticalAlert: null,
      transitionBanner: null,
    });
  },
}));
