import { ArrowLeft, Compass } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function EndCredits() {
  const mode = useGameStore((state) => state.mode);
  const completedStages = useGameStore((state) => state.completedStages);
  const unlockedChapters = useGameStore((state) => state.unlockedChapters);
  const closeCredits = useGameStore((state) => state.closeCredits);
  const returnToCorridor = useGameStore((state) => state.returnToCorridor);

  if (mode !== 'credits') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/82 p-6 backdrop-blur-md">
      <div className="w-full max-w-2xl border border-white/15 bg-zinc-950/92 p-10 text-center">
        <div className="mx-auto mb-6 flex h-1 w-32 overflow-hidden">
          <span className="h-full w-2/4 bg-yellow-400" />
          <span className="h-full w-1/4 bg-green-600" />
          <span className="h-full w-1/4 bg-blue-700" />
        </div>

        <p className="font-telemetry text-[11px] tracking-[0.28em] text-yellow-400">
          HOMENAGEM INTERATIVA // LEGADO ETERNO
        </p>

        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-50">
          AYRTON SENNA DO BRASIL
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base italic leading-relaxed text-zinc-200">
          &ldquo;Seja você quem for, qualquer posição que tenha na vida, tenha sempre como meta
          muita força, muita determinação.&rdquo;
        </p>

        <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4 font-telemetry text-xs">
          <div className="border border-white/15 bg-zinc-900/70 p-4">
            <p className="text-[10px] tracking-widest text-zinc-400">PORTAIS CONCLUÍDOS</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{completedStages.length}/7</p>
          </div>
          <div className="border border-white/15 bg-zinc-900/70 p-4">
            <p className="text-[10px] tracking-widest text-zinc-400">CAPÍTULOS DA TRAJETÓRIA</p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">{unlockedChapters.length}/6</p>
          </div>
        </div>

        <p className="mt-7 font-telemetry text-[11px] tracking-[0.18em] text-zinc-500">
          EXPERIÊNCIA 3D PROCEDURAL · REACT THREE FIBER · WEB AUDIO API
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={closeCredits}
            className="inline-flex cursor-pointer items-center gap-2 border border-yellow-400 bg-yellow-400 px-5 py-2.5 font-telemetry text-xs font-bold tracking-[0.16em] text-zinc-950 transition hover:bg-yellow-300"
          >
            <Compass className="h-4 w-4" />
            <span>CONTINUAR NO MUNDO ABERTO</span>
          </button>

          <button
            type="button"
            onClick={() => returnToCorridor(null)}
            className="inline-flex cursor-pointer items-center gap-2 border border-white/20 bg-zinc-900 px-5 py-2.5 font-telemetry text-xs tracking-[0.16em] text-slate-50 transition hover:border-white/40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>VOLTAR AO CORREDOR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
