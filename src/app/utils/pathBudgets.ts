import type { Edge, Node } from "@xyflow/react";
import type { ActionNodeData, PathBudget } from "../types";

export function computePathBudgets(nodes: Node[], edges: Edge[]): PathBudget[] {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.source);
    if (neighbors) neighbors.push(edge.target);
  }

  const hasIncoming = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !hasIncoming.has(n.id));

  const paths: PathBudget[] = [];
  let counter = 0;

  function dfs(
    nodeId: string,
    path: string[],
    labels: string[],
    budget: { a: number; b: number; r: number },
    visited: Set<string>
  ): void {
    if (visited.has(nodeId)) return;
    const vis = new Set(visited);
    vis.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    let { a, b, r } = budget;
    const newLabels = [...labels];

    if (node?.type === "actionNode") {
      const data = node.data as ActionNodeData;
      const lbl = data.label as string;
      if (data.actionType === "action") {
        a++;
        newLabels.push(lbl);
      } else if (data.actionType === "bonus") {
        b++;
        newLabels.push(lbl);
      } else if (data.actionType === "reaction") {
        r++;
        newLabels.push(lbl);
      }
    }

    const newPath = [...path, nodeId];
    const children = adjacency.get(nodeId) ?? [];
    if (children.length === 0) {
      paths.push({
        pathId: `path-${counter++}`,
        nodeIds: newPath,
        nodeLabels: newLabels,
        actions: a,
        bonusActions: b,
        reactions: r,
      });
    } else {
      for (const child of children) {
        dfs(child, newPath, newLabels, { a, b, r }, vis);
      }
    }
  }

  for (const root of roots) {
    dfs(root.id, [], [], { a: 0, b: 0, r: 0 }, new Set());
  }
  return paths;
}
