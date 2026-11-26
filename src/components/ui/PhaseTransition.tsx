import { useEffect } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, Flag } from 'lucide-react';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';

export function PhaseTransition() {
  const transitionBanner = useGameStore((state) => state.transitionBanner);
  const setTransitionBanner = useGameStore((state) => state.setTransitionBanner);
  const raceResult = useGameStore((state) => state.raceResult);
  const restartCurrentStage = useGameStore((state) => state.restartCurrentStage);
  const returnToCorridor = useGameStore((state) => state.returnToCorridor);

  useEffect(() => {
    if (!transitionBanner) {
      return;
    }
    const timer = window.setTimeout(() => {
      setTransitionBanner(null);
    }, 2800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [setTransitionBanner, transitionBanner]);

  const resultStage =
    raceResult !== null ? STAGES.find((stage) => stage.id === raceResult.stageId) ?? null : null;

  return (
    <>
      {transitionBanner && !raceResult && (
        <div className="pointer-events-none fixed top-20 left-1/2 z-30 -translate-x-1/2">
          <div className="border border-white/15 bg-zinc-950/85 px-8 py-3.5 text-center backdrop-blur-md">
            <div
              className="mx-auto mb-2 h-0.5 w-16"
              style={{ backgroundColor: transitionBanner.accentColor ?? '#FACC15' }}
            />
            <p className="font-telemetry text-sm font-bold tracking-[0.24em] text-slate-50">
              {transitionBanner.title}
            </p>
            <p className="mt-1 font-telemetry text-[11px] tracking-[0.16em] text-zinc-400">
              {transitionBanner.subtitle}
            </p>
          </div>
        </div>
      )}

      {raceResult && resultStage && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/15 bg-zinc-950/95 p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-telemetry text-[10px] tracking-[0.25em] text-yellow-400">
                  {resultStage.circuit} {resultStage.year}
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-50">
                  {raceResult.status === 'victory' ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span>BANDEIRADA · P1</span>
                    </>
                  ) : (
                    <>
                      <Flag className="h-6 w-6 text-red-500" />
                      <span>P{raceResult.position} — FINAL</span>
                    </>
                  )}
                </h2>
              </div>
              <span
                className={`border px-2.5 py-1 font-telemetry text-xs font-bold ${
                  raceResult.status === 'victory'
                    ? 'border-green-600 bg-green-600/20 text-green-400'
                    : 'border-red-500 bg-red-500/20 text-red-400'
                }`}
              >
                {raceResult.status === 'victory' ? 'VITÓRIA' : 'P2'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 font-telemetry text-xs">
              <div className="border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[10px] text-zinc-500">TEMPO DE CORRIDA</p>
                <p className="mt-1 text-base font-bold text-slate-50">
                  {raceResult.elapsedSeconds.toFixed(1)}s
                </p>
              </div>
              <div className="border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[10px] text-zinc-500">
                  {resultStage.mechanic === 'defend_lead' ? 'DEFESA DE LIDERANÇA' : 'ULTRAPASSAGENS'}
                </p>
                <p className="mt-1 text-base font-bold text-yellow-400">
                  {resultStage.mechanic === 'defend_lead'
                    ? raceResult.status === 'victory'
                      ? 'MANTIDA'
                      : 'PERDIDA'
                    : `${raceResult.overtakesCompleted}/${raceResult.overtakesRequired}`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => returnToCorridor(resultStage.id)}
                className="flex cursor-pointer items-center justify-between border border-yellow-400 bg-yellow-400 px-4 py-3 font-telemetry text-xs font-bold tracking-[0.16em] text-zinc-950 transition hover:bg-yellow-300"
              >
                <span>VOLTAR AO CORREDOR</span>
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={restartCurrentStage}
                className="flex cursor-pointer items-center justify-between border border-white/15 bg-zinc-900/80 px-4 py-2.5 font-telemetry text-xs tracking-[0.14em] text-slate-50 transition hover:border-white/40"
              >
                <span>TENTAR NOVAMENTE</span>
                <RotateCcw className="h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
