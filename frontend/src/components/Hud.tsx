interface HudProps {
  score: number;
  highScore: number;
  difficultyLabel: string;
}

export function Hud({ score, highScore, difficultyLabel }: HudProps) {
  return (
    <div className="hud" data-testid="hud">
      <div className="hud__stat">
        <span className="hud__label">Score</span>
        <span className="hud__value" data-testid="score">
          {score}
        </span>
      </div>
      <div className="hud__stat hud__stat--difficulty">
        <span className="hud__label">Difficulty</span>
        <span className={`hud__pill hud__pill--${difficultyLabel.toLowerCase()}`}>
          {difficultyLabel}
        </span>
      </div>
      <div className="hud__stat hud__stat--right">
        <span className="hud__label">High Score</span>
        <span className="hud__value" data-testid="high-score">
          {highScore}
        </span>
      </div>
    </div>
  );
}
