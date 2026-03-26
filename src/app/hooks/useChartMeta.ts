import { useEffect, useState } from "react";
import type { SavedFlowchart } from "../types";

/**
 * Manages the chart name and inline-edit state for the current tab.
 * Syncs name back to the active chart's name whenever the tab changes.
 */
export function useChartMeta(
  activeChart: SavedFlowchart | undefined,
  activeTabId: string | null
) {
  const [chartName, setChartName] = useState(
    activeChart?.name ?? "My Combat Flow"
  );
  const [editingName, setEditingName] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync on tab switch only, not on every chart data change
  useEffect(() => {
    setChartName(activeChart?.name ?? "My Combat Flow");
    setEditingName(false);
  }, [activeTabId]);

  return { chartName, setChartName, editingName, setEditingName };
}
