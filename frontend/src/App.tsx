import { useCallback, useRef } from "react";
import { GameOverScreen } from "./components/GameOverScreen";
import { Hud } from "./components/Hud";
import { MoveControls } from "./components/MoveControls";
import { PlayArea } from "./components/PlayArea";
import { StartScreen } from "./components/StartScreen";
import {
  PLAYER_BOTTOM_OFFSET_PERCENT,
  PLAYER_WIDTH_PERCENT,
} from "./constants";
import { useBackendStatus } from "./hooks/useBackendStatus";
import { useGameLoop } from "./hooks/useGameLoop";
import { useHighScore } from "./hooks/useHighScore";

export default function App() {
  const { highScore, submitScore } = useHighScore();
  const backendStatus = useBackendStatus();
  // Tracks whether the score that just ended the run beat the previous
  // high score, captured at the moment of game over (submitScore updates
  // asynchronously via state, so we compare against a ref snapshot).
  const highScoreAtRunEnd = useRef(0);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      highScoreAtRunEnd.current = highScore;
      submitScore(finalScore);
    },
    [highScore, submitScore]
  );

  const { state, start, setHeld } = useGameLoop(handleGameOver);

  return (
    <div className="app">
      <div className="game-frame">
        {state.phase === "playing" && (
          <Hud
            score={state.score}
            highScore={highScore}
            difficultyLabel={state.difficultyLabel}
          />
        )}

        <PlayArea
          playerX={state.playerX}
          obstacles={state.obstacles}
          playerWidth={PLAYER_WIDTH_PERCENT}
          playerBottomOffset={PLAYER_BOTTOM_OFFSET_PERCENT}
        />

        {state.phase === "idle" && (
          <StartScreen
            highScore={highScore}
            backendStatus={backendStatus}
            onStart={start}
          />
        )}

        {state.phase === "gameover" && (
          <GameOverScreen
            score={state.score}
            highScore={Math.max(highScore, state.score)}
            isNewHighScore={state.score > highScoreAtRunEnd.current}
            onRestart={start}
          />
        )}

        {state.phase === "playing" && <MoveControls onHold={setHeld} />}
      </div>
    </div>
  );
}
