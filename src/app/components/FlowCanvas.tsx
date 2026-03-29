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
import { GROUP_COLORS } from "../data/groupColors";
import { useClipboard } from "../hooks/useClipboard";
import { useFlowDrop } from "../hooks/useFlowDrop";
import { useFlowHistory } from "../hooks/useFlowHistory";
import type {
  ActionNodeData,
  EdgeStyleType,
  FlowCanvasExports,
  PathBudget,
  SelectionGroup,
  StartNodeData,
} from "../types";
import { findConcentrationConflicts } from "../utils/concentrationConflicts";
import { computeBundles } from "../utils/edgeBundling";
import {
  applyExportFonts,
  captureFlowJpeg,
  captureFlowPng,
  downloadJpeg,
  removeExportFonts,
  savePdf,
} from "../utils/exportFlow";
import { computePathBudgets } from "../utils/pathBudgets";
import { ExportOverlay } from "./ExportOverlay";
import { BundleEdge } from "./edges/BundleEdge";
import { SnappedConnectionLine } from "./edges/SnappedConnectionLine";
import { SnappedEdge } from "./edges/SnappedEdge";
import styles from "./FlowCanvas.module.css";
import {
  ActionEconomyContext,
  ConcentrationContext,
  SelectionGroupContext,
} from "./FlowCanvasContexts";
import { nodeTypes } from "./nodes/nodeTypes";

