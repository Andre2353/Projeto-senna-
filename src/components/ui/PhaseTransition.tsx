import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, RotateCcw } from 'lucide-react';
import { STAGES } from '../../data/sennaData';
import { useGameStore } from '../../store/useGameStore';

function formatLapTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) {
    return '--:--.-';
  }
  const totalTenths = Math.max(0, Math.floor(ms / 100));
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}

export function PhaseTransition() {
  const mode = useGameStore((state) => state.mode);
  const activeStageId = useGameStore((state) => state.activeStageId);
  const transitionBanner = useGameStore((state) => state.transitionBanner);
  const setTransitionBanner = useGameStore((state) => state.setTransitionBanner);
  const raceResult = useGameStore((state) => state.raceResult);
  const restartCurrentStage = useGameStore((state) => state.restartCurrentStage);
  const enterStage = useGameStore((state) => state.enterStage);
  const returnToCorridor = useGameStore((state) => state.returnToCorridor);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  useEffect(() => {
    if (mode === 'landing') {
      setFadeOpacity(0);
      return;
    }
    setFadeOpacity(1);
    const timer = window.setTimeout(() => {
      setFadeOpacity(0);
    }, 60);
    return () => {
      window.clearTimeout(timer);
    };
  }, [activeStageId, mode]);

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
  const nextStage =
    resultStage !== null ? STAGES.find((stage) => stage.id === resultStage.id + 1) ?? null : null;

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md transition-opacity duration-400 ${
          fadeOpacity > 0 ? 'opacity-100' : 'opacity-0'
        }`}
      />

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
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl border border-white/15 bg-zinc-950/95 p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div>
                <p className="font-telemetry text-[10px] tracking-[0.25em] text-yellow-400">
                  {resultStage.circuit} {resultStage.year} · {resultStage.totalLaps} VOLTAS
                </p>
                <h2 className="mt-1 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-50">
                  {raceResult.status === 'victory' ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <span>BANDEIRADA · P1</span>
                    </>
                  ) : (
                    <>
                      <Flag className="h-6 w-6 text-yellow-400" />
                      <span>CLASSIFICAÇÃO FINAL · P{raceResult.position}</span>
                    </>
                  )}
                </h2>
              </div>

              <span
                className={`border px-2.5 py-1 font-telemetry text-xs font-bold ${
                  raceResult.status === 'victory'
                    ? 'border-green-600 bg-green-600/20 text-green-400'
                    : 'border-white/20 bg-zinc-900 text-zinc-200'
                }`}
              >
                {raceResult.status === 'victory' ? 'VITÓRIA' : `P${raceResult.position}/10`}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5 font-telemetry text-xs">
              <div className="border border-white/10 bg-zinc-900/60 p-2.5">
                <p className="text-[9px] tracking-widest text-zinc-500">TEMPO TOTAL</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-slate-50">
                  {raceResult.elapsedSeconds.toFixed(1)}s
                </p>
              </div>
              <div className="border border-white/10 bg-zinc-900/60 p-2.5">
                <p className="text-[9px] tracking-widest text-zinc-500">MELHOR VOLTA</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-yellow-400">
                  {formatLapTime(raceResult.bestLapMs)}
                </p>
              </div>
              <div className="border border-white/10 bg-zinc-900/60 p-2.5">
                <p className="text-[9px] tracking-widest text-zinc-500">POSIÇÕES GANHAS</p>
                <p className="mt-1 text-sm font-bold text-slate-50">
                  {raceResult.overtakesCompleted}
                </p>
              </div>
            </div>

            {/* 10-Car Final Standings Table */}
            <div className="mt-3.5 max-h-60 overflow-y-auto border border-white/10 bg-zinc-900/40 font-telemetry text-[11px]">
              <div className="grid grid-cols-[2.2rem_1fr_6.5rem_4.5rem] border-b border-white/10 bg-zinc-950/70 px-3 py-1.5 text-[9px] tracking-widest text-zinc-400">
                <span>POS</span>
                <span>PILOTO</span>
                <span>EQUIPE</span>
                <span className="text-right">MELHOR</span>
              </div>
              {raceResult.standings.map((row) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[2.2rem_1fr_6.5rem_4.5rem] items-center border-b border-white/5 px-3 py-1.5 ${
                    row.isPlayer
                      ? 'bg-yellow-400/15 font-bold text-yellow-300'
                      : 'text-zinc-200'
                  }`}
                >
                  <span className="tabular-nums text-zinc-400">P{row.position}</span>
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="inline-block h-2.5 w-1 shrink-0"
                      style={{
                        backgroundColor:
                          row.primaryColor === '#09090B' ? row.secondaryColor : row.primaryColor,
                      }}
                    />
                    <span className="truncate">{row.name}</span>
                  </span>
                  <span className="truncate text-[10px] text-zinc-400">{row.team}</span>
                  <span className="text-right tabular-nums text-[10px] text-zinc-300">
                    {formatLapTime(row.bestLapMs)}
                  </span>
                </div>
              ))}
            </div>

            {/* 3 Clear Final Action Buttons */}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={restartCurrentStage}
                className="flex cursor-pointer items-center justify-center gap-1.5 border border-white/20 bg-zinc-900 px-3 py-2.5 font-telemetry text-[11px] font-semibold tracking-[0.12em] text-slate-50 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>CORRER NOVAMENTE</span>
              </button>

              {nextStage && (
                <button
                  type="button"
                  onClick={() => enterStage(nextStage.id)}
                  className="flex cursor-pointer items-center justify-center gap-1.5 border border-yellow-400 bg-yellow-400 px-3 py-2.5 font-telemetry text-[11px] font-bold tracking-[0.12em] text-zinc-950 transition hover:bg-yellow-300"
                >
                  <span>PRÓXIMA CORRIDA</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => returnToCorridor(resultStage.id)}
                className="flex cursor-pointer items-center justify-center gap-1.5 border border-white/20 bg-zinc-900 px-3 py-2.5 font-telemetry text-[11px] font-semibold tracking-[0.12em] text-slate-50 transition hover:border-white/50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>VOLTAR AO AUTÓDROMO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
