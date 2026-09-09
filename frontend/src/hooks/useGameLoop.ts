import { useCallback, useEffect, useRef, useState } from "react";
import { endGameSession, startGameSession } from "../api";
import {
  OBSTACLE_SIZE_PERCENT,
  PLAYER_BOTTOM_OFFSET_PERCENT,
  PLAYER_SPEED_PERCENT_PER_SEC,
  PLAYER_WIDTH_PERCENT,
  SCORE_PER_SECOND,
  getDifficulty,
} from "../constants";
import type { GamePhase, Obstacle } from "../types";

let nextObstacleId = 0;

interface GameLoopState {
  phase: GamePhase;
  playerX: number;
  obstacles: Obstacle[];
  score: number;
  difficultyLabel: string;
}

const INITIAL_PLAYER_X = 50 - PLAYER_WIDTH_PERCENT / 2;

export function useGameLoop(onGameOver: (finalScore: number) => void) {
  const [state, setState] = useState<GameLoopState>({
    phase: "idle",
    playerX: INITIAL_PLAYER_X,
    obstacles: [],
    score: 0,
    difficultyLabel: "Easy",
  });

  // Mutable, per-frame data lives in refs so the animation loop doesn't
  // need to depend on React state (and re-subscribe) every frame.
  const heldKeys = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const timeSinceSpawn = useRef(0);
  const nextSpawnDelay = useRef(1);
  const sessionId = useRef<string | null>(null);
  const runState = useRef({
    playerX: INITIAL_PLAYER_X,
    obstacles: [] as Obstacle[],
    score: 0,
  });

  const stopLoop = useCallback(() => {
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    lastTimestamp.current = null;
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimestamp.current === null) {
        lastTimestamp.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimestamp.current) / 1000, 0.05);
      lastTimestamp.current = timestamp;

      const run = runState.current;

      // --- Player movement ---
      let dx = 0;
      if (heldKeys.current.has("left")) dx -= 1;
      if (heldKeys.current.has("right")) dx += 1;
      run.playerX = Math.min(
        100 - PLAYER_WIDTH_PERCENT,
        Math.max(0, run.playerX + dx * PLAYER_SPEED_PERCENT_PER_SEC * dt)
      );

      // --- Score & difficulty ---
      run.score += SCORE_PER_SECOND * dt;
      const difficulty = getDifficulty(run.score);

      // --- Spawning ---
      timeSinceSpawn.current += dt;
      if (timeSinceSpawn.current >= nextSpawnDelay.current) {
        timeSinceSpawn.current = 0;
        // Small jitter so spawns don't feel metronomic.
        nextSpawnDelay.current = difficulty.spawnInterval * (0.7 + Math.random() * 0.6);
        run.obstacles.push({
          id: nextObstacleId++,
          x: Math.random() * (100 - OBSTACLE_SIZE_PERCENT),
          y: -OBSTACLE_SIZE_PERCENT,
          size: OBSTACLE_SIZE_PERCENT,
        });
      }

      // --- Move obstacles & drop off-screen ones ---
      run.obstacles = run.obstacles
        .map((obstacle) => ({
          ...obstacle,
          y: obstacle.y + difficulty.obstacleSpeed * dt,
        }))
        .filter((obstacle) => obstacle.y < 105);

      // --- Collision detection (simple AABB in percent-space) ---
      const playerTop = 100 - PLAYER_BOTTOM_OFFSET_PERCENT - PLAYER_WIDTH_PERCENT;
      const playerBottom = 100 - PLAYER_BOTTOM_OFFSET_PERCENT;
      const playerLeft = run.playerX;
      const playerRight = run.playerX + PLAYER_WIDTH_PERCENT;

      const hit = run.obstacles.some((obstacle) => {
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.size;
        const obstacleTop = obstacle.y;
        const obstacleBottom = obstacle.y + obstacle.size;
        return (
          obstacleLeft < playerRight &&
          obstacleRight > playerLeft &&
          obstacleTop < playerBottom &&
          obstacleBottom > playerTop
        );
      });

      if (hit) {
        const finalScore = Math.floor(run.score);
        stopLoop();
        setState((prev) => ({ ...prev, phase: "gameover", score: finalScore }));
        if (sessionId.current) {
          void endGameSession(sessionId.current, finalScore);
        }
        onGameOver(finalScore);
        return;
      }

      setState({
        phase: "playing",
        playerX: run.playerX,
        obstacles: run.obstacles,
        score: Math.floor(run.score),
        difficultyLabel: difficulty.label,
      });

      animationFrameId.current = requestAnimationFrame(tick);
    },
    [onGameOver, stopLoop]
  );

  const start = useCallback(() => {
    runState.current = { playerX: INITIAL_PLAYER_X, obstacles: [], score: 0 };
    timeSinceSpawn.current = 0;
    nextSpawnDelay.current = 1;
    sessionId.current = null;

    setState({
      phase: "playing",
      playerX: INITIAL_PLAYER_X,
      obstacles: [],
      score: 0,
      difficultyLabel: "Easy",
    });

    void startGameSession().then((id) => {
      sessionId.current = id;
    });

    stopLoop();
    animationFrameId.current = requestAnimationFrame(tick);
  }, [stopLoop, tick]);

  // --- Keyboard input ---
  useEffect(() => {
    const keyMap: Record<string, "left" | "right"> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = keyMap[event.key];
      if (direction) heldKeys.current.add(direction);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = keyMap[event.key];
      if (direction) heldKeys.current.delete(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Stop the animation loop on unmount.
  useEffect(() => stopLoop, [stopLoop]);

  const setHeld = useCallback((direction: "left" | "right", isHeld: boolean) => {
    if (isHeld) heldKeys.current.add(direction);
    else heldKeys.current.delete(direction);
  }, []);

  return { state, start, setHeld };
}
