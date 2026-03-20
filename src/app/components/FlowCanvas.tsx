import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  getNodesBounds,
  getViewportForBounds,
  MiniMap,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@xyflow/react/dist/style.css";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useClipboard } from "../hooks/useClipboard";
import { useFlowDrop } from "../hooks/useFlowDrop";
import { useFlowHistory } from "../hooks/useFlowHistory";
import type { ActionNodeData, StartNodeData } from "../types";

/** Context providing the set of ActionNode IDs that are in a concentration conflict. */
export const ConcentrationContext = React.createContext<Set<string>>(new Set());

/** A single end-to-end path through the flowchart with its action economy spend. */
export interface PathBudget {
  pathId: string;
  /** All node IDs on the path, in traversal order. */
  nodeIds: string[];
  /** Labels of ActionNodes that consume action/bonus/reaction on this path. */
  nodeLabels: string[];
  actions: number;
  bonusActions: number;
  reactions: number;
}

/** Context providing the set of ActionNode IDs that contribute to an over-budget path. */
export const ActionEconomyContext = React.createContext<Set<string>>(new Set());

function findConcentrationConflicts(nodes: Node[], edges: Edge[]): Set<string> {
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

function computePathBudgets(nodes: Node[], edges: Edge[]): PathBudget[] {
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

import { SnappedConnectionLine } from "./edges/SnappedConnectionLine";
import { SnappedEdge } from "./edges/SnappedEdge";
import styles from "./FlowCanvas.module.css";
import { nodeTypes } from "./nodes/nodeTypes";

const edgeTypes = { snappedEdge: SnappedEdge };

export interface FlowCanvasExports {
  exportJpg: (name: string) => Promise<void>;
  exportPdf: (name: string) => Promise<void>;
  getFlowObject: () => { nodes: Node[]; edges: Edge[] };
  loadFlowObject: (nodes: Node[], edges: Edge[]) => void;
  copy: (nodes: Node[]) => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
}

export type EdgeStyleType = "smoothstep" | "step" | "straight";

interface FlowCanvasInnerProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSelectionChange?: (nodes: Node[]) => void;
  onExportReady: (fns: FlowCanvasExports) => void;
  onFlowChange: (nodes: Node[], edges: Edge[]) => void;
  onConcentrationChange?: (
    spells: Array<{ id: string; label: string }>,
    conflictIds: string[]
  ) => void;
  onActionEconomyChange?: (
    budgets: PathBudget[],
    overBudgetNodeIds: string[]
  ) => void;
  edgeStyle?: EdgeStyleType;
  animatedEdges?: boolean;
}

const DEFAULT_START_NODE: Node<StartNodeData, "startNode"> = {
  id: "start-1",
  type: "startNode",
  position: { x: 300, y: 60 },
  data: { label: "Combat Start" },
};

let nodeIdCounter = 1;
function newId() {
  return `node-${Date.now()}-${nodeIdCounter++}`;
}

function FlowCanvasInner({
  initialNodes,
  initialEdges,
  onSelectionChange,
  onExportReady,
  onFlowChange,
  onConcentrationChange,
  onActionEconomyChange,
  edgeStyle = "smoothstep",
  animatedEdges = false,
}: FlowCanvasInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, getNodes, getEdges, screenToFlowPosition, addNodes } =
    useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    initialNodes ?? [DEFAULT_START_NODE]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialEdges ?? []
  );

  // History for undo/redo
  const { scheduleSnapshot, handleUndo, handleRedo, snapshotTimerRef } =
    useFlowHistory({
      initialNodes: initialNodes ?? [DEFAULT_START_NODE],
      initialEdges: initialEdges ?? [],
      setNodes,
      setEdges,
      getNodes,
      getEdges,
    });

  // Clipboard for copy/paste
  const { copy: clipCopy, paste: clipPaste } = useClipboard();

  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  const handlePaste = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    clipPaste(addNodes);
  }, [clipPaste, addNodes, setNodes]);

  const wrappedOnNodesChange: OnNodesChange = useCallback(
    (changes) => {
      type MeasuredNode = Node & {
        measured?: { width?: number; height?: number };
      };
      const NODE_SNAP_TOLERANCE_DEG = 2;
      const allNodes = getNodes();
      const allEdges = getEdges();
      const snappedChanges = changes.map((change) => {
        if (change.type !== "position" || !change.position) return change;
        const nodeId = change.id;
        const newPos = change.position;
        const node = allNodes.find((n) => n.id === nodeId) as
          | MeasuredNode
          | undefined;
        if (!node) return change;
        const nodeW = node.measured?.width ?? 150;
        const nodeH = node.measured?.height ?? 50;
        const nodeCX = newPos.x + nodeW / 2;
        const nodeCY = newPos.y + nodeH / 2;
        const connectedEdges = allEdges.filter(
          (e) => e.source === nodeId || e.target === nodeId
        );
        for (const edge of connectedEdges) {
          const otherId = edge.source === nodeId ? edge.target : edge.source;
          const otherNode = allNodes.find((n) => n.id === otherId) as
            | MeasuredNode
            | undefined;
          if (!otherNode) continue;
          const otherW = otherNode.measured?.width ?? 150;
          const otherH = otherNode.measured?.height ?? 50;
          const otherCX = otherNode.position.x + otherW / 2;
          const otherCY = otherNode.position.y + otherH / 2;
          const dx = nodeCX - otherCX;
          const dy = nodeCY - otherCY;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const snappedAngle = Math.round(angle / 45) * 45;
          const diff = Math.abs(angle - snappedAngle);
          if (diff <= NODE_SNAP_TOLERANCE_DEG) {
            const rad = snappedAngle * (Math.PI / 180);
            const length = Math.sqrt(dx * dx + dy * dy);
            const newCX = otherCX + Math.cos(rad) * length;
            const newCY = otherCY + Math.sin(rad) * length;
            return {
              ...change,
              position: { x: newCX - nodeW / 2, y: newCY - nodeH / 2 },
            };
          }
        }
        return change;
      });
      (onNodesChange as OnNodesChange)(snappedChanges);
      const hasStructural = changes.some(
        (c) =>
          c.type === "add" ||
          c.type === "remove" ||
          (c.type === "position" && c.dragging !== true)
      );
      if (hasStructural) scheduleSnapshot();
    },
    [onNodesChange, scheduleSnapshot, getNodes, getEdges]
  );

  const wrappedOnEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      (onEdgesChange as OnEdgesChange)(changes);
      const hasStructural = changes.some(
        (c) => c.type === "add" || c.type === "remove"
      );
      if (hasStructural) scheduleSnapshot();
    },
    [onEdgesChange, scheduleSnapshot]
  );

  // Retroactively toggle animation on all existing edges
  useEffect(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, animated: animatedEdges })));
  }, [animatedEdges, setEdges]);

  // Cleanup snapshot timer on unmount
  useEffect(() => {
    return () => {
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    };
  }, [snapshotTimerRef]);

  // Report changes upward
  useEffect(() => {
    onFlowChange(nodes, edges);
  }, [nodes, edges, onFlowChange]);

  // Compute concentration conflicts on every graph change
  const [conflictNodeIds, setConflictNodeIds] = useState<Set<string>>(
    () => new Set()
  );
  useEffect(() => {
    const newConflicts = findConcentrationConflicts(nodes, edges);
    setConflictNodeIds((prev) => {
      const changed =
        newConflicts.size !== prev.size ||
        [...newConflicts].some((id) => !prev.has(id));
      return changed ? newConflicts : prev;
    });
    if (onConcentrationChange) {
      const concSpells = nodes
        .filter(
          (n) =>
            n.type === "actionNode" && (n.data as ActionNodeData).concentration
        )
        .map((n) => ({
          id: n.id,
          label: (n.data as ActionNodeData).label as string,
        }));
      onConcentrationChange(concSpells, [...newConflicts]);
    }
  }, [nodes, edges, onConcentrationChange]);
  // Compute action economy budgets on every graph change
  const [overBudgetNodeIds, setOverBudgetNodeIds] = useState<Set<string>>(
    () => new Set()
  );
  useEffect(() => {
    const budgets = computePathBudgets(nodes, edges);
    const overBudgetSet = new Set<string>();
    for (const path of budgets) {
      if (path.actions > 1 || path.bonusActions > 1 || path.reactions > 1) {
        for (const nodeId of path.nodeIds) {
          const node = nodes.find((n) => n.id === nodeId);
          if (node?.type === "actionNode") {
            const data = node.data as ActionNodeData;
            if (
              data.actionType === "action" ||
              data.actionType === "bonus" ||
              data.actionType === "reaction"
            ) {
              overBudgetSet.add(nodeId);
            }
          }
        }
      }
    }
    setOverBudgetNodeIds((prev) => {
      const changed =
        overBudgetSet.size !== prev.size ||
        [...overBudgetSet].some((id) => !prev.has(id));
      return changed ? overBudgetSet : prev;
    });
    if (onActionEconomyChange) {
      onActionEconomyChange(budgets, [...overBudgetSet]);
    }
  }, [nodes, edges, onActionEconomyChange]);
  // Build warning message for conflicting nodes
  const conflictWarningText = useMemo(() => {
    if (conflictNodeIds.size === 0) return null;
    const conflictNames = nodes
      .filter(
        (n) =>
          conflictNodeIds.has(n.id) &&
          n.type === "actionNode" &&
          (n.data as ActionNodeData).concentration
      )
      .map((n) => `"${(n.data as ActionNodeData).label}"`);
    if (conflictNames.length === 0) return null;
    if (conflictNames.length === 2) {
      return `${conflictNames[0]} and ${conflictNames[1]} are both concentration spells on the same branch.`;
    }
    return `${conflictNames.join(", ")} are concentration spells on the same branch.`;
  }, [conflictNodeIds, nodes]);

  // Expose export functions to parent
  useEffect(() => {
    const captureElement = () =>
      reactFlowWrapper.current?.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement | null;

    const getExportViewport = (width: number, height: number) => {
      const nodesBounds = getNodesBounds(getNodes());
      return getViewportForBounds(nodesBounds, width, height, 0.5, 2, 0.15);
    };

    const exportJpg = async (name: string) => {
      const el = captureElement();
      if (!el || !reactFlowWrapper.current) return;
      const width = reactFlowWrapper.current.offsetWidth;
      const height = reactFlowWrapper.current.offsetHeight;
      const { x, y, zoom } = getExportViewport(width, height);
      const dataUrl = await toJpeg(el, {
        quality: 0.95,
        backgroundColor: "#0d1117",
        skipFonts: true,
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        },
      });
      const link = document.createElement("a");
      link.download = `${name}.jpg`;
      link.href = dataUrl;
      link.click();
    };

    const exportPdf = async (name: string) => {
      const el = captureElement();
      if (!el || !reactFlowWrapper.current) return;
      const width = reactFlowWrapper.current.offsetWidth;
      const height = reactFlowWrapper.current.offsetHeight;
      const { x, y, zoom } = getExportViewport(width, height);
      const dataUrl = await toPng(el, {
        backgroundColor: "#0d1117",
        skipFonts: true,
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        },
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((r) => {
        img.onload = r;
      });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
      const imgW = img.width * ratio;
      const imgH = img.height * ratio;
      pdf.addImage(
        dataUrl,
        "PNG",
        (pageWidth - imgW) / 2,
        (pageHeight - imgH) / 2,
        imgW,
        imgH
      );
      pdf.save(`${name}.pdf`);
    };

    const getFlowObject = () => ({ nodes: getNodes(), edges: getEdges() });
    const loadFlowObject = (n: Node[], e: Edge[]) => {
      setNodes(n);
      setEdges(e);
      setTimeout(() => fitView({ padding: 0.1 }), 100);
    };

    onExportReady({
      exportJpg,
      exportPdf,
      getFlowObject,
      loadFlowObject,
      copy: clipCopy,
      paste: handlePaste,
      undo: handleUndo,
      redo: handleRedo,
      selectAll: handleSelectAll,
    });
  }, [
    fitView,
    getNodes,
    getEdges,
    onExportReady,
    setNodes,
    setEdges,
    clipCopy,
    handlePaste,
    handleUndo,
    handleRedo,
    handleSelectAll,
  ]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const isYes = connection.sourceHandle === "yes";
      const isNo = connection.sourceHandle === "no";
      const isVariant =
        connection.sourceHandle?.startsWith("source-variant-") ?? false;
      const strokeColor = isYes
        ? "#66bb6a"
        : isNo
          ? "#ef5350"
          : isVariant
            ? "#c8901c"
            : "#8b949e";
      const defaultLabel = isYes ? "Yes" : isNo ? "No" : "";
      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: "snappedEdge",
        animated: animatedEdges,
        data: { label: defaultLabel },
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: { type: "arrow" as const, color: strokeColor },
      } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
      scheduleSnapshot();
    },
    [setEdges, scheduleSnapshot, animatedEdges]
  );

  // Drop handler
  const { onDrop, onDragOver } = useFlowDrop({
    screenToFlowPosition,
    setNodes,
    scheduleSnapshot,
  });

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      onSelectionChange?.(selectedNodes);
    },
    [onSelectionChange]
  );

  return (
    <ActionEconomyContext.Provider value={overBudgetNodeIds}>
      <ConcentrationContext.Provider value={conflictNodeIds}>
        <div ref={reactFlowWrapper} className={styles.canvasWrapper}>
          {conflictWarningText && (
            <div className={styles.concentrationWarning} role="alert">
              <span className={styles.concentrationWarningIcon}>⚠</span>
              {conflictWarningText}
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={wrappedOnNodesChange}
            onEdgesChange={wrappedOnEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={handleSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineComponent={SnappedConnectionLine}
            fitView
            deleteKeyCode={["Delete", "Backspace"]}
            multiSelectionKeyCode={["Control", "Shift"]}
            selectionOnDrag={true}
            panOnDrag={[1, 2]}
            selectionMode={SelectionMode.Partial}
            defaultEdgeOptions={{
              type: edgeStyle,
              style: { stroke: "#8b949e", strokeWidth: 2 },
              markerEnd: { type: "arrow" as const, color: "#8b949e" },
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#21262d"
            />
            <Controls className={styles.controls} />
            <MiniMap
              className={styles.minimap}
              nodeColor={() => "#d4a017"}
              maskColor="rgba(13, 17, 23, 0.7)"
            />
          </ReactFlow>
        </div>
      </ConcentrationContext.Provider>
    </ActionEconomyContext.Provider>
  );
}

interface FlowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSelectionChange?: (nodes: Node[]) => void;
  onExportReady: (fns: FlowCanvasExports) => void;
  onFlowChange: (nodes: Node[], edges: Edge[]) => void;
  onConcentrationChange?: (
    spells: Array<{ id: string; label: string }>,
    conflictIds: string[]
  ) => void;
  onActionEconomyChange?: (
    budgets: PathBudget[],
    overBudgetNodeIds: string[]
  ) => void;
  edgeStyle?: EdgeStyleType;
  animatedEdges?: boolean;
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
