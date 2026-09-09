// Base URL is configurable via VITE_API_URL so the same build can point
// at different backends per environment. Empty string means "same origin".
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * The game must remain playable even if the backend is unreachable -
 * these calls exist purely to feed the observability/GitOps demo, so
 * every failure is swallowed after a console warning rather than
 * surfaced to the player.
 */
export async function startGameSession(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/game/start`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`start failed: ${response.status}`);
    const data: { session_id: string } = await response.json();
    return data.session_id;
  } catch (error) {
    console.warn("Neon Runner: could not reach backend to start session", error);
    return null;
  }
}

export async function endGameSession(sessionId: string, score: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/game/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, score }),
    });
    if (!response.ok) throw new Error(`end failed: ${response.status}`);
  } catch (error) {
    console.warn("Neon Runner: could not reach backend to end session", error);
  }
}

/**
 * Lightweight connectivity check used only to show a small status
 * indicator - never blocks or delays gameplay either way.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
