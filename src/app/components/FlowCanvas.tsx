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
      (onNodesChange as OnNodesChange)(changes);
      const hasStructural = changes.some(
        (c) =>
          c.type === "add" ||
          c.type === "remove" ||
          c.type === "reset" ||
          (c.type === "position" && c.dragging !== true)
      );
      if (hasStructural) scheduleSnapshot();
    },
    [onNodesChange, scheduleSnapshot]
  );

  const wrappedOnEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      (onEdgesChange as OnEdgesChange)(changes);
      const hasStructural = changes.some(
        (c) => c.type === "add" || c.type === "remove" || c.type === "reset"
      );
      if (hasStructural) scheduleSnapshot();
    },
    [onEdgesChange, scheduleSnapshot]
  );

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
      const shiftHeld =
        (window as Window & { __shiftHeld?: boolean }).__shiftHeld ?? false;
      const isYes = connection.sourceHandle === "yes";
      const isNo = connection.sourceHandle === "no";
      const strokeColor = isYes ? "#66bb6a" : isNo ? "#ef5350" : "#8b949e";
      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: shiftHeld ? "snappedEdge" : edgeStyle,
        animated: false,
        label: isYes ? "Yes" : isNo ? "No" : undefined,
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: { type: "arrow" as const, color: strokeColor },
      } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
      scheduleSnapshot();
    },
    [setEdges, scheduleSnapshot, edgeStyle]
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
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
