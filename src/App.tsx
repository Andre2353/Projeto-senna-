import { GameCanvas } from './components/3d/GameCanvas';
import { LandingScreen } from './components/ui/LandingScreen';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { PauseMenu } from './components/ui/PauseMenu';
import { TelemetryHUD } from './components/ui/TelemetryHUD';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useGameControls } from './hooks/useGameControls';

export function App() {
  useGameControls();
  useAudioEngine();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-slate-50">
      <GameCanvas />
      <LoadingScreen />
      <LandingScreen />
      <TelemetryHUD />
      <PauseMenu />
    </main>
  );
}

export default App;
