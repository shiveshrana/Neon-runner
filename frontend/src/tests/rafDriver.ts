import { vi } from "vitest";

/**
 * Replaces window.requestAnimationFrame with a manually-steppable driver
 * so game-loop tests can advance by an exact, known delta-time per frame
 * instead of depending on real wall-clock timing.
 */
export function installRafDriver() {
  let queuedCallback: FrameRequestCallback | null = null;
  let currentTime = 0;

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    queuedCallback = callback;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    queuedCallback = null;
  });

  return {
    /** Runs the queued frame, advancing the clock by `deltaSeconds`. */
    step(deltaSeconds: number) {
      currentTime += deltaSeconds * 1000;
      const callback = queuedCallback;
      queuedCallback = null;
      callback?.(currentTime);
    },
    /** Convenience: step several frames of a fixed size. */
    stepMany(deltaSeconds: number, count: number) {
      for (let i = 0; i < count; i++) this.step(deltaSeconds);
    },
  };
}
