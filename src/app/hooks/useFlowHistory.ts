import type { Edge, Node } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef } from "react";

interface UseFlowHistoryOptions {
  initialNodes: Node[];
  initialEdges: Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  getNodes: () => Node[];
  getEdges: () => Edge[];
}

export function useFlowHistory({
  initialNodes,
  initialEdges,
  setNodes,
  setEdges,
  getNodes,
  getEdges,
}: UseFlowHistoryOptions) {
  const historyRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([
    { nodes: initialNodes, edges: initialEdges },
  ]);
  const historyCursorRef = useRef(0);
  const isHistoryActionRef = useRef(false);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSnapshot = useCallback(() => {
    if (isHistoryActionRef.current) return;
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => {
      const snap = { nodes: getNodes(), edges: getEdges() };
      historyRef.current = historyRef.current.slice(
        0,
        historyCursorRef.current + 1
      );
      historyRef.current.push(snap);
      if (historyRef.current.length > 50) historyRef.current.shift();
      historyCursorRef.current = historyRef.current.length - 1;
    }, 300);
  }, [getNodes, getEdges]);

  /** Take an immediate snapshot of the current state (before an edit commit). */
  const takeSnapshot = useCallback(() => {
    if (isHistoryActionRef.current) return;
    if (snapshotTimerRef.current) {
      clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    const snap = { nodes: getNodes(), edges: getEdges() };
    historyRef.current = historyRef.current.slice(
      0,
      historyCursorRef.current + 1
    );
    historyRef.current.push(snap);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyCursorRef.current = historyRef.current.length - 1;
  }, [getNodes, getEdges]);

  const handleUndo = useCallback(() => {
    if (historyCursorRef.current <= 0) return;
    isHistoryActionRef.current = true;
    historyCursorRef.current--;
    const snap = historyRef.current[historyCursorRef.current];
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 0);
  }, [setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyCursorRef.current >= historyRef.current.length - 1) return;
    isHistoryActionRef.current = true;
    historyCursorRef.current++;
    const snap = historyRef.current[historyCursorRef.current];
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 0);
  }, [setNodes, setEdges]);

  return {
    scheduleSnapshot,
    takeSnapshot,
    handleUndo,
    handleRedo,
    snapshotTimerRef,
  };
}
