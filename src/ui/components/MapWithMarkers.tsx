import React, { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

// Path as percentage (0–100): start (green flag) mid-left, end (red flag) upper-right
const PATH: Point[] = [
  { x: 20, y: 50 }, // index 0 → GREEN FLAG
  { x: 60, y: 45 },
  { x: 67, y: 40 },
  { x: 74, y: 34 },
  { x: 78, y: 30 },
  { x: 82, y: 31 }, // last index → RED FLAG
];

// Export length so game logic can move along the path by index
export const PATH_LENGTH = PATH.length;

function nearestPointOnPath(path: Point[], p: Point): Point {
  let best: Point = path[0];
  let bestDist = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const t = Math.max(0, Math.min(1, projectSegment(a, b, p)));
    const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = q;
    }
  }
  return best;
}

function projectSegment(a: Point, b: Point, p: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy || 1e-6;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
  return t;
}

const START = PATH[0];
const END = PATH[PATH.length - 1];

function FlagIcon({ type }: { type: "start" | "end" }) {
  const color = type === "start" ? "#22c55e" : "#ef4444";
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className={`map-flag map-flag-${type}`}>
      <rect x="10" y="2" width="2" height="20" rx="1" fill="#78350f" stroke="#1f1f2a" strokeWidth="1" />
      <path d="M12 4 L22 10 L12 16 Z" fill={color} stroke="#1f1f2a" strokeWidth="1" />
    </svg>
  );
}

export function MapWithMarkers({
  src,
  alt,
  onError,
  progressIndex,
}: {
  src: string;
  alt: string;
  onError?: () => void;
  /** Optional: discrete progress along PATH (0 … PATH_LENGTH-1) */
  progressIndex?: number;
}) {
  const [dotPosition, setDotPosition] = useState<Point>(START);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dotRef = useRef<HTMLDivElement>(null);

  // When game advances along the path, animate dot to new position then scroll into view.
  useEffect(() => {
    if (typeof progressIndex !== "number") return;
    const idx = Math.max(0, Math.min(PATH.length - 1, progressIndex));
    const target = PATH[idx];
    setDotPosition(target);
    const t = setTimeout(() => {
      dotRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 520);
    return () => clearTimeout(t);
  }, [progressIndex]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const snapped = nearestPointOnPath(PATH, { x, y });
      setDotPosition(snapped);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return (
    <div className="map-image-wrapper" ref={containerRef}>
      <img
        className="map-image"
        src={src}
        alt={alt}
        onError={onError}
      />
      <div className="map-overlay" aria-hidden>
        <div
          className="map-flag-wrap map-flag-start"
          style={{ left: `${START.x}%`, top: `${START.y}%` }}
          title="起點"
        >
          <FlagIcon type="start" />
        </div>
        <div
          className="map-flag-wrap map-flag-end"
          style={{ left: `${END.x}%`, top: `${END.y}%` }}
          title="終點"
        >
          <FlagIcon type="end" />
        </div>
        <div
          ref={dotRef}
          className={`map-dot ${isDragging ? "map-dot-dragging" : ""}`}
          style={{ left: `${dotPosition.x}%`, top: `${dotPosition.y}%`, transform: "translate(-50%, -50%)" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="button"
          tabIndex={0}
          title="沿路徑拖動"
          aria-label="沿路徑移動標記"
        />
      </div>
    </div>
  );
}
