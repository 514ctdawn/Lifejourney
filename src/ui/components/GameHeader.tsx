import React from "react";

type HeaderBar = { id: string; label: string; value: number; type: "money" | "progress" };

export function GameHeader({ bars }: { bars: HeaderBar[] }) {
  return (
    <header className="game-header" role="banner">
      <div className="game-header-inner">
        {bars.map((bar) => {
          if (bar.type === "money") {
            return (
              <div key={bar.id} className="game-header-stat game-header-money">
                <span className="game-header-icon" aria-hidden>$</span>
                <span className="game-header-value">{bar.value}</span>
              </div>
            );
          }
          const clamped = Math.max(0, Math.min(100, bar.value));
          const isStress = bar.id === "stress";
          return (
            <div key={bar.id} className="game-header-stat game-header-progress">
              <span className="game-header-icon" aria-hidden>
                {isStress ? "%" : "☺"}
              </span>
              <div className="game-header-progress-wrap">
                <div
                  className={`game-header-progress-fill ${isStress ? "game-header-stress" : "game-header-happiness"}`}
                  style={{ width: `${clamped}%` }}
                />
              </div>
              <span className="game-header-value game-header-value-small">{bar.value}</span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
