import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Film,
  Flag,
  Maximize2,
  Minimize2,
  RotateCw,
  X,
} from 'lucide-react';
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
  { id: 'aero', label: 'AERO & BICO' },
  { id: 'wheels', label: 'PNEUS & FREIOS' },
  { id: 'cockpit', label: 'COCKPIT' },
  { id: 'engine', label: 'MOTOR & CÂMBIO' },
];

const PART_TELEMETRY_VIDEOS: Partial<
  Record<ExplodedPart, { src: string; caption: string }>
> = {
  aero: {
    src: '/videos/f1-aero-test.mp4',
    caption: 'TÚNEL DE VENTO // FLUXO AERODINÂMICO',
  },
  wheels: {
    src: '/videos/f1-wheel-exploded.mp4',
    caption: 'CONJUNTO EXPANDIDO // RODA, DISCO & PINÇA',
  },
  engine: {
    src: '/videos/f1-engine-cover.mp4',
    caption: 'COFRE DO MOTOR // ABERTURA DA CARENAGEM',
  },
};

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
  const activeInspectedPart = useGameStore((state) => state.activeInspectedPart);
  const setSelectedTimelineIndex = useGameStore((state) => state.setSelectedTimelineIndex);
  const toggleInspectedPart = useGameStore((state) => state.toggleInspectedPart);
  const clearInspection = useGameStore((state) => state.clearInspection);
  const enterStage = useGameStore((state) => state.enterStage);

  const [expandedVideo, setExpandedVideo] = useState(false);

  const selectedCar = TIMELINE_CARS[selectedIndex] ?? TIMELINE_CARS[0]!;
  const zoneInfo = ZONE_META[showroomZone];
  const activeVideo =
    activeInspectedPart !== null ? PART_TELEMETRY_VIDEOS[activeInspectedPart] ?? null : null;

  useEffect(() => {
    setExpandedVideo(false);
  }, [activeInspectedPart]);

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

      {/* RIGHT TECHNICAL PANEL: Full Engineering Sheet + Telemetry Video OR Dynamic 360° Angle Card */}
      <aside
        className={`pointer-events-auto fixed top-28 right-6 z-20 max-h-[calc(100dvh-16rem)] w-full overflow-y-auto border border-white/15 bg-zinc-950/85 p-5 backdrop-blur-md transition-[max-width] duration-200 ${
          activeVideo ? 'max-w-sm' : 'max-w-xs'
        }`}
      >
        {activeInspectedPart !== null ? (
          <>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-telemetry text-[10px] font-semibold tracking-[0.2em] text-yellow-400">
                FICHA TÉCNICA // {selectedCar.chassis.toUpperCase()}
              </span>
              <span className="border border-yellow-400/60 bg-yellow-400/15 px-1.5 py-0.5 font-telemetry text-[9px] text-yellow-300">
                TELEMETRIA
              </span>
            </div>

            {activeVideo && (
              <div className="mt-3 overflow-hidden border border-white/15 bg-zinc-900">
                <div className="flex items-center justify-between border-b border-white/10 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-1.5 font-telemetry text-[9px] tracking-[0.16em] text-yellow-400">
                    <Film className="h-3 w-3" />
                    <span>{activeVideo.caption}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedVideo(true)}
                    title="Ampliar vídeo técnico"
                    className="cursor-pointer p-0.5 text-zinc-400 transition hover:text-yellow-400"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <video
                  key={activeVideo.src}
                  src={activeVideo.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black object-cover"
                />
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 font-telemetry text-[11px]">
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
          <span>CLIQUE NOS PONTOS DE TELEMETRIA OU ARRASTE 360°</span>
        </div>
      </aside>

      {/* CAMERA INSPECTION HOTSPOT BAR (ABOVE TIMELINE) */}
      <div className="pointer-events-auto fixed bottom-22 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 border border-white/15 bg-zinc-950/85 px-3 py-1.5 backdrop-blur-md">
        <span className="mr-1 hidden items-center gap-1 font-telemetry text-[9px] tracking-widest text-zinc-400 sm:inline-flex">
          <Crosshair className="h-3 w-3 text-yellow-400" />
          <span>TELEMETRIA</span>
        </span>

        {PART_BUTTONS.map((btn) => {
          const isOpen = activeInspectedPart === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => toggleInspectedPart(btn.id)}
              className={`cursor-pointer border px-2.5 py-1.5 font-telemetry text-[10px] tracking-wider transition ${
                isOpen
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                  : 'border-white/15 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400'
              }`}
            >
              {btn.label}
            </button>
          );
        })}

        {activeInspectedPart !== null && (
          <button
            type="button"
            onClick={clearInspection}
            className="inline-flex cursor-pointer items-center gap-1 border border-white/25 bg-zinc-900 px-2.5 py-1.5 font-telemetry text-[10px] font-semibold tracking-[0.14em] text-slate-50 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            <Minimize2 className="h-3 w-3" />
            <span>VISÃO GERAL</span>
          </button>
        )}
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

      {/* EXPANDED TELEMETRY VIDEO MODAL */}
      {expandedVideo && activeVideo && (
        <div
          className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 p-6 backdrop-blur-md"
          onClick={() => setExpandedVideo(false)}
        >
          <div
            className="w-full max-w-3xl border border-white/20 bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="font-telemetry text-xs font-semibold tracking-[0.2em] text-yellow-400">
                {selectedCar.chassis.toUpperCase()} // {activeVideo.caption}
              </span>
              <button
                type="button"
                onClick={() => setExpandedVideo(false)}
                aria-label="Fechar vídeo ampliado"
                className="cursor-pointer border border-white/15 p-1 text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              key={`modal-${activeVideo.src}`}
              src={activeVideo.src}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
