import { useCallback, useState } from "react";
import { HIGH_SCORE_STORAGE_KEY } from "../constants";

function readStoredHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    // localStorage can throw in some private-browsing modes - degrade
    // gracefully instead of crashing the game.
    return 0;
  }
}

export function useHighScore() {
  const [highScore, setHighScore] = useState<number>(readStoredHighScore);

  const submitScore = useCallback((score: number) => {
    setHighScore((prev) => {
      if (score <= prev) return prev;
      try {
        window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
      } catch {
        // Ignore write failures (e.g. storage disabled); the in-memory
        // value still updates for the rest of this session.
      }
      return score;
    });
  }, []);

  return { highScore, submitScore };
}
