import React, { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

// Path as percentage (0–100): start (green flag) mid-left, end (red flag) upper-right
const PATH: Point[] = [
  { x: 50, y: 20 }, // index 0 → GREEN FLAG
  { x: 60, y: 45 },
  { x: 67, y: 40 },
  { x: 74, y: 34 },
  { x: 78, y: 30 },
  { x: 75, y: 82 }, // last index → RED FLAG
];

// Max progress index (0 = start, 50 = end). Game uses 50 turns → progress 0..50.
export const MAX_PROGRESS_INDEX = 50;

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
  markerSprite,
}: {
  src: string;
  alt: string;
  onError?: () => void;
  /** Optional: progress 0..MAX_PROGRESS_INDEX (0 = start, 50 = end) */
  progressIndex?: number;
  /** Optional: custom sprite image for the moving dot */
  markerSprite?: string;
}) {
  const [dotPosition, setDotPosition] = useState<Point>(START);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dotRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);

  // Map progressIndex 0..MAX_PROGRESS_INDEX to position along PATH (interpolate between 6 points).
  useEffect(() => {
    if (typeof progressIndex !== "number") return;
    const t = Math.max(0, Math.min(1, progressIndex / MAX_PROGRESS_INDEX));
    const seg = t * (PATH.length - 1);
    const i = Math.floor(seg);
    const j = Math.min(i + 1, PATH.length - 1);
    const f = seg - i;
    const target: Point = {
      x: PATH[i].x + f * (PATH[j].x - PATH[i].x),
      y: PATH[i].y + f * (PATH[j].y - PATH[i].y),
    };
    setDotPosition(target);
    const timer = setTimeout(() => {
      dotRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 520);
    return () => clearTimeout(timer);
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
          className="map-flag-wrap map-flag-end"
          style={{ left: `${END.x}%`, top: `${END.y}%` }}
          title="終點"
        >
          <FlagIcon type="end" />
        </div>
        {markerSprite ? (
          <div
            ref={dotRef as React.MutableRefObject<HTMLDivElement | null>}
            className={`map-dot-sprite-wrap ${isDragging ? "map-dot-dragging" : ""}`}
            style={{ left: `${dotPosition.x}%`, top: `${dotPosition.y}%` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img src={markerSprite} alt="玩家位置" className="map-dot-sprite" />
          </div>
        ) : (
          <div
            ref={dotRef as React.MutableRefObject<HTMLDivElement | null>}
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
        )}
      </div>
    </div>
  );
}
