import type { ConnectionLineComponentProps } from "@xyflow/react";
import React from "react";

// Automatically snap when within this many degrees of a 45° multiple.
const SNAP_TOLERANCE_DEG = 0;

function snapPoint(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  shiftHeld: boolean
): { x: number; y: number; snapped: boolean } {
  const dx = tx - fx;
  const dy = ty - fy;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const snappedAngle = Math.round(angle / 45) * 45;
  // Angular distance to the nearest 45° multiple is always ≤ 22.5°
  const diff = Math.abs(angle - snappedAngle);
  const shouldSnap = shiftHeld || diff <= SNAP_TOLERANCE_DEG;
  if (!shouldSnap) return { x: tx, y: ty, snapped: false };
  const rad = snappedAngle * (Math.PI / 180);
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    x: fx + Math.cos(rad) * length,
    y: fy + Math.sin(rad) * length,
    snapped: true,
  };
}

export function SnappedConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  const shiftHeld =
    (window as Window & { __shiftHeld?: boolean }).__shiftHeld ?? false;
  const result = snapPoint(fromX, fromY, toX, toY, shiftHeld);
  // Expose snapped state so onConnect can decide the edge type.
  (window as Window & { __angleSnapped?: boolean }).__angleSnapped =
    result.snapped;
  return (
    <g>
      <path
        d={`M${fromX},${fromY} L${result.x},${result.y}`}
        stroke="#b8901a"
        strokeWidth={2}
        fill="none"
        strokeDasharray={result.snapped ? "5,3" : undefined}
      />
    </g>
  );
}
