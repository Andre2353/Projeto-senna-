import { GameCanvas } from './components/3d/GameCanvas';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { useGameStore } from './store/useGameStore';

export function App() {
  const mode = useGameStore((state) => state.mode);
  const startExperience = useGameStore((state) => state.startExperience);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-slate-50">
      <GameCanvas />
      <LoadingScreen />
      {mode === 'landing' && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <div className="pointer-events-auto max-w-xl border border-white/15 bg-zinc-950/75 px-10 py-9 text-center backdrop-blur-md">
            <p className="font-telemetry text-xs tracking-[0.3em] text-yellow-400">
              TRIBUTE TELEMETRY // 1984–1994
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-50">
              AYRTON SENNA
            </h1>
            <p className="mt-1 font-telemetry text-sm tracking-[0.25em] text-zinc-300">
              7 PORTAIS DO LEGADO
            </p>
            <p className="mt-5 text-sm leading-relaxed text-zinc-300">
              Entre nos portais para reviver 7 corridas lendárias — ou siga em frente para
              conhecer sua trajetória.
            </p>
            <button
              type="button"
              onClick={startExperience}
              className="mt-7 cursor-pointer border border-yellow-400 bg-yellow-400 px-6 py-3 font-telemetry text-xs font-bold tracking-[0.2em] text-zinc-950 transition hover:bg-yellow-300"
            >
              LIGAR MOTOR / INICIAR
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
