import type { BackendStatus } from "../hooks/useBackendStatus";

interface BackendStatusBadgeProps {
  status: BackendStatus;
}

const LABEL: Record<BackendStatus, string> = {
  checking: "Checking API…",
  online: "API online",
  offline: "Offline mode",
};

export function BackendStatusBadge({ status }: BackendStatusBadgeProps) {
  return (
    <div
      className={`backend-status backend-status--${status}`}
      data-testid="backend-status"
      title={
        status === "offline"
          ? "Backend unreachable - the game still works, stats just won't be recorded."
          : undefined
      }
    >
      <span className="backend-status__dot" aria-hidden="true" />
      {LABEL[status]}
    </div>
  );
}
