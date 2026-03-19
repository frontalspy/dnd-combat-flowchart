import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getStraightPath,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SnappedEdge.module.css";

interface EdgeData {
  label?: string;
}

interface EdgeLabelPillProps {
  x: number;
  y: number;
  label: string;
  edgeId: string;
}

function EdgeLabelPill({ x, y, label, edgeId }: EdgeLabelPillProps) {
  const { updateEdgeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value when label changes externally (e.g. undo/redo)
  useEffect(() => {
    if (!editing) setValue(label);
  }, [label, editing]);

  const commit = useCallback(() => {
    setEditing(false);
    updateEdgeData(edgeId, { label: value });
  }, [edgeId, value, updateEdgeData]);

  const cancel = useCallback(() => {
    setValue(label);
    setEditing(false);
  }, [label]);

  return (
    <div
      className={styles.labelPillWrapper}
      style={{
        transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          className={styles.labelInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          size={Math.max(value.length, 4)}
        />
      ) : (
        <span
          className={`${styles.labelPill}${label ? "" : ` ${styles.emptyPill}`}`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setValue(label);
            setEditing(true);
          }}
        >
          {label || "+"}
        </span>
      )}
    </div>
  );
}

export function SnappedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
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

  const midX = (sourceX + tx) / 2;
  const midY = (sourceY + ty) / 2;
  const label = (data as EdgeData)?.label ?? "";

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <EdgeLabelPill x={midX} y={midY} label={label} edgeId={id} />
      </EdgeLabelRenderer>
    </>
  );
}
