import { useGameStore } from '../../store/useGameStore';
import type { GraphicsQuality } from '../../types/game';

interface SettingsPanelProps {
  onBack: () => void;
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-telemetry text-xs text-zinc-300">ÁUDIO / MUTE</span>
        <button
          type="button"
          onClick={() => updateSettings({ muted: !settings.muted })}
          className={`cursor-pointer border px-3 py-1 font-telemetry text-[11px] ${
            settings.muted ? 'border-red-500 text-red-400' : 'border-green-600 text-green-400'
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
                  ? 'border-yellow-400 bg-yellow-400 font-bold text-zinc-950'
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
        <span className="font-telemetry text-xs text-zinc-300">REDUZIR TREMORES / EFEITOS</span>
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
        onClick={onBack}
        className="mt-2 cursor-pointer border border-white/20 bg-zinc-900 py-2.5 font-telemetry text-xs tracking-[0.18em] text-slate-50 hover:border-yellow-400"
      >
        VOLTAR
      </button>
    </div>
  );
}
