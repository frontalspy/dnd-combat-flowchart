import type { ConnectionLineComponentProps } from "@xyflow/react";
import React from "react";

export function SnappedConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  // Build a step path matching the default "step" edge style:
  // go horizontally to the midpoint X, then vertically to toY, then horizontally to toX
  const midY = (fromY + toY) / 2;
  const d = `M${fromX},${fromY} L${fromX},${midY} L${toX},${midY} L${toX},${toY}`;

  return (
    <g>
      <path
        d={d}
        stroke="#b8901a"
        strokeWidth={2}
        fill="none"
        strokeDasharray="5 3"
      />
    </g>
  );
}
