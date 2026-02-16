import React from "react";

export const SNAKE_PATH_CELLS = 12;

export function SnakePathBoard({ currentIndex }: { currentIndex: number }) {
  const index = Math.max(0, Math.min(SNAKE_PATH_CELLS - 1, currentIndex));

  return (
    <div className="snake-path-board" role="img" aria-label={`旅程進度：第 ${index + 1} 格`}>
      <div className="snake-path-track">
        {Array.from({ length: SNAKE_PATH_CELLS }, (_, i) => (
          <div
            key={i}
            className={`snake-path-cell ${i === index ? "snake-path-cell-current" : ""} ${i < index ? "snake-path-cell-done" : ""}`}
          >
            {i === index && <span className="snake-path-token" aria-hidden>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
