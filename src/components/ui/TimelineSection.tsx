import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flag, Layers, Minimize2, RotateCw } from 'lucide-react';
import { TIMELINE_CARS } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { ExplodedPart, ShowroomAngleZone } from '../../types/game';
import { gameRuntime } from '../../utils/runtime';

const ZONE_META: Record<
  ShowroomAngleZone,
  { angleLabel: string; title: string; specKey: 'aeroFront' | 'engineChassis' | 'rearTraction' | 'cockpitDriver' }
> = {
  front: {
    angleLabel: 'ÂNGULO FRONTAL · 315°–45°',
    title: 'AERODINÂMICA & ASA DIANTEIRA',
    specKey: 'aeroFront',
  },
  right: {
    angleLabel: 'ÂNGULO LATERAL · 45°–135°',
    title: 'CHASSI, MOTOR & ESPECIFICAÇÕES',
    specKey: 'engineChassis',
  },
  rear: {
    angleLabel: 'ÂNGULO TRASEIRO · 135°–225°',
    title: 'TRAÇÃO, DIFUSOR & ASA TRASEIRA',
    specKey: 'rearTraction',
  },
  left: {
    angleLabel: 'ÂNGULO COCKPIT · 225°–315°',
    title: 'COCKPIT, PILOTO & CAPACETE',
    specKey: 'cockpitDriver',
  },
};

const PART_BUTTONS: Array<{ id: ExplodedPart; label: string }> = [
  { id: 'engine', label: 'MOTOR & CÂMBIO' },
  { id: 'wheels', label: 'PNEUS & FREIOS' },
  { id: 'aero', label: 'SIDEPODS & AERO' },
  { id: 'cockpit', label: 'COCKPIT' },
];

function unlockAudioContext(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioCtx) {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    gameRuntime.audioReady = true;
    void ctx.close();
  }
}

