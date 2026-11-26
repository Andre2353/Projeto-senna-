import { Play } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';
import { TimelineSection } from './TimelineSection';

export function LandingScreen() {
  const mode = useGameStore((state) => state.mode);
  const startExperience = useGameStore((state) => state.startExperience);

  if (mode !== 'landing') {
    return null;
  }

  const handleStart = () => {
    if (typeof window !== 'undefined') {
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
    startExperience();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* TOP HEADER BAR: Identity + Main Playable CTA */}
      <header className="pointer-events-auto fixed top-5 right-6 left-6 flex items-center justify-between gap-6 border border-white/15 bg-zinc-950/80 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-1.5 flex-col overflow-hidden">
            <span className="h-2/4 w-full bg-yellow-400" />
            <span className="h-1/4 w-full bg-green-600" />
            <span className="h-1/4 w-full bg-blue-700" />
          </div>
          <div>
            <p className="font-telemetry text-[10px] tracking-[0.26em] text-yellow-400">
              SHOWROOM 360° & TIMELINE INTERATIVA · 1984–1993
            </p>
            <h1 className="text-xl font-black tracking-tight text-slate-50">
              AYRTON SENNA — 7 PORTAIS DO LEGADO
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="inline-flex cursor-pointer items-center gap-2.5 border border-yellow-400 bg-yellow-400 px-6 py-3 font-telemetry text-xs font-bold tracking-[0.2em] text-zinc-950 transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
        >
          <Play className="h-4 w-4 fill-zinc-950" />
          <span>VIVER AS CORRIDAS PESSOALMENTE</span>
        </button>
      </header>

      <TimelineSection />
    </div>
  );
}
