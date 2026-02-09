import React from "react";

type WheelSegment = { id: string; label: string };

export function LifeWheel({
  segments,
  onSpin,
  lastRoll,
}: {
  segments: WheelSegment[];
  onSpin: () => number;
  lastRoll: number | null;
}) {
  return (
    <div className="life-wheel">
      <div className="wheel-ring">
        {segments.map((segment, index) => (
          <div key={segment.id} className="wheel-segment">
            {segment.label}
          </div>
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          onSpin();
        }}
      >
        Spin Life Wheel
      </button>
      <div className="wheel-result">
        {lastRoll ? `Rolled: ${lastRoll}` : "Ready to spin"}
      </div>
    </div>
  );
}
