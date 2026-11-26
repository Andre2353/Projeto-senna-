import { GameCanvas } from './components/3d/GameCanvas';
import { LandingScreen } from './components/ui/LandingScreen';
import { LoadingScreen } from './components/ui/LoadingScreen';

export function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950 text-slate-50">
      <GameCanvas />
      <LoadingScreen />
      <LandingScreen />
    </main>
  );
}

export default App;
