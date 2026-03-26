import type { Node } from "@xyflow/react";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import type { Character, SavedFlowchart, SelectionGroup } from "../types";
import { encodeFlowchart, SHARE_PARAM } from "../utils/shareUrl";

interface UseChartPersistenceOptions {
  character: Character | null | undefined;
  activeChart: SavedFlowchart | undefined;
  activeTabId: string | null;
  chartName: string;
  selectionGroups: SelectionGroup[];
  flowDataRef: MutableRefObject<{ nodes: Node[]; edges: unknown[] }>;
  saveFlowchart: (chart: SavedFlowchart) => void;
}

/**
 * Handles save, share, and export actions. Tracks the transient `isSaved`
 * and `isCopied` flash states. Resets isSaved whenever the tab changes.
 */
export function useChartPersistence({
  character,
  activeChart,
  activeTabId,
  chartName,
  selectionGroups,
  flowDataRef,
  saveFlowchart,
}: UseChartPersistenceOptions) {
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync on tab switch only
  useEffect(() => {
    setIsSaved(false);
  }, [activeTabId]);

  const handleSave = useCallback(() => {
    if (!character) return;
    const id = activeChart?.id ?? activeTabId ?? `chart-${Date.now()}`;
    const chart: SavedFlowchart = {
      id,
      name: chartName,
      character,
      nodes: flowDataRef.current.nodes,
      edges: flowDataRef.current.edges,
      selectionGroups,
      createdAt: activeChart?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    saveFlowchart(chart);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [
    activeChart,
    activeTabId,
    character,
    chartName,
    flowDataRef,
    saveFlowchart,
    selectionGroups,
  ]);

  const handleShare = useCallback(() => {
    if (!character) return;
    const id = activeChart?.id ?? activeTabId ?? `chart-${Date.now()}`;
    const chart: SavedFlowchart = {
      id,
      name: chartName,
      character,
      nodes: flowDataRef.current.nodes,
      edges: flowDataRef.current.edges,
      selectionGroups,
      createdAt: activeChart?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    const encoded = encodeFlowchart(chart);
    const url = `${window.location.origin}${window.location.pathname}?${SHARE_PARAM}=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [
    activeChart,
    activeTabId,
    character,
    chartName,
    flowDataRef,
    selectionGroups,
  ]);

  return { isSaved, setIsSaved, isCopied, handleSave, handleShare };
}
