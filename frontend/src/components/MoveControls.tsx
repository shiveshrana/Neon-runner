import type { PointerEvent } from "react";

interface MoveControlsProps {
  onHold: (direction: "left" | "right", isHeld: boolean) => void;
}

export function MoveControls({ onHold }: MoveControlsProps) {
  // Pointer events cover both touch and mouse, and let us release the
  // hold if the finger/cursor slides off the button.
  const bind = (direction: "left" | "right") => ({
    onPointerDown: (event: PointerEvent) => {
      event.preventDefault();
      onHold(direction, true);
    },
    onPointerUp: () => onHold(direction, false),
    onPointerLeave: () => onHold(direction, false),
    onPointerCancel: () => onHold(direction, false),
  });

  return (
    <div className="move-controls" data-testid="move-controls">
      <button
        className="move-controls__button"
        aria-label="Move left"
        {...bind("left")}
      >
        ←
      </button>
      <span className="move-controls__label">MOVE</span>
      <button
        className="move-controls__button"
        aria-label="Move right"
        {...bind("right")}
      >
        →
      </button>
    </div>
  );
}
