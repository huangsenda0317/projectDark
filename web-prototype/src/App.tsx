import { useEffect } from 'react';
import { useGameStore } from './stores/useGameStore';
import { useBoardStore } from './stores/useBoardStore';
import { TopBar } from './components/ui/TopBar';
import { BoardScene } from './components/scenes/BoardScene';
import { CombatScene } from './components/scenes/CombatScene';
import { VillageScene } from './components/scenes/VillageScene';
import { InterludeScene } from './components/scenes/InterludeScene';

function App() {
  const currentScene = useGameStore(s => s.currentScene);
  const startNewRun = useGameStore(s => s.startNewRun);
  const boardGenerate = useBoardStore(s => s.generateBoard);
  const run = useGameStore(s => s.run);

  // Initialize first run on mount
  useEffect(() => {
    if (run.floor === 1 && run.diceHistory.length === 0) {
      startNewRun();
      boardGenerate(1);
    }
  }, []);

  const renderScene = () => {
    switch (currentScene) {
      case 'board':
        return <BoardScene />;
      case 'combat':
        return <CombatScene />;
      case 'village':
        return <VillageScene />;
      case 'interlude':
        return <InterludeScene />;
      default:
        return <BoardScene />;
    }
  };

  return (
    <div className="h-screen bg-parchment flex flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto py-4">
        {renderScene()}
      </main>
    </div>
  );
}

export default App;
