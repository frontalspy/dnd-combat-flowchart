import type { Node } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import type { SavedFlowchart, SelectionGroup } from "../types";

/**
 * Manages selection groups: create, disband, rename, remove-member, and
 * pruning deleted nodes. Syncs from the active chart on tab change.
 */
export function useSelectionGroups(
  activeChart: SavedFlowchart | undefined,
  activeTabId: string | null
) {
  const [selectionGroups, setSelectionGroups] = useState<SelectionGroup[]>(
    () => activeChart?.selectionGroups ?? []
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync on tab switch only, not on every chart data change
  useEffect(() => {
    setSelectionGroups(activeChart?.selectionGroups ?? []);
  }, [activeTabId]);

  const createGroup = useCallback((nodeIds: string[], name: string) => {
    setSelectionGroups((prev) => {
      const cleaned = prev
        .map((g) => ({
          ...g,
          nodeIds: g.nodeIds.filter((id) => !nodeIds.includes(id)),
        }))
        .filter((g) => g.nodeIds.length >= 2);
      return [...cleaned, { id: `sg-${Date.now()}`, label: name, nodeIds }];
    });
  }, []);

  const disbandGroup = useCallback((groupId: string) => {
    setSelectionGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const removeFromGroup = useCallback((nodeId: string, groupId: string) => {
    setSelectionGroups((prev) =>
      prev
        .map((g) =>
          g.id === groupId
            ? { ...g, nodeIds: g.nodeIds.filter((id) => id !== nodeId) }
            : g
        )
        .filter((g) => g.nodeIds.length >= 2)
    );
  }, []);

  const renameGroup = useCallback((groupId: string, name: string) => {
    setSelectionGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, label: name } : g))
    );
  }, []);

  /** Remove any group members whose nodes were deleted from the canvas. */
  const pruneForNodes = useCallback((nodes: Node[]) => {
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    setSelectionGroups((prev) => {
      const pruned = prev
        .map((g) => ({
          ...g,
          nodeIds: g.nodeIds.filter((id) => nodeIdSet.has(id)),
        }))
        .filter((g) => g.nodeIds.length >= 2);
      return pruned.length === prev.length &&
        pruned.every((g, i) => g.nodeIds.length === prev[i].nodeIds.length)
        ? prev
        : pruned;
    });
  }, []);

  return {
    selectionGroups,
    createGroup,
    disbandGroup,
    removeFromGroup,
    renameGroup,
    pruneForNodes,
  };
}
