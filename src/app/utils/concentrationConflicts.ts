import type { Edge, Node } from "@xyflow/react";
import type { ActionNodeData } from "../types";

export function findConcentrationConflicts(
  nodes: Node[],
  edges: Edge[]
): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const existing = adjacency.get(edge.source);
    if (existing) existing.push(edge.target);
  }

  const hasIncoming = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id));

  const conflictIds = new Set<string>();

  function dfs(nodeId: string, concPath: string[], visited: Set<string>): void {
    if (visited.has(nodeId)) return;
    const newVisited = new Set(visited);
    newVisited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    let newPath = concPath;
    if (node.type === "actionNode") {
      const data = node.data as ActionNodeData;
      if (data.concentration) {
        if (newPath.length > 0) {
          for (const id of newPath) conflictIds.add(id);
          conflictIds.add(nodeId);
        }
        newPath = [...newPath, nodeId];
      }
    }

    for (const childId of adjacency.get(nodeId) ?? []) {
      dfs(childId, newPath, newVisited);
    }
  }

  for (const root of roots) {
    dfs(root.id, [], new Set());
  }
  return conflictIds;
}
