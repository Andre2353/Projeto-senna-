import { Play, RotateCcw, Settings, Compass, ArrowLeft } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import type { GraphicsQuality } from '../../types/game';

export function PauseMenu() {
  const mode = useGameStore((state) => state.mode);
  const isPaused = useGameStore((state) => state.isPaused);
  const showSettings = useGameStore((state) => state.showSettings);
  const settings = useGameStore((state) => state.settings);
  const togglePause = useGameStore((state) => state.togglePause);
  const setShowSettings = useGameStore((state) => state.setShowSettings);
  const returnToCorridor = useGameStore((state) => state.returnToCorridor);
  const restartCurrentStage = useGameStore((state) => state.restartCurrentStage);
  const enterOpenWorld = useGameStore((state) => state.enterOpenWorld);
  const resetAllProgress = useGameStore((state) => state.resetAllProgress);
  const updateSettings = useGameStore((state) => state.updateSettings);

  if (!isPaused || mode === 'landing' || mode === 'credits') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md">
      <div className="w-full max-w-md border border-white/15 bg-zinc-950/95 p-7">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="font-telemetry text-[10px] tracking-[0.25em] text-yellow-400">
              SISTEMA PAUSADO
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-50">
              {showSettings ? 'CONFIGURAÇÕES' : 'MENU DE TELEMETRIA'}
            </h2>
          </div>
          <span className="border border-white/15 px-2 py-1 font-telemetry text-[10px] text-zinc-400">
            ESC
          </span>
        </div>

        {!showSettings ? (
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => togglePause(false)}
              className="flex cursor-pointer items-center justify-between border border-yellow-400 bg-yellow-400 px-4 py-3 font-telemetry text-xs font-bold tracking-[0.16em] text-zinc-950 transition hover:bg-yellow-300"
            >
              <span>CONTINUAR</span>
              <Play className="h-4 w-4" />
            </button>

            {mode === 'race' && (
              <>
                <button
                  type="button"
                  onClick={restartCurrentStage}
                  className="flex cursor-pointer items-center justify-between border border-white/15 bg-zinc-900/80 px-4 py-2.5 font-telemetry text-xs tracking-[0.14em] text-slate-50 transition hover:border-yellow-400/60"
                >
                  <span>REINICIAR CORRIDA ATUAL</span>
                  <RotateCcw className="h-4 w-4 text-zinc-400" />
                </button>
                <button
                  type="button"
                  onClick={() => returnToCorridor()}
                  className="flex cursor-pointer items-center justify-between border border-white/15 bg-zinc-900/80 px-4 py-2.5 font-telemetry text-xs tracking-[0.14em] text-slate-50 transition hover:border-yellow-400/60"
                >
                  <span>VOLTAR AO CORREDOR</span>
                  <ArrowLeft className="h-4 w-4 text-zinc-400" />
                </button>
              </>
            )}

            {mode !== 'open_world' && (
              <button
                type="button"
                onClick={enterOpenWorld}
                className="flex cursor-pointer items-center justify-between border border-white/15 bg-zinc-900/80 px-4 py-2.5 font-telemetry text-xs tracking-[0.14em] text-yellow-400 transition hover:border-yellow-400"
              >
                <span>IR DIRETO PARA O MUNDO ABERTO</span>
                <Compass className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex cursor-pointer items-center justify-between border border-white/15 bg-zinc-900/80 px-4 py-2.5 font-telemetry text-xs tracking-[0.14em] text-slate-50 transition hover:border-white/40"
            >
              <span>CONFIGURAÇÕES</span>
              <Settings className="h-4 w-4 text-zinc-400" />
            </button>

            <button
              type="button"
              onClick={resetAllProgress}
              className="mt-2 flex cursor-pointer items-center justify-between border border-red-500/40 bg-red-950/25 px-4 py-2.5 font-telemetry text-xs tracking-[0.14em] text-red-400 transition hover:border-red-500 hover:bg-red-950/50"
            >
              <span>REINICIAR DO ZERO</span>
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-telemetry text-xs text-zinc-300">ÁUDIO / MUTE</span>
              <button
                type="button"
                onClick={() => updateSettings({ muted: !settings.muted })}
                className={`cursor-pointer border px-3 py-1 font-telemetry text-[11px] ${
                  settings.muted
                    ? 'border-red-500 text-red-400'
                    : 'border-green-600 text-green-400'
                }`}
              >
                {settings.muted ? 'MUTADO' : 'ATIVO'}
              </button>
            </div>

            <div>
              <div className="flex justify-between font-telemetry text-xs text-zinc-300">
                <span>VOLUME DO MOTOR</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.masterVolume * 100)}
                onChange={(e) =>
                  updateSettings({
                    masterVolume: Number(e.target.value) / 100,
                    muted: Number(e.target.value) === 0,
                  })
                }
                className="mt-1.5 w-full cursor-pointer accent-yellow-400"
              />
            </div>

            <div>
              <span className="font-telemetry text-xs text-zinc-300">QUALIDADE GRÁFICA</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as GraphicsQuality[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateSettings({ quality: level })}
                    className={`cursor-pointer border py-1.5 font-telemetry text-[11px] uppercase ${
                      settings.quality === level
                        ? 'border-yellow-400 bg-yellow-400 text-zinc-950 font-bold'
                        : 'border-white/15 text-zinc-300 hover:border-white/40'
                    }`}
                  >
                    {level === 'high' ? 'ALTO' : level === 'medium' ? 'MÉDIO' : 'BAIXO'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between font-telemetry text-xs text-zinc-300">
                <span>SENSIBILIDADE DA DIREÇÃO</span>
                <span>{settings.steeringSensitivity.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={50}
                max={160}
                value={Math.round(settings.steeringSensitivity * 100)}
                onChange={(e) =>
                  updateSettings({ steeringSensitivity: Number(e.target.value) / 100 })
                }
                className="mt-1.5 w-full cursor-pointer accent-yellow-400"
              />
            </div>

            <div>
              <div className="flex justify-between font-telemetry text-xs text-zinc-300">
                <span>DISTÂNCIA DA CÂMERA</span>
                <span>{settings.cameraDistance.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={80}
                max={135}
                value={Math.round(settings.cameraDistance * 100)}
                onChange={(e) =>
                  updateSettings({ cameraDistance: Number(e.target.value) / 100 })
                }
                className="mt-1.5 w-full cursor-pointer accent-yellow-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="font-telemetry text-xs text-zinc-300">
                REDUZIR TREMORES / EFEITOS
              </span>
              <button
                type="button"
                onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                className={`cursor-pointer border px-3 py-1 font-telemetry text-[11px] ${
                  settings.reducedMotion
                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                    : 'border-white/15 text-zinc-400'
                }`}
              >
                {settings.reducedMotion ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="mt-2 cursor-pointer border border-white/20 bg-zinc-900 py-2.5 font-telemetry text-xs tracking-[0.18em] text-slate-50 hover:border-yellow-400"
            >
              VOLTAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
