import { BaseEdge, type EdgeProps, getStraightPath } from "@xyflow/react";
import React from "react";

export function SnappedEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const snappedAngle = Math.round(angle / 45) * 45;
  const rad = snappedAngle * (Math.PI / 180);
  const length = Math.sqrt(dx * dx + dy * dy);
  const tx = sourceX + Math.cos(rad) * length;
  const ty = sourceY + Math.sin(rad) * length;

  const [path] = getStraightPath({
    sourceX,
    sourceY,
    targetX: tx,
    targetY: ty,
  });

  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}
