import type { ConnectionLineComponentProps } from "@xyflow/react";
import React from "react";

export function SnappedConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
}: ConnectionLineComponentProps) {
  return (
    <g>
      <path
        d={`M${fromX},${fromY} L${toX},${toY}`}
        stroke="#b8901a"
        strokeWidth={2}
        fill="none"
      />
    </g>
  );
}
