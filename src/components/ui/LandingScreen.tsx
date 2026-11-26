import { Power } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { gameRuntime } from '../../utils/runtime';

export function LandingScreen() {
  const mode = useGameStore((state) => state.mode);
  const startExperience = useGameStore((state) => state.startExperience);

  if (mode !== 'landing') {
    return null;
  }

  const handleStart = () => {
    // Unlock browser AudioContext directly inside the user click gesture
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
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center px-6">
      <div className="pointer-events-auto relative w-full max-w-xl border border-white/15 bg-zinc-950/75 px-10 py-9 text-center backdrop-blur-md">
        {/* Helmet-inspired technical accent bar */}
        <div className="mx-auto mb-6 flex h-1 w-28 overflow-hidden">
          <span className="h-full w-2/4 bg-yellow-400" />
          <span className="h-full w-1/4 bg-green-600" />
          <span className="h-full w-1/4 bg-blue-700" />
        </div>

        <p className="font-telemetry text-[11px] tracking-[0.32em] text-yellow-400">
          TELEMETRIA INTERATIVA · DESKTOP 60 FPS
        </p>

        <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-50">
          AYRTON SENNA
        </h1>

        <p className="mt-2 font-telemetry text-sm font-semibold tracking-[0.28em] text-zinc-300">
          7 PORTAIS DO LEGADO
        </p>

        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-300">
          Entre nos portais para reviver 7 corridas lendárias — ou siga em frente para conhecer
          sua trajetória.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex cursor-pointer items-center gap-3 border border-yellow-400 bg-yellow-400 px-7 py-3.5 font-telemetry text-xs font-bold tracking-[0.22em] text-zinc-950 transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
          >
            <Power className="h-4 w-4" />
            LIGAR MOTOR / INICIAR
          </button>

          <div className="flex items-center gap-5 font-telemetry text-[11px] tracking-wider text-zinc-400">
            <span>W/A/S/D OU SETAS: PILOTAR</span>
            <span className="text-zinc-700">|</span>
            <span>M: ÁUDIO</span>
            <span className="text-zinc-700">|</span>
            <span>ESC: PAUSA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
