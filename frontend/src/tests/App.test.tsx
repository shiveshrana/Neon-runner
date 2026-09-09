import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session_id: "test-session" }),
    })
  );
  window.localStorage.clear();
});

describe("App", () => {
  it("loads showing the start screen", async () => {
    render(<App />);
    expect(screen.getByText("NEON RUNNER")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
    // Let the background health check settle so it doesn't leak an
    // unwrapped state update into the next test.
    await waitFor(() => expect(screen.getByTestId("backend-status")).toBeInTheDocument());
  });

  it("starts the game and shows the HUD and ship", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start game/i }));

    expect(screen.getByTestId("hud")).toBeInTheDocument();
    expect(screen.getByTestId("ship")).toBeInTheDocument();
    expect(screen.getByTestId("score")).toHaveTextContent("0");
  });

  it("shows the backend as online once the health check succeeds", async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByTestId("backend-status")).toHaveTextContent(/api online/i)
    );
  });

  it("falls back to offline mode without blocking the game when the backend is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId("backend-status")).toHaveTextContent(/offline mode/i)
    );

    // The game must still be fully playable even with no backend.
    await user.click(screen.getByRole("button", { name: /start game/i }));
    expect(screen.getByTestId("hud")).toBeInTheDocument();
  });
});
