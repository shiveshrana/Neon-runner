interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  onRestart,
}: GameOverScreenProps) {
  return (
    <div className="overlay" data-testid="gameover-screen">
      <h1 className="overlay__title overlay__title--danger">GAME OVER</h1>
      <p className="overlay__score">Score: {score}</p>
      {isNewHighScore ? (
        <p className="overlay__highscore overlay__highscore--new">New high score!</p>
      ) : (
        <p className="overlay__highscore">High Score: {highScore}</p>
      )}
      <button className="overlay__button" onClick={onRestart} autoFocus>
        Play Again
      </button>
    </div>
  );
}
