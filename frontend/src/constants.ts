import type { Difficulty } from "./types";

// Score thresholds and per-tier tuning, straight from the game design brief.
export const DIFFICULTY_TIERS: { minScore: number; difficulty: Difficulty }[] = [
  {
    minScore: 0,
    difficulty: { label: "Easy", obstacleSpeed: 22, spawnInterval: 1.1 },
  },
  {
    minScore: 500,
    difficulty: { label: "Medium", obstacleSpeed: 34, spawnInterval: 0.75 },
  },
  {
    minScore: 1500,
    difficulty: { label: "Hard", obstacleSpeed: 48, spawnInterval: 0.45 },
  },
];

export function getDifficulty(score: number): Difficulty {
  let current = DIFFICULTY_TIERS[0].difficulty;
  for (const tier of DIFFICULTY_TIERS) {
    if (score >= tier.minScore) current = tier.difficulty;
  }
  return current;
}

export const PLAYER_WIDTH_PERCENT = 9;
export const PLAYER_SPEED_PERCENT_PER_SEC = 65; // normal, constant player speed
export const OBSTACLE_SIZE_PERCENT = 7;
export const SCORE_PER_SECOND = 100;
export const PLAYER_BOTTOM_OFFSET_PERCENT = 6;

export const HIGH_SCORE_STORAGE_KEY = "neon-runner-high-score";
