import { Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export function AudioControls() {
  const muted = useGameStore((state) => state.settings.muted);
  const masterVolume = useGameStore((state) => state.settings.masterVolume);
  const updateSettings = useGameStore((state) => state.updateSettings);

  return (
    <div className="flex items-center gap-2.5 border border-white/15 bg-zinc-950/75 px-3 py-1.5 backdrop-blur-md">
      <button
        type="button"
        onClick={() => updateSettings({ muted: !muted })}
        title={muted ? 'Ativar áudio (M)' : 'Mutar áudio (M)'}
        className="flex cursor-pointer items-center gap-1.5 font-telemetry text-[11px] text-zinc-200 transition hover:text-yellow-400"
      >
        {muted ? <VolumeX className="h-3.5 w-3.5 text-red-500" /> : <Volume2 className="h-3.5 w-3.5 text-yellow-400" />}
        <span>M</span>
      </button>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round((muted ? 0 : masterVolume) * 100)}
        onChange={(e) => {
          const val = Number(e.target.value) / 100;
          updateSettings({ masterVolume: val, muted: val === 0 });
        }}
        aria-label="Volume do motor"
        className="h-1 w-20 cursor-pointer accent-yellow-400"
      />
    </div>
  );
}
