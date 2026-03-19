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
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import "@xyflow/react/dist/style.css";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useClipboard } from "../hooks/useClipboard";
import type {
  ActionNodeData,
  ConditionNodeData,
  EndNodeData,
  GroupNodeData,
  NoteNodeData,
  StartNodeData,
} from "../types";
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
  const historyRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([
    {
      nodes: initialNodes ?? [DEFAULT_START_NODE],
      edges: initialEdges ?? [],
    },
  ]);
  const historyCursorRef = useRef(0);
  const isHistoryActionRef = useRef(false);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clipboard for copy/paste
  const { copy: clipCopy, paste: clipPaste } = useClipboard();

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
  }, []);

  // Report changes upward
  useEffect(() => {
    onFlowChange(nodes, edges);
  }, [nodes, edges, onFlowChange]);

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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;

      let item: Record<string, unknown>;
      try {
        item = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeType =
        (item.nodeType as string | undefined) ?? (item.type as string);

      let newNode: Node;

      if (nodeType === "conditionNode") {
        const data: ConditionNodeData = {
          label: (item.label as string) ?? "Condition?",
        };
        newNode = { id: newId(), type: "conditionNode", position, data };
      } else if (nodeType === "noteNode") {
        const data: NoteNodeData = { content: "" };
        newNode = { id: newId(), type: "noteNode", position, data };
      } else if (nodeType === "startNode") {
        const data: StartNodeData = {
          label: (item.label as string) ?? "Start",
        };
        newNode = { id: newId(), type: "startNode", position, data };
      } else if (nodeType === "endNode") {
        const data: EndNodeData = {
          label: (item.label as string) ?? "End of Round",
        };
        newNode = { id: newId(), type: "endNode", position, data };
      } else if (nodeType === "groupNode") {
        const data: GroupNodeData = {
          label: (item.label as string) ?? "Action Group",
          variants: [],
          collapsed: false,
        };
        newNode = { id: newId(), type: "groupNode", position, data };
      } else {
        // ActionNode (spell or action)
        const data: ActionNodeData = {
          label: (item.label as string) ?? "Action",
          actionType:
            (item.actionType as ActionNodeData["actionType"]) ?? "action",
          damageType: item.damageType as ActionNodeData["damageType"],
          school: item.school as string | undefined,
          description: item.description as string | undefined,
          spellLevel: item.spellLevel as string | undefined,
          range: item.range as string | undefined,
          duration: item.duration as string | undefined,
          source: (item.source as ActionNodeData["source"]) ?? "standard",
          damageDice: item.damageDice as string | undefined,
          saveDC: item.saveDC as string | undefined,
          saveAbility: item.saveAbility as string | undefined,
          rollType: item.rollType as ActionNodeData["rollType"],
          higherLevels: item.higherLevels as string | undefined,
          hand: item.hand as ActionNodeData["hand"],
          notes: "",
        };
        newNode = { id: newId(), type: "actionNode", position, data };
      }

      setNodes((nds) => [...nds, newNode]);
      scheduleSnapshot();
    },
    [screenToFlowPosition, setNodes, scheduleSnapshot]
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      onSelectionChange?.(selectedNodes);
    },
    [onSelectionChange]
  );

  return (
    <div ref={reactFlowWrapper} className={styles.canvasWrapper}>
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
  );
}

interface FlowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSelectionChange?: (nodes: Node[]) => void;
  onExportReady: (fns: FlowCanvasExports) => void;
  onFlowChange: (nodes: Node[], edges: Edge[]) => void;
  edgeStyle?: EdgeStyleType;
  animatedEdges?: boolean;
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
