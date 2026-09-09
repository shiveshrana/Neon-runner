import type { Obstacle } from "../types";

interface PlayAreaProps {
  playerX: number;
  obstacles: Obstacle[];
  playerWidth: number;
  playerBottomOffset: number;
}

export function PlayArea({
  playerX,
  obstacles,
  playerWidth,
  playerBottomOffset,
}: PlayAreaProps) {
  return (
    <div className="play-area" data-testid="play-area">
      <div className="play-area__starfield" aria-hidden="true" />
      <div
        className="ship"
        data-testid="ship"
        style={{
          left: `${playerX}%`,
          bottom: `${playerBottomOffset}%`,
          width: `${playerWidth}%`,
        }}
      >
        <div className="ship__engine" aria-hidden="true" />
      </div>
      {obstacles.map((obstacle) => (
        <div
          key={obstacle.id}
          className="asteroid"
          data-testid="obstacle"
          style={{
            left: `${obstacle.x}%`,
            top: `${obstacle.y}%`,
            width: `${obstacle.size}%`,
            height: `${obstacle.size}%`,
          }}
        />
      ))}
    </div>
  );
}
