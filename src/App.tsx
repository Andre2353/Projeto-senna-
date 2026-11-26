import { GameCanvas } from './components/3d/GameCanvas';
import { EndCredits } from './components/ui/EndCredits';
import { LandingScreen } from './components/ui/LandingScreen';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { NarrativeCard } from './components/ui/NarrativeCard';
import { PauseMenu } from './components/ui/PauseMenu';
import { PhaseTransition } from './components/ui/PhaseTransition';
import { TelemetryHUD } from './components/ui/TelemetryHUD';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useGameControls } from './hooks/useGameControls';

export function App() {
  useGameControls();
  useAudioEngine();

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-zinc-950 text-slate-50">
      <GameCanvas />
      <LoadingScreen />
      <LandingScreen />
      <PhaseTransition />
      <NarrativeCard />
      <TelemetryHUD />
      <PauseMenu />
      <EndCredits />
    </main>
  );
}

export default App;
