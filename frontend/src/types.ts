export type GamePhase = "idle" | "playing" | "gameover";

export interface Obstacle {
  id: number;
  /** Horizontal position, 0-100, percent of play area width. */
  x: number;
  /** Vertical position, 0-100, percent of play area height. */
  y: number;
  /** Size as a percent of play area width (square obstacles). */
  size: number;
}

export interface Difficulty {
  label: "Easy" | "Medium" | "Hard";
  /** Obstacle fall speed, in percent-of-height per second. */
  obstacleSpeed: number;
  /** Average time between spawns, in seconds. */
  spawnInterval: number;
}
