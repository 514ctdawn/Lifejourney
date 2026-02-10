import React, { useRef, useState } from "react";

type WheelSegment = { id: string; label: string };

const SEGMENT_COLORS = ["#ffe57a", "#ffb74d", "#81c784", "#64b5f6", "#ba68c8", "#ff8a65"];
const FULL_TURNS = 5;
const SEGMENT_DEG = 360 / 6;

export function LifeWheel({
  segments,
  onSpin,
  lastRoll,
}: {
  segments: WheelSegment[];
  onSpin: () => number;
  lastRoll: number | null;
}) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const rotationRef = useRef(0);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const result = onSpin();
    const extraTurns = FULL_TURNS * 360;
    const currentRest = ((rotationRef.current % 360) + 360) % 360;
    const targetRest = (result - 1) * SEGMENT_DEG;
    const delta = (targetRest - currentRest + 360) % 360;
    const totalRotation = rotationRef.current + extraTurns + delta;
    rotationRef.current = totalRotation;
    setRotation(totalRotation);
    setTimeout(() => setIsSpinning(false), 3500);
  };

  return (
    <div className="life-wheel">
      <div className="wheel-disk-wrapper">
        <div className="wheel-pointer" aria-hidden />
        <div
          className="wheel-disk"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? `transform 3.5s cubic-bezier(0.2, 0.8, 0.2, 1)` : "none",
          }}
        >
          <div
            className="wheel-disk-segments"
            style={{
              background: `conic-gradient(
                ${SEGMENT_COLORS[0]} 0deg 60deg,
                ${SEGMENT_COLORS[1]} 60deg 120deg,
                ${SEGMENT_COLORS[2]} 120deg 180deg,
                ${SEGMENT_COLORS[3]} 180deg 240deg,
                ${SEGMENT_COLORS[4]} 240deg 300deg,
                ${SEGMENT_COLORS[5]} 300deg 360deg
              )`,
            }}
          />
        </div>
      </div>
      <button
        className="btn btn-primary wheel-spin-btn"
        onClick={handleSpin}
        disabled={isSpinning}
      >
        {isSpinning ? "Spinning…" : "Spin Life Wheel"}
      </button>
      <div className="wheel-result">
        {lastRoll ? `Rolled: ${lastRoll}` : "Ready to spin"}
      </div>
    </div>
  );
}
