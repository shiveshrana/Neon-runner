import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLAYER_WIDTH_PERCENT } from "../constants";
import { useGameLoop } from "../hooks/useGameLoop";
import { installRafDriver } from "./rafDriver";

function mockFetchOk() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session_id: "test-session" }),
    })
  );
}

beforeEach(() => {
  mockFetchOk();
});

describe("useGameLoop", () => {
  it("moves the player left/right based on held keys", () => {
    const raf = installRafDriver();
    const onGameOver = vi.fn();
    const { result } = renderHook(() => useGameLoop(onGameOver));

    act(() => result.current.start());
    const startX = result.current.state.playerX;

    act(() => result.current.setHeld("right", true));
    act(() => raf.stepMany(0.1, 5));

    expect(result.current.state.playerX).toBeGreaterThan(startX);

    act(() => result.current.setHeld("right", false));
    act(() => result.current.setHeld("left", true));
    const beforeLeft = result.current.state.playerX;
    act(() => raf.stepMany(0.1, 5));

    expect(result.current.state.playerX).toBeLessThan(beforeLeft);
  });

  it("clamps the player within the play area bounds", () => {
    const raf = installRafDriver();
    const { result } = renderHook(() => useGameLoop(vi.fn()));

    act(() => result.current.start());
    act(() => result.current.setHeld("left", true));
    act(() => raf.stepMany(0.2, 50)); // plenty of time to hit the left wall

    expect(result.current.state.playerX).toBe(0);

    act(() => result.current.setHeld("left", false));
    act(() => result.current.setHeld("right", true));
    act(() => raf.stepMany(0.2, 50)); // plenty of time to hit the right wall

    expect(result.current.state.playerX).toBeCloseTo(100 - PLAYER_WIDTH_PERCENT, 5);
  });

  it("increases score over time while playing", () => {
    const raf = installRafDriver();
    const { result } = renderHook(() => useGameLoop(vi.fn()));

    act(() => result.current.start());
    expect(result.current.state.score).toBe(0);

    act(() => raf.stepMany(0.1, 10)); // 1 second of simulated play

    expect(result.current.state.score).toBeGreaterThan(0);
    expect(result.current.state.phase).toBe("playing");
  });

  it("ends the game and reports the score on collision", () => {
    const raf = installRafDriver();
    const onGameOver = vi.fn();
    // Force every obstacle to spawn at the far left edge (x = 0).
    vi.spyOn(Math, "random").mockReturnValue(0);

    const { result } = renderHook(() => useGameLoop(onGameOver));

    act(() => result.current.start());
    // Drive the player to the left wall so it lines up with x = 0 obstacles.
    act(() => result.current.setHeld("left", true));
    act(() => raf.stepMany(0.2, 20));
    act(() => result.current.setHeld("left", false));

    // Advance enough simulated time for a spawned obstacle to fall the
    // full height of the play area and collide with the stationary ship.
    act(() => raf.stepMany(0.1, 100));

    expect(result.current.state.phase).toBe("gameover");
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver.mock.calls[0][0]).toBe(result.current.state.score);

    vi.restoreAllMocks();
  });

  it("returns to the playing phase when restarted after game over", () => {
    const raf = installRafDriver();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useGameLoop(vi.fn()));

    act(() => result.current.start());
    act(() => result.current.setHeld("left", true));
    act(() => raf.stepMany(0.2, 20));
    act(() => result.current.setHeld("left", false));
    act(() => raf.stepMany(0.1, 100));
    expect(result.current.state.phase).toBe("gameover");

    act(() => result.current.start());

    expect(result.current.state.phase).toBe("playing");
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.obstacles).toHaveLength(0);

    vi.restoreAllMocks();
  });
});
