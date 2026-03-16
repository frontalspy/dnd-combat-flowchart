import type { ConnectionLineComponentProps } from "@xyflow/react";
import React from "react";

function snapPoint(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  shiftHeld: boolean
): { x: number; y: number } {
  if (!shiftHeld) return { x: tx, y: ty };
  const dx = tx - fx;
  const dy = ty - fy;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const snap = Math.round(angle / 45) * 45;
  const rad = snap * (Math.PI / 180);
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    x: fx + Math.cos(rad) * length,
    y: fy + Math.sin(rad) * length,
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
  const snapped = snapPoint(fromX, fromY, toX, toY, shiftHeld);
  return (
    <g>
      <path
        d={`M${fromX},${fromY} L${snapped.x},${snapped.y}`}
        stroke="#b8901a"
        strokeWidth={2}
        fill="none"
        strokeDasharray={shiftHeld ? "5,3" : undefined}
      />
    </g>
  );
}