const edgeTypes = { snappedEdge: SnappedEdge, bundleEdge: BundleEdge };

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
  selectionGroups?: SelectionGroup[];
  bundleEdges?: boolean;
  /** When true, pan is disabled and every drag gesture performs box selection. */
  selectMode?: boolean;
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
  selectionGroups = [],
  bundleEdges = false,
  selectMode = false,
}: FlowCanvasInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);
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
        // Skip snapping when edges span 3+ distinct handle sides (layout too ambiguous)
        const handleSides = new Set<string>();
        for (const edge of connectedEdges) {
          if (edge.source === nodeId) {
            const h = edge.sourceHandle ?? "";
            if (h === "source-right" || h === "no") handleSides.add("right");
            else if (h === "yes") handleSides.add("left");
            else handleSides.add("bottom");
          } else {
            handleSides.add(
              edge.targetHandle === "target-left" ? "left" : "top"
            );
          }
        }
        if (handleSides.size >= 3) return change;
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

  const [minimapCollapsed, setMinimapCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  // Drop handler — must be declared before the onExportReady useEffect below
  const { onDrop, onDragOver, dropAtPosition } = useFlowDrop({
    screenToFlowPosition,
    setNodes,
    scheduleSnapshot,
  });

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

    const finishExport = () => {
      setTimeout(() => {
        setIsExporting(false);
      }, 300);
    };

    const exportJpg = async (name: string) => {
      const el = captureElement();
      if (!el || !reactFlowWrapper.current) return;
      const width = reactFlowWrapper.current.offsetWidth;
      const height = reactFlowWrapper.current.offsetHeight;
      const transform = getExportViewport(width, height);
      setIsExporting(true);
      applyExportFonts();
      let dataUrl: string;
      try {
        dataUrl = await captureFlowJpeg(el, width, height, transform);
      } catch (err) {
        removeExportFonts();
        finishExport();
        throw err;
      }
      removeExportFonts();
      finishExport();
      downloadJpeg(dataUrl, name);
    };

    const exportPdf = async (name: string) => {
      const el = captureElement();
      if (!el || !reactFlowWrapper.current) return;
      const width = reactFlowWrapper.current.offsetWidth;
      const height = reactFlowWrapper.current.offsetHeight;
      const transform = getExportViewport(width, height);
      setIsExporting(true);
      applyExportFonts();
      let dataUrl: string;
      try {
        dataUrl = await captureFlowPng(el, width, height, transform);
      } catch (err) {
        removeExportFonts();
        setIsExporting(false);
        throw err;
      }
      removeExportFonts();
      setIsExporting(false);
      await savePdf(dataUrl, name);
    };

    const getFlowObject = () => ({ nodes: getNodes(), edges: getEdges() });
    const loadFlowObject = (n: Node[], e: Edge[]) => {
      setNodes(n);
      setEdges(e);
      setTimeout(() => fitView({ padding: 0.1 }), 100);
    };
    const selectNodes = (ids: string[]) => {
      const id_set = new Set(ids);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: id_set.has(n.id) })));
    };
    const focusNodes = (ids: string[]) => {
      selectNodes(ids);
      setTimeout(
        () =>
          fitView({
            nodes: ids.map((id) => ({ id })),
            padding: 0.25,
            duration: 500,
          }),
        50
      );
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
      selectNodes,
      focusNodes,
      dropAtPosition,
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
    dropAtPosition,
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

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      onSelectionChange?.(selectedNodes);
    },
    [onSelectionChange]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      const group = selectionGroups.find((g) => g.nodeIds.includes(node.id));
      if (!group) return;
      const groupNodeIds = new Set(group.nodeIds);
      setNodes((nds) =>
        nds.map((n) => ({ ...n, selected: groupNodeIds.has(n.id) }))
      );
    },
    [selectionGroups, setNodes]
  );

  const nodeGroupColorMap = useMemo(() => {
    const map = new Map<string, string>();
    selectionGroups.forEach((group, idx) => {
      const color = GROUP_COLORS[idx % GROUP_COLORS.length];
      for (const nodeId of group.nodeIds) {
        map.set(nodeId, color);
      }
    });
    return map;
  }, [selectionGroups]);

  // Bundle edge computation — only runs when bundleEdges is on
  const bundleData = useMemo(() => {
    if (!bundleEdges) return null;
    const groups = computeBundles(nodes, edges);
    const bundledEdgeIds = new Set<string>();
    const syntheticEdges: Edge[] = [];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const nodeIdSet = new Set<string>();
      for (const me of group.memberEdges) {
        bundledEdgeIds.add(me.id);
        nodeIdSet.add(me.source);
        nodeIdSet.add(me.target);
      }
      const rep = group.representativeEdge;
      const memberEdgeInfo = group.memberEdges.map((me) => {
        const srcNode = nodes.find((n) => n.id === me.source);
        const tgtNode = nodes.find((n) => n.id === me.target);
        const srcLabel =
          (srcNode?.data as { label?: string })?.label ?? me.source;
        const tgtLabel =
          (tgtNode?.data as { label?: string })?.label ?? me.target;
        return { id: me.id, sourceLabel: srcLabel, targetLabel: tgtLabel };
      });
      syntheticEdges.push({
        ...rep,
        id: `bundle-${i}`,
        type: "bundleEdge",
        data: {
          memberEdges: memberEdgeInfo,
          memberEdgeIds: group.memberEdges.map((e) => e.id),
          memberNodeIds: [...nodeIdSet],
        },
        selectable: false,
        hidden: false,
      } as Edge);
    }
    return { bundledEdgeIds, syntheticEdges };
  }, [bundleEdges, nodes, edges]);

  const displayEdges = useMemo(() => {
    if (!bundleData) return edges;
    return [
      ...edges.map((e) =>
        bundleData.bundledEdgeIds.has(e.id) ? { ...e, hidden: true } : e
      ),
      ...bundleData.syntheticEdges,
    ];
  }, [edges, bundleData]);

  return (
    <ActionEconomyContext.Provider value={overBudgetNodeIds}>
      <ConcentrationContext.Provider value={conflictNodeIds}>
        <SelectionGroupContext.Provider value={nodeGroupColorMap}>
          <div
            ref={reactFlowWrapper}
            className={styles.canvasWrapper}
            data-canvas-drop=""
          >
            <ExportOverlay visible={isExporting} />
            {conflictWarningText && (
              <div className={styles.concentrationWarning} role="alert">
                <span className={styles.concentrationWarningIcon}>⚠</span>
                {conflictWarningText}
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={displayEdges}
              onNodeClick={handleNodeClick}
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
              selectionOnDrag={selectMode || !isTouchDevice}
              panOnDrag={selectMode ? false : isTouchDevice ? true : [1, 2]}
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
              <div
                className={`${styles.minimapWrapper}${minimapCollapsed ? ` ${styles.minimapCollapsed}` : ""}${" "}${styles.minimapResponsive}`}
              >
                <button
                  type="button"
                  className={styles.minimapToggle}
                  onClick={() => setMinimapCollapsed((c) => !c)}
                  title={minimapCollapsed ? "Show minimap" : "Hide minimap"}
                  aria-label={
                    minimapCollapsed ? "Show minimap" : "Hide minimap"
                  }
                >
                  {minimapCollapsed ? "›" : "‹"}
                </button>
                {!minimapCollapsed && (
                  <MiniMap
                    className={styles.minimap}
                    nodeColor={() => "#d4a017"}
                    maskColor="rgba(13, 17, 23, 0.7)"
                    pannable
                    zoomable
                  />
                )}
              </div>
            </ReactFlow>
          </div>
        </SelectionGroupContext.Provider>
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
  selectionGroups?: SelectionGroup[];
  bundleEdges?: boolean;
  /** When true, pan is disabled and every drag gesture performs box selection. */
  selectMode?: boolean;
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
