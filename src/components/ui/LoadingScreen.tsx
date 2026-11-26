import { useGameStore } from '../../store/useGameStore';

export function LoadingScreen() {
  const isLoaded = useGameStore((state) => state.isLoaded);
  const loadProgress = useGameStore((state) => state.loadProgress);

  if (isLoaded) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-slate-50">
      <div className="w-full max-w-md border border-white/15 bg-zinc-950/80 p-8 backdrop-blur-md">
        <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.22em] text-zinc-400">
          <span>SISTEMA DE TELEMETRIA WEBGL</span>
          <span className="font-telemetry text-yellow-400">{Math.round(loadProgress)}%</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-50">
          AYRTON SENNA
        </h1>
        <p className="mt-1 font-telemetry text-xs tracking-[0.26em] text-yellow-400">
          7 PORTAIS DO LEGADO
        </p>

        <div className="mt-6 h-1 w-full bg-zinc-800">
          <div
            className="h-full bg-yellow-400 transition-all duration-150"
            style={{ width: `${Math.max(4, Math.min(100, loadProgress))}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between font-telemetry text-[11px] text-zinc-500">
          <span>CALIBRANDO CHASSI E PISTA</span>
          <span>DESKTOP 60 FPS</span>
        </div>
      </div>
    </div>
  );
}
