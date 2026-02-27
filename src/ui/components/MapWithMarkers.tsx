import React, { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

// Fixed black-line "Z" path (percent positions in map space).
const PATH: Point[] = [
  { x: 55, y: 15 },
  { x: 10, y: 55 },
  { x: 58, y: 88 },
  { x: 58, y: 95 },
];

// Max progress index (0 = start, 50 = end). Game uses 50 turns → progress 0..50.
export const MAX_PROGRESS_INDEX = 50;
const MOVE_SPEED = 0.08; // Lower = slower/smoother (% map units per frame)

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

function pointAtProgress(path: Point[], t: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];
  const clampedT = Math.max(0, Math.min(1, t));

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const len = Math.hypot(dx, dy);
    segmentLengths.push(len);
    totalLength += len;
  }
  if (totalLength <= 1e-6) return path[path.length - 1];

  let remainingDistance = clampedT * totalLength;
  let i = 0;
  while (i < segmentLengths.length - 1 && remainingDistance > segmentLengths[i]) {
    remainingDistance -= segmentLengths[i];
    i += 1;
  }

  const a = path[i];
  const b = path[i + 1] ?? a;
  const segmentLength = segmentLengths[i] || 1;
  const segT = Math.max(0, Math.min(1, remainingDistance / segmentLength));

  return {
    x: a.x + (b.x - a.x) * segT,
    y: a.y + (b.y - a.y) * segT,
  };
}

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
  const [targetPosition, setTargetPosition] = useState<Point>(START);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dotRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);
  const dotPositionRef = useRef<Point>(START);

  // Map progressIndex 0..MAX_PROGRESS_INDEX to position along fixed black-line PATH.
  useEffect(() => {
    if (typeof progressIndex !== "number") return;
    const t = Math.max(0, Math.min(1, progressIndex / MAX_PROGRESS_INDEX));
    setTargetPosition(pointAtProgress(PATH, t));
    const timer = setTimeout(() => {
      dotRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 520);
    return () => clearTimeout(timer);
  }, [progressIndex]);

  // Animate marker toward target using map-percentage units, independent of screen size.
  useEffect(() => {
    if (isDragging) return;
    let raf = 0;
    const step = () => {
      const prev = dotPositionRef.current;
      const dx = targetPosition.x - prev.x;
      const dy = targetPosition.y - prev.y;
      const dist = Math.hypot(dx, dy);

      if (dist < MOVE_SPEED) {
        dotPositionRef.current = targetPosition;
        setDotPosition(targetPosition);
        return;
      }

      const ratio = MOVE_SPEED / dist;
      const next: Point = {
        x: prev.x + dx * ratio,
        y: prev.y + dy * ratio,
      };
      dotPositionRef.current = next;
      setDotPosition(next);
      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [targetPosition, isDragging]);

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
      dotPositionRef.current = snapped;
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
            style={{ left: `${dotPosition.x}%`, top: `${dotPosition.y}%`, transform: "translate(-50%, -100%)" }}
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
