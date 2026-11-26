import { useEffect, useState } from 'react';
import { Box, Crosshair, Film, Flag, Minimize2, Play, RotateCw } from 'lucide-react';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';
import type { ExplodedPart, ShowroomAngleZone } from '../../types/game';
import { gameRuntime } from '../../utils/runtime';

interface ShowcaseSlide {
  id: ExplodedPart;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  src: string;
}

const SHOWCASE_SLIDES: readonly ShowcaseSlide[] = [
  {
    id: 'aero',
    code: '01',
    title: 'AERODINÂMICA EFICIENTE',
    subtitle: 'TÚNEL DE VENTO · FLUXO LIMPO',
    description:
      'Desenhada por Steve Nichols e Gordon Murray com frente ultrabaixa para maximizar o fluxo sob o assoalho plano e o difusor Venturi.',
    src: '/videos/f1-aero-test.mp4',
  },
  {
    id: 'engine',
    code: '02',
    title: 'HONDA RA168E V6 TURBO',
    subtitle: '1.5L BITURBO · 2.5 BAR · ~685 CV',
    description:
      'Motor 6 cilindros em V biturbo acoplado a câmbio transversal de 6 marchas, entregando 15 vitórias em 16 GPs na temporada de 1988.',
    src: '/videos/f1-engine-cover.mp4',
  },
  {
    id: 'wheels',
    code: '03',
    title: 'CONJUNTO RODA & FREIO',
    subtitle: 'CARBONO VENTILADO · SLICK GOODYEAR',
    description:
      'Discos e pinças de alta dissipação com suspensão duplo triângulo push-rod calibrada para frenagens tardias milimétricas.',
    src: '/videos/f1-wheel-exploded.mp4',
  },
];

const MP44_ANGLE_META: Record<
  ShowroomAngleZone,
  { angleLabel: string; title: string; copy: string }
> = {
  front: {
    angleLabel: 'FRENTE · 315°–45°',
    title: 'ASA DIANTEIRA & BICO ULTRABAIXO',
    copy: 'Perfil frontal extremamente rebaixado que reduziu o arrasto em retas e alimentou o efeito solo nas curvas rápidas de Suzuka.',
  },
  right: {
    angleLabel: 'LATERAL · 45°–135°',
    title: 'CHASSI MONOCOQUE & SIDEPODS',
    copy: 'Fibra de carbono moldada em autoclave, posição semideitada do piloto e entradas compactas para os intercoolers do V6 biturbo.',
  },
  rear: {
    angleLabel: 'TRASEIRA · 135°–225°',
    title: 'DIFUSOR VENTURI & ASA BIPLANO',
    copy: 'Traseira afunilada em perfil baixo direcionando fluxo limpo para a asa dupla e escapamento central do Honda RA168E.',
  },
  left: {
    angleLabel: 'COCKPIT · 225°–315°',
    title: 'COCKPIT SENNA #12',
    copy: 'Volante de 3 raios, câmbio manual em H e a clássica ergonomia reclinada que exigia força física e precisão extrema.',
  },
};

