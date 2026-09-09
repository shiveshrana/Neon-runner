import { useEffect, useState } from "react";
import { checkBackendHealth } from "../api";

export type BackendStatus = "checking" | "online" | "offline";

const POLL_INTERVAL_MS = 15_000;

/**
 * Polls /health in the background so the UI can show a small "is the
 * backend reachable" indicator. This is purely informational - the
 * game itself never depends on it.
 */
export function useBackendStatus(): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const healthy = await checkBackendHealth();
      if (!cancelled) setStatus(healthy ? "online" : "offline");
    };

    void poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return status;
}