export function TimelineSection() {
  const mode = useGameStore((state) => state.mode);
  const selectedIndex = useGameStore((state) => state.selectedTimelineIndex);
  const showroomZone = useGameStore((state) => state.showroomZone);
  const explodedParts = useGameStore((state) => state.explodedParts);
  const activeInspectedPart = useGameStore((state) => state.activeInspectedPart);
  const setSelectedTimelineIndex = useGameStore((state) => state.setSelectedTimelineIndex);
  const toggleExplodedPart = useGameStore((state) => state.toggleExplodedPart);
  const openAllExploded = useGameStore((state) => state.openAllExploded);
  const closeAllExploded = useGameStore((state) => state.closeAllExploded);
  const enterStage = useGameStore((state) => state.enterStage);

  const selectedCar = TIMELINE_CARS[selectedIndex] ?? TIMELINE_CARS[0]!;
  const zoneInfo = ZONE_META[showroomZone];
  const anyExploded = Object.values(explodedParts).some(Boolean);

  useEffect(() => {
    if (mode !== 'landing') {
      return;
    }

    const handleKeyNav = (event: KeyboardEvent) => {
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        setSelectedTimelineIndex(Math.min(TIMELINE_CARS.length - 1, selectedIndex + 1));
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        setSelectedTimelineIndex(Math.max(0, selectedIndex - 1));
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => {
      window.removeEventListener('keydown', handleKeyNav);
    };
  }, [mode, selectedIndex, setSelectedTimelineIndex]);

  const handleRaceDirect = () => {
    unlockAudioContext();
    enterStage(selectedCar.stageId);
  };

  return (
    <>
      {/* LEFT EDITORIAL CARD: Season Historical Summary + Direct Race Shortcut */}
      <aside className="pointer-events-auto fixed top-28 left-6 z-20 w-full max-w-sm border border-white/15 bg-zinc-950/82 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-telemetry text-xs font-bold tracking-[0.22em] text-yellow-400">
            {selectedCar.year} // {selectedCar.chassis.toUpperCase()}
          </span>
          <span className="font-telemetry text-[10px] tracking-widest text-zinc-400">
            {selectedIndex + 1}/7
          </span>
        </div>

        <h2 className="mt-3 text-xl font-black tracking-tight text-slate-50">
          {selectedCar.eraTitle}
        </h2>
        <p className="mt-0.5 font-telemetry text-[11px] tracking-wider text-zinc-400">
          {selectedCar.team.toUpperCase()}
        </p>

        <p className="mt-3.5 text-sm leading-relaxed text-zinc-200">{selectedCar.summary}</p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleRaceDirect}
            className="inline-flex cursor-pointer items-center gap-2 border border-white/25 bg-zinc-900/90 px-4 py-2 font-telemetry text-[11px] font-semibold tracking-[0.16em] text-slate-50 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            <Flag className="h-3.5 w-3.5 text-yellow-400" />
            <span>CORRER NESTA PISTA ({selectedCar.circuitLabel})</span>
          </button>
        </div>
      </aside>

      {/* RIGHT TECHNICAL PANEL: Full Engineering Sheet when Exploded OR Dynamic 360° Angle Card */}
      <aside className="pointer-events-auto fixed top-28 right-6 z-20 w-full max-w-xs border border-white/15 bg-zinc-950/82 p-5 backdrop-blur-md">
        {activeInspectedPart !== null ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-telemetry text-[10px] font-semibold tracking-[0.2em] text-yellow-400">
                FICHA TÉCNICA // {selectedCar.chassis.toUpperCase()}
              </span>
              <span className="border border-green-600/70 bg-green-600/20 px-1.5 py-0.5 font-telemetry text-[9px] text-green-400">
                ABERTO
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2.5 font-telemetry text-[11px]">
              <div
                className={`border p-2 ${
                  activeInspectedPart === 'engine'
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-white/10 bg-zinc-900/50'
                }`}
              >
                <p className="text-[9px] tracking-widest text-zinc-400">
                  MOTOR ({selectedCar.technical.engineArch})
                </p>
                <p className="mt-0.5 font-semibold text-slate-50">
                  {selectedCar.technical.engineType}
                </p>
                <p className="text-[10px] text-zinc-300">{selectedCar.technical.displacement}</p>
              </div>

              <div className="border border-white/10 bg-zinc-900/50 p-2">
                <p className="text-[9px] tracking-widest text-zinc-400">CÂMBIO & PESO</p>
                <p className="mt-0.5 text-slate-50">{selectedCar.technical.gearbox}</p>
                <p className="text-[10px] text-zinc-400">Peso mínimo: {selectedCar.technical.weight}</p>
              </div>

              <div
                className={`border p-2 ${
                  activeInspectedPart === 'wheels'
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-white/10 bg-zinc-900/50'
                }`}
              >
                <p className="text-[9px] tracking-widest text-zinc-400">FREIOS & SUSPENSÃO</p>
                <p className="mt-0.5 text-slate-50">{selectedCar.technical.brakes}</p>
              </div>

              <div
                className={`border p-2 ${
                  activeInspectedPart === 'aero' || activeInspectedPart === 'cockpit'
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-white/10 bg-zinc-900/50'
                }`}
              >
                <p className="text-[9px] tracking-widest text-zinc-400">AERODINÂMICA</p>
                <p className="mt-0.5 text-slate-50">{selectedCar.technical.aero}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-telemetry text-[10px] font-semibold tracking-[0.2em] text-yellow-400">
                {zoneInfo.angleLabel}
              </span>
              <RotateCw className="h-3.5 w-3.5 text-zinc-400" />
            </div>

            <h3 className="mt-3 font-telemetry text-xs font-bold tracking-[0.16em] text-slate-50">
              {zoneInfo.title}
            </h3>

            <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">
              {selectedCar.specs[zoneInfo.specKey]}
            </p>
          </>
        )}

        <div className="mt-4 flex items-center gap-1.5 border-t border-white/10 pt-3 font-telemetry text-[10px] tracking-wider text-zinc-400">
          <span>CLIQUE NAS PEÇAS DO CARRO OU ARRASTE 360°</span>
        </div>
      </aside>

      {/* EXPLODED VIEW CONTROLS BAR (ABOVE TIMELINE) */}
      <div className="pointer-events-auto fixed bottom-22 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 border border-white/15 bg-zinc-950/85 px-3 py-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={openAllExploded}
          className="inline-flex cursor-pointer items-center gap-1.5 border border-yellow-400 bg-yellow-400 px-3 py-1.5 font-telemetry text-[10px] font-bold tracking-[0.16em] text-zinc-950 transition hover:bg-yellow-300"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>VISÃO TÉCNICA COMPLETA</span>
        </button>

        {anyExploded && (
          <button
            type="button"
            onClick={closeAllExploded}
            className="inline-flex cursor-pointer items-center gap-1.5 border border-white/25 bg-zinc-900 px-3 py-1.5 font-telemetry text-[10px] font-semibold tracking-[0.14em] text-slate-50 transition hover:border-red-500 hover:text-red-400"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>FECHAR CARENAGEM</span>
          </button>
        )}

        <div className="hidden items-center gap-1 border-l border-white/15 pl-2 xl:flex">
          {PART_BUTTONS.map((btn) => {
            const isOpen = explodedParts[btn.id];
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => toggleExplodedPart(btn.id)}
                className={`cursor-pointer border px-2.5 py-1.5 font-telemetry text-[10px] tracking-wider transition ${
                  isOpen
                    ? 'border-green-600 bg-green-600/20 text-green-400'
                    : 'border-white/15 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM INTERACTIVE TIMELINE NAVIGATION BAR */}
      <nav
        aria-label="Timeline Ayrton Senna"
        className="pointer-events-auto fixed right-6 bottom-5 left-6 z-20 flex items-center justify-between gap-3 border border-white/15 bg-zinc-950/85 px-4 py-2.5 backdrop-blur-md"
      >
        <button
          type="button"
          onClick={() => setSelectedTimelineIndex(Math.max(0, selectedIndex - 1))}
          disabled={selectedIndex === 0}
          aria-label="Ano anterior"
          className="cursor-pointer border border-white/15 p-2 text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center justify-between gap-2 overflow-x-auto">
          {TIMELINE_CARS.map((car, idx) => {
            const isActive = idx === selectedIndex;
            return (
              <button
                key={car.year}
                type="button"
                onClick={() => setSelectedTimelineIndex(idx)}
                className={`flex flex-1 cursor-pointer flex-col items-start border px-3 py-1.5 text-left transition ${
                  isActive
                    ? 'border-yellow-400 bg-yellow-400/15'
                    : 'border-white/10 bg-zinc-900/50 hover:border-white/30'
                }`}
              >
                <span
                  className={`font-telemetry text-xs font-bold tracking-wider ${
                    isActive ? 'text-yellow-400' : 'text-slate-50'
                  }`}
                >
                  {car.year}
                </span>
                <span className="truncate font-telemetry text-[10px] tracking-wide text-zinc-400">
                  {car.chassis}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedTimelineIndex(Math.min(TIMELINE_CARS.length - 1, selectedIndex + 1))
          }
          disabled={selectedIndex === TIMELINE_CARS.length - 1}
          aria-label="Próximo ano"
          className="cursor-pointer border border-white/15 p-2 text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </>
  );
}
