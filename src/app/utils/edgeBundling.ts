import type { Edge, Node } from "@xyflow/react";

export interface BundleGroup {
  representativeEdge: Edge;
  memberEdges: Edge[];
}

type MeasuredNode = Node & {
  measured?: { width?: number; height?: number };
};

const DEFAULT_NODE_W: Record<string, number> = {
  actionNode: 176,
  conditionNode: 150,
  startNode: 155,
  noteNode: 160,
  conditionStatusNode: 160,
};

const DEFAULT_NODE_H: Record<string, number> = {
  actionNode: 110,
  conditionNode: 120,
  startNode: 48,
  noteNode: 80,
  conditionStatusNode: 68,
};

function getHandlePos(
  node: MeasuredNode,
  handleId: string | null | undefined,
  isSource: boolean
): { x: number; y: number } {
  const w = node.measured?.width ?? DEFAULT_NODE_W[node.type ?? ""] ?? 160;
  const h = node.measured?.height ?? DEFAULT_NODE_H[node.type ?? ""] ?? 80;
  const { x, y } = node.position;

  if (isSource) {
    const handle = handleId ?? "";
    if (handle === "yes" || handle === "source-right") {
      return { x: x + w, y: y + h / 2 };
    }
    // Default: bottom-center
    return { x: x + w / 2, y: y + h };
  }

  // target
  if (handleId === "target-left") {
    return { x, y: y + h / 2 };
  }
  return { x: x + w / 2, y };
}

type Pt = { x: number; y: number };

/** Minimum distance from point p to line segment a→b. */
function pointToSegmentDist(p: Pt, a: Pt, b: Pt): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) {
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq)
  );
  const cx = a.x + t * abx - p.x;
  const cy = a.y + t * aby - p.y;
  return Math.sqrt(cx * cx + cy * cy);
}

/** Minimum distance between line segment a1→a2 and segment b1→b2. */
function segmentMinDist(a1: Pt, a2: Pt, b1: Pt, b2: Pt): number {
  // Check for intersection (distance = 0)
  const d1x = a2.x - a1.x,
    d1y = a2.y - a1.y;
  const d2x = b2.x - b1.x,
    d2y = b2.y - b1.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) > 1e-10) {
    const dx = b1.x - a1.x,
      dy = b1.y - a1.y;
    const t = (dx * d2y - dy * d2x) / cross;
    const u = (dx * d1y - dy * d1x) / cross;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return 0;
  }
  return Math.min(
    pointToSegmentDist(a1, b1, b2),
    pointToSegmentDist(a2, b1, b2),
    pointToSegmentDist(b1, a1, a2),
    pointToSegmentDist(b2, a1, a2)
  );
}

/**
 * Groups edges whose line paths (source-handle → target-handle straight segment)
 * come within `threshold` px of each other at any point. Returns only groups
 * with 2+ members.
 *
 * Yes/No condition edges and animated edges are always excluded.
 */
export function computeBundles(
  nodes: Node[],
  edges: Edge[],
  threshold = 40
): BundleGroup[] {
  const nodeMap = new Map<string, MeasuredNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n as MeasuredNode);
  }

  // Filter out excluded edges
  const candidates = edges.filter((e) => {
    if (e.animated) return false;
    const sh = e.sourceHandle ?? "";
    if (sh === "yes" || sh === "no") return false;
    return true;
  });

  // Compute handle positions for each candidate
  const positions = candidates.map((e) => {
    const srcNode = nodeMap.get(e.source);
    const tgtNode = nodeMap.get(e.target);
    return {
      edge: e,
      src: srcNode
        ? getHandlePos(srcNode, e.sourceHandle, true)
        : { x: 0, y: 0 },
      tgt: tgtNode
        ? getHandlePos(tgtNode, e.targetHandle, false)
        : { x: 0, y: 0 },
    };
  });

  // Greedy clustering — merge when the minimum distance between the two
  // line segments is within threshold (i.e. the lines run close to each other)
  const clusters: Array<typeof positions> = [];
  const assigned = new Set<string>();

  for (const ep of positions) {
    if (assigned.has(ep.edge.id)) continue;

    let merged = false;
    for (const cluster of clusters) {
      for (const existing of cluster) {
        if (
          segmentMinDist(ep.src, ep.tgt, existing.src, existing.tgt) <=
          threshold
        ) {
          cluster.push(ep);
          assigned.add(ep.edge.id);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }

    if (!merged) {
      clusters.push([ep]);
      assigned.add(ep.edge.id);
    }
  }

  // Return only clusters with >= 2 members
  return clusters
    .filter((c) => c.length >= 2)
    .map((c) => ({
      representativeEdge: c[0].edge,
      memberEdges: c.map((ep) => ep.edge),
    }));
}
