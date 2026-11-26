import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export interface ControlInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
}

export const controlInput: ControlInputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  handbrake: false,
};

export function resetControlInput(): void {
  controlInput.forward = false;
  controlInput.backward = false;
  controlInput.left = false;
  controlInput.right = false;
  controlInput.handbrake = false;
}

export function useGameControls(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const code = event.code;

      if (code === 'Escape') {
        event.preventDefault();
        useGameStore.getState().togglePause();
        return;
      }

      if (code === 'KeyM') {
        event.preventDefault();
        const { settings, updateSettings } = useGameStore.getState();
        updateSettings({ muted: !settings.muted });
        return;
      }

      if (code === 'KeyR') {
        const state = useGameStore.getState();
        if (state.mode === 'race' && !state.isPaused) {
          event.preventDefault();
          state.restartCurrentStage();
          return;
        }
      }

      if (code === 'KeyW' || code === 'ArrowUp') {
        controlInput.forward = true;
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        controlInput.backward = true;
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        controlInput.left = true;
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        controlInput.right = true;
      } else if (code === 'Space') {
        if (useGameStore.getState().mode === 'open_world') {
          event.preventDefault();
        }
        controlInput.handbrake = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const code = event.code;
      if (code === 'KeyW' || code === 'ArrowUp') {
        controlInput.forward = false;
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        controlInput.backward = false;
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        controlInput.left = false;
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        controlInput.right = false;
      } else if (code === 'Space') {
        controlInput.handbrake = false;
      }
    };

    const handleBlur = () => {
      resetControlInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
}
