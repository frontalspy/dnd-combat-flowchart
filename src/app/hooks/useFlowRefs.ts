import type { Node } from "@xyflow/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { FlowCanvasExports, SavedFlowchart } from "../types";

/**
 * Owns the stable refs for the FlowCanvas export API and live flow data,
 * and manages the selected-nodes list. Syncs refs and clears selection on
 * tab change.
 */
export function useFlowRefs(
  activeChart: SavedFlowchart | undefined,
  activeTabId: string | null
) {
  const exportFnsRef = useRef<FlowCanvasExports | null>(null);
  const flowDataRef = useRef<{ nodes: Node[]; edges: unknown[] }>({
    nodes: (activeChart?.nodes ?? []) as Node[],
    edges: activeChart?.edges ?? [],
  });
  // Kept in a ref so the keyboard shortcut closure always reads the latest list
  const selectedNodesRef = useRef<Node[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  // Keep flowDataRef current when the active chart's saved data changes
  useEffect(() => {
    flowDataRef.current = {
      nodes: (activeChart?.nodes ?? []) as Node[],
      edges: activeChart?.edges ?? [],
    };
  }, [activeChart?.nodes, activeChart?.edges]);

  // Mirror selectedNodes into the ref for closure-safe reads
  useEffect(() => {
    selectedNodesRef.current = selectedNodes;
  }, [selectedNodes]);

  // Clear selection whenever the user switches tabs
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync on tab switch only
  useEffect(() => {
    setSelectedNodes([]);
  }, [activeTabId]);

  const handleDragStart = useCallback((e: React.DragEvent, data: unknown) => {
    e.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleExportReady = useCallback((fns: FlowCanvasExports) => {
    exportFnsRef.current = fns;
  }, []);

  const handleTouchDrop = useCallback(
    (clientX: number, clientY: number, data: unknown) => {
      exportFnsRef.current?.dropAtPosition(clientX, clientY, data);
    },
    []
  );

  return {
    exportFnsRef,
    flowDataRef,
    selectedNodes,
    setSelectedNodes,
    selectedNodesRef,
    handleDragStart,
    handleExportReady,
    handleTouchDrop,
  };
}
