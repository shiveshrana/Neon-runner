import { BackendStatusBadge } from "./BackendStatusBadge";
import type { BackendStatus } from "../hooks/useBackendStatus";

interface StartScreenProps {
  highScore: number;
  backendStatus: BackendStatus;
  onStart: () => void;
}

export function StartScreen({ highScore, backendStatus, onStart }: StartScreenProps) {
  return (
    <div className="overlay" data-testid="start-screen">
      <h1 className="overlay__title">NEON RUNNER</h1>
      <p className="overlay__subtitle">Dodge the asteroid field. Survive as long as you can.</p>
      {highScore > 0 && (
        <p className="overlay__highscore">Best run: {highScore}</p>
      )}
      <button className="overlay__button" onClick={onStart} autoFocus>
        Start Game
      </button>
      <p className="overlay__hint">← / → or A / D to move</p>
      <BackendStatusBadge status={backendStatus} />
    </div>
  );
}
