import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Position,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useState } from "react";
import styles from "./BundleEdge.module.css";

interface BundleMemberInfo {
  id: string;
  sourceLabel: string;
  targetLabel: string;
}

interface BundleEdgeData {
  memberEdges: BundleMemberInfo[];
  memberEdgeIds: string[];
  memberNodeIds: string[];
}

export function BundleEdge({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const { setNodes } = useReactFlow();
  const [showTooltip, setShowTooltip] = useState(false);

  const bundleData = data as BundleEdgeData | undefined;
  const count = bundleData?.memberEdges?.length ?? 2;
  const memberNodeIds = bundleData?.memberNodeIds ?? [];

  const [path, midX, midY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition ?? Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition ?? Position.Top,
    borderRadius: 0,
  });

  const handleClick = useCallback(() => {
    if (memberNodeIds.length === 0) return;
    const nodeIdSet = new Set(memberNodeIds);
    setNodes((nds) =>
      nds.map((n) => ({ ...n, selected: nodeIdSet.has(n.id) }))
    );
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((n) => (nodeIdSet.has(n.id) ? { ...n, selected: false } : n))
      );
    }, 800);
  }, [memberNodeIds, setNodes]);

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={styles.bundleBadgeWrapper}
          style={{
            transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)`,
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={handleClick}
          role="button"
          tabIndex={-1}
          aria-label={`Bundle of ${count} edges — click to highlight nodes`}
        >
          <span className={styles.bundleBadge}>×{count}</span>
          {showTooltip &&
            bundleData?.memberEdges &&
            bundleData.memberEdges.length > 0 && (
              <div className={styles.bundleTooltip}>
                {bundleData.memberEdges.map((me) => (
                  <div key={me.id} className={styles.bundleTooltipItem}>
                    {me.sourceLabel} → {me.targetLabel}
                  </div>
                ))}
              </div>
            )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
