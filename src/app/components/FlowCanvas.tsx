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
import type {
  ActionNodeData,
  ConditionNodeData,
  EndNodeData,
  NoteNodeData,
  StartNodeData,
} from "../types";
import styles from "./FlowCanvas.module.css";
import { nodeTypes } from "./nodes/nodeTypes";

export interface FlowCanvasExports {
  exportJpg: (name: string) => Promise<void>;
  exportPdf: (name: string) => Promise<void>;
  getFlowObject: () => { nodes: Node[]; edges: Edge[] };
  loadFlowObject: (nodes: Node[], edges: Edge[]) => void;
}

interface FlowCanvasInnerProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSelectionChange?: (nodes: Node[]) => void;
  onExportReady: (fns: FlowCanvasExports) => void;
  onFlowChange: (nodes: Node[], edges: Edge[]) => void;
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
}: FlowCanvasInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, getNodes, getEdges, screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    initialNodes ?? [DEFAULT_START_NODE]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialEdges ?? []
  );

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

    onExportReady({ exportJpg, exportPdf, getFlowObject, loadFlowObject });
  }, [fitView, getNodes, getEdges, onExportReady, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: "smoothstep",
        animated: false,
        label:
          connection.sourceHandle === "yes"
            ? "Yes"
            : connection.sourceHandle === "no"
              ? "No"
              : undefined,
        style: {
          stroke:
            connection.sourceHandle === "yes"
              ? "#66bb6a"
              : connection.sourceHandle === "no"
                ? "#ef5350"
                : "#8b949e",
          strokeWidth: 2,
        },
        markerEnd: { type: "arrow" as const, color: "#8b949e" },
      } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
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
    },
    [screenToFlowPosition, setNodes]
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
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Control"
        defaultEdgeOptions={{
          type: "smoothstep",
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
}

export function FlowCanvas(props: FlowCanvasProps) {
  return <FlowCanvasInner {...props} />;
}
