import React from "react";

type HudBar = { id: string; label: string; value: number };

export function HudBars({ bars }: { bars: HudBar[] }) {
  return (
    <div className="hud">
      {bars.map((bar) => {
        const clamped = Math.max(0, Math.min(100, bar.value));
        return (
          <div key={bar.id} className="hud-bar">
            <div className="hud-label">
              <span>{bar.label}</span>
              <span className="hud-value">{bar.value}</span>
            </div>
            <div className="hud-track">
              <div className="hud-fill" style={{ width: `${clamped}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