const STUDIO_ZONES: Array<{ id: ExplodedPart; label: string }> = [
  { id: 'aero', label: 'AERO & BICO' },
  { id: 'wheels', label: 'PNEUS & FREIOS' },
  { id: 'cockpit', label: 'COCKPIT' },
  { id: 'engine', label: 'MOTOR & CÂMBIO' },
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

export function LandingScreen() {
  const mode = useGameStore((state) => state.mode);
  const showroomZone = useGameStore((state) => state.showroomZone);
  const activeInspectedPart = useGameStore((state) => state.activeInspectedPart);
  const toggleInspectedPart = useGameStore((state) => state.toggleInspectedPart);
  const clearInspection = useGameStore((state) => state.clearInspection);
  const startExperience = useGameStore((state) => state.startExperience);
  const enterStage = useGameStore((state) => state.enterStage);

  const [viewMode, setViewMode] = useState<'showcase' | 'studio3d'>('showcase');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Automatic smooth crossfade cycling across the 3 MP4/4 showcase videos
  useEffect(() => {
    if (mode !== 'landing' || viewMode !== 'showcase') {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 6500);
    return () => {
      window.clearInterval(timer);
    };
  }, [mode, viewMode]);

  if (mode !== 'landing') {
    return null;
  }

  const suzukaStage = STAGES.find((stage) => stage.id === 3) ?? STAGES[0]!;
  const currentSlide = SHOWCASE_SLIDES[activeSlideIndex] ?? SHOWCASE_SLIDES[0]!;
  const angleInfo = MP44_ANGLE_META[showroomZone];

  const handleStart = () => {
    unlockAudioContext();
    startExperience();
  };

  const handleSuzukaDirect = () => {
    unlockAudioContext();
    enterStage(suzukaStage.id);
  };

  return (
    <section
      className={`fixed inset-0 z-20 flex h-screen w-screen flex-col justify-between overflow-hidden pt-5 px-6 pb-5 ${
        viewMode === 'showcase' ? 'pointer-events-auto bg-zinc-950' : 'pointer-events-none'
      }`}
    >
      {/* FULL-SCREEN MP4/4 CROSSFADE VIDEO SHOWCASE LAYER */}
      <div
        aria-hidden={viewMode !== 'showcase'}
        className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700 ${
          viewMode === 'showcase' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {SHOWCASE_SLIDES.map((slide, idx) => (
          <video
            key={slide.src}
            src={slide.src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              idx === activeSlideIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Studio Editorial Vignette keeping header & bottom telemetry crystal clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-zinc-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/75 via-transparent to-zinc-950/35" />
      </div>

      {/* TOP HEADER BAR (Flex Flow - Never Clipped) */}
      <header className="pointer-events-auto flex shrink-0 flex-wrap items-center justify-between gap-4 border border-white/15 bg-zinc-950/82 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-8 w-1.5 flex-col overflow-hidden">
            <span className="h-2/4 w-full bg-yellow-400" />
            <span className="h-1/4 w-full bg-green-600" />
            <span className="h-1/4 w-full bg-blue-700" />
          </div>
          <div>
            <p className="font-telemetry text-[10px] tracking-[0.24em] text-yellow-400">
              1988 · HONDA MARLBORO McLAREN · AYRTON SENNA #12
            </p>
            <h1 className="text-lg font-black tracking-tight text-slate-50 sm:text-xl">
              McLAREN MP4/4 — SHOWROOM OFICIAL
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center border border-white/15 bg-zinc-900/85 p-0.5 font-telemetry text-[10px] tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition ${
                viewMode === 'showcase'
                  ? 'bg-white/15 font-bold text-yellow-400'
                  : 'text-zinc-400 hover:text-slate-100'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>VITRINE MP4/4</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('studio3d')}
              className={`inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition ${
                viewMode === 'studio3d'
                  ? 'bg-white/15 font-bold text-yellow-400'
                  : 'text-zinc-400 hover:text-slate-100'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>VISÃO ESTÚDIO 3D</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSuzukaDirect}
            className="hidden cursor-pointer items-center gap-1.5 border border-white/20 bg-zinc-900/90 px-3.5 py-2 font-telemetry text-[10px] font-semibold tracking-[0.16em] text-slate-50 transition hover:border-yellow-400 hover:text-yellow-400 xl:inline-flex"
          >
            <Flag className="h-3.5 w-3.5 text-yellow-400" />
            <span>CORRER SUZUKA 88</span>
          </button>

          <button
            type="button"
            onClick={handleStart}
            className="inline-flex cursor-pointer items-center gap-2 border border-yellow-400 bg-yellow-400 px-5 py-2 font-telemetry text-[11px] font-bold tracking-[0.18em] text-zinc-950 transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
          >
            <Play className="h-3.5 w-3.5 fill-zinc-950" />
            <span>VIVER AS CORRIDAS PESSOALMENTE</span>
          </button>
        </div>
      </header>

      {/* MIDDLE CONTENT ROW */}
      <div className="flex min-h-0 flex-1 items-end justify-between py-4 sm:items-center">
        {viewMode === 'showcase' ? (
          <div className="max-w-lg border-l-2 border-yellow-400 bg-zinc-950/55 py-3 pr-5 pl-5 backdrop-blur-sm">
            <p className="font-telemetry text-[10px] font-semibold tracking-[0.24em] text-yellow-400">
              CAPÍTULO {currentSlide.code} // {currentSlide.subtitle}
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">
              {currentSlide.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              {currentSlide.description}
            </p>
          </div>
        ) : (
          <div className="ml-auto w-full max-w-xs">
            <aside className="pointer-events-auto border border-white/15 bg-zinc-950/82 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="font-telemetry text-[10px] font-semibold tracking-[0.2em] text-yellow-400">
                  {activeInspectedPart ? 'TELEMETRIA MP4/4 (1988)' : angleInfo.angleLabel}
                </span>
                <RotateCw className="h-3.5 w-3.5 text-zinc-400" />
              </div>

              {activeInspectedPart ? (
                <div className="mt-3 flex flex-col gap-2 font-telemetry text-[11px]">
                  <div
                    className={`border p-2 ${
                      activeInspectedPart === 'engine'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/10 bg-zinc-900/50'
                    }`}
                  >
                    <p className="text-[9px] tracking-widest text-zinc-400">MOTOR (V6 BITURBO)</p>
                    <p className="mt-0.5 font-semibold text-slate-50">Honda RA168E · 1.494 cc</p>
                    <p className="text-[10px] text-zinc-300">~685 cv @ 12.500 RPM (2.5 bar)</p>
                  </div>
                  <div
                    className={`border p-2 ${
                      activeInspectedPart === 'wheels'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/10 bg-zinc-900/50'
                    }`}
                  >
                    <p className="text-[9px] tracking-widest text-zinc-400">FREIOS & SUSPENSÃO</p>
                    <p className="mt-0.5 text-slate-50">Carbono ventilado · Push-rod duplo V</p>
                  </div>
                  <div
                    className={`border p-2 ${
                      activeInspectedPart === 'aero' || activeInspectedPart === 'cockpit'
                        ? 'border-yellow-400 bg-yellow-400/10'
                        : 'border-white/10 bg-zinc-900/50'
                    }`}
                  >
                    <p className="text-[9px] tracking-widest text-zinc-400">CHASSI & AERO</p>
                    <p className="mt-0.5 text-slate-50">Monocoque carbono · 540 kg</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mt-3 font-telemetry text-xs font-bold tracking-[0.16em] text-slate-50">
                    {angleInfo.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300">{angleInfo.copy}</p>
                </>
              )}

              <p className="mt-3 border-t border-white/10 pt-2.5 font-telemetry text-[10px] tracking-wider text-zinc-400">
                CLIQUE NOS PONTOS DE TELEMETRIA OU ARRASTE 360°
              </p>
            </aside>
          </div>
        )}
      </div>

      {/* BOTTOM BAR (Flex Flow - Never Clipped) */}
      <footer className="pointer-events-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border border-white/15 bg-zinc-950/85 px-5 py-2.5 backdrop-blur-md">
        {viewMode === 'showcase' ? (
          <div className="flex flex-wrap items-center gap-2">
            {SHOWCASE_SLIDES.map((slide, idx) => {
              const isActive = idx === activeSlideIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`cursor-pointer border px-3 py-1.5 font-telemetry text-[10px] tracking-[0.14em] transition ${
                    isActive
                      ? 'border-yellow-400 bg-yellow-400/15 font-bold text-yellow-400'
                      : 'border-white/15 bg-zinc-900/60 text-zinc-300 hover:border-white/40'
                  }`}
                >
                  {slide.code} // {slide.title}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 font-telemetry text-[9px] tracking-widest text-zinc-400">
              <Crosshair className="h-3 w-3 text-yellow-400" />
              <span>TELEMETRIA 3D</span>
            </span>
            {STUDIO_ZONES.map((btn) => {
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
        )}

        <div className="hidden items-center gap-4 font-telemetry text-[10px] tracking-[0.16em] text-zinc-400 md:flex">
          <span>CHASSI MP4/4 CARBONO</span>
          <span className="text-zinc-600">|</span>
          <span>15 VITÓRIAS / 16 GPs</span>
          <span className="text-zinc-600">|</span>
          <span className="text-yellow-400">CAMPEÃO 1988</span>
        </div>
      </footer>
    </section>
  );
}
