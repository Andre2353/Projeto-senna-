import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { engineAudio } from '../utils/engineAudio';

export function useAudioEngine(): void {
  const mode = useGameStore((state) => state.mode);
  const isPaused = useGameStore((state) => state.isPaused);
  const muted = useGameStore((state) => state.settings.muted);
  const masterVolume = useGameStore((state) => state.settings.masterVolume);

  useEffect(() => {
    if (mode !== 'landing') {
      engineAudio.init();
    }
  }, [mode]);

  useEffect(() => {
    let frameId = 0;

    const tick = () => {
      const isActive = mode !== 'landing' && mode !== 'credits' && !isPaused;
      engineAudio.update(isActive, muted, masterVolume);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isPaused, masterVolume, mode, muted]);

  useEffect(() => {
    return () => {
      engineAudio.dispose();
    };
  }, []);
}
