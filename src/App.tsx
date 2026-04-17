import { useState, useCallback } from 'react';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

interface EndState {
  won: boolean;
  bestLevel: number;
  bestCents: number;
}

function App() {
  const [endState, setEndState] = useState<EndState | null>(null);

  const handleGameEnd = useCallback((won: boolean, bestLevel: number, bestCents: number) => {
    setEndState({ won, bestLevel, bestCents });
  }, []);

  const handlePlayAgain = useCallback(() => {
    setEndState(null);
  }, []);

  if (endState) {
    return (
      <EndScreen
        won={endState.won}
        bestLevel={endState.bestLevel}
        bestCents={endState.bestCents}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return <GameScreen onGameEnd={handleGameEnd} />;
}

export default App;
