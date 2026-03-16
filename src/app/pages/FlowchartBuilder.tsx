import type { Node } from "@xyflow/react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  Check,
  ChevronLeft,
  Download,
  Edit2,
  FileText,
  Save,
  Sword,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { FlowCanvasExports } from "../components/FlowCanvas";
import { type EdgeStyleType, FlowCanvas } from "../components/FlowCanvas";
import { LoadoutPicker } from "../components/LoadoutPicker";
import { MultiSelectBar } from "../components/MultiSelectBar";
import { NodeEditor } from "../components/NodeEditor";
import { SpellPanel } from "../components/SpellPanel";
import { TabBar } from "../components/TabBar";
import { useApp } from "../context/AppContext";
import { CLASSES } from "../data/classes";
import type { Weapon } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import type { SavedFlowchart, WeaponLoadout } from "../types";
import styles from "./FlowchartBuilder.module.css";

export function FlowchartBuilder() {
  const { state, goToSetup, saveFlowchart, getActiveFlowchart, setLoadout } =
    useApp();
  const { character, activeTabId } = state;

  const activeChart = getActiveFlowchart();

  // Per-tab state: name, saved flash, editing name
  const [chartName, setChartName] = useState(
    activeChart?.name ?? "My Combat Flow"
  );
  const [editingName, setEditingName] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyleType>("smoothstep");
  const [showLoadoutPicker, setShowLoadoutPicker] = useState(false);
  const [customWeapons, setCustomWeapons] = useState<Weapon[]>([]);

  const handleAddCustomWeapon = useCallback((weapon: Weapon) => {
    setCustomWeapons((prev) => [...prev, weapon]);
  }, []);

  const handleSaveLoadout = useCallback(
    (loadout: WeaponLoadout) => {
      setLoadout(loadout);
    },
    [setLoadout]
  );

  // Keep chart name in sync when active tab changes
  useEffect(() => {
    setChartName(activeChart?.name ?? "My Combat Flow");
    setEditingName(false);
    setSelectedNodes([]);
    setIsSaved(false);
  }, [activeChart?.name]);

  const exportFnsRef = useRef<FlowCanvasExports | null>(null);
  const flowDataRef = useRef<{ nodes: Node[]; edges: unknown[] }>({
    nodes: (activeChart?.nodes ?? []) as Node[],
    edges: activeChart?.edges ?? [],
  });

  // Reset flowDataRef when active tab changes so the latest chart data is used
  useEffect(() => {
    flowDataRef.current = {
      nodes: (activeChart?.nodes ?? []) as Node[],
      edges: activeChart?.edges ?? [],
    };
  }, [activeChart?.nodes, activeChart?.edges]);

  // Keep a ref to selectedNodes for use inside keyboard handler closure
  const selectedNodesRef = useRef<Node[]>([]);
  useEffect(() => {
    selectedNodesRef.current = selectedNodes;
  }, [selectedNodes]);

  const handleDragStart = useCallback((e: React.DragEvent, data: unknown) => {
    e.dataTransfer.setData("application/reactflow", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleExportReady = useCallback((fns: FlowCanvasExports) => {
    exportFnsRef.current = fns;
  }, []);

  const handleFlowChange = useCallback((nodes: Node[], edges: unknown[]) => {
    flowDataRef.current = { nodes, edges };
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!character) return;
    const id = activeChart?.id ?? activeTabId ?? `chart-${Date.now()}`;
    const chart: SavedFlowchart = {
      id,
      name: chartName,
      character,
      nodes: flowDataRef.current.nodes,
      edges: flowDataRef.current.edges,
      createdAt: activeChart?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    saveFlowchart(chart);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [activeChart, activeTabId, character, chartName, saveFlowchart]);

  // Track Shift key state for edge angle-snapping connection preview
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift")
        (window as Window & { __shiftHeld?: boolean }).__shiftHeld = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift")
        (window as Window & { __shiftHeld?: boolean }).__shiftHeld = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Keyboard shortcuts — placed after handleSave so the closure captures it correctly
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (mod && e.key === "c") {
        exportFnsRef.current?.copy(selectedNodesRef.current);
      } else if (mod && e.key === "v") {
        exportFnsRef.current?.paste();
      } else if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        exportFnsRef.current?.undo();
      } else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        exportFnsRef.current?.redo();
      } else if (mod && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (mod && e.key === "a") {
        e.preventDefault();
        exportFnsRef.current?.selectAll();
      } else if (e.key === "Escape") {
        setSelectedNodes([]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleExportJpg = useCallback(async () => {
    await exportFnsRef.current?.exportJpg(chartName);
  }, [chartName]);

  const handleExportPdf = useCallback(async () => {
    await exportFnsRef.current?.exportPdf(chartName);
  }, [chartName]);

  if (!character) {
    goToSetup();
    return null;
  }

  const classDef = CLASSES.find((c) => c.id === character.class);
  const subclassDef = classDef?.subclasses.find(
    (s) => s.id === character.subclass
  );

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={goToSetup}
            title="Back to setup"
          >
            <ChevronLeft size={16} />
          </button>
          <TabBar />
        </div>

        <div className={styles.topCenter}>
          {editingName ? (
            <div className={styles.nameEditRow}>
              <input
                className={styles.nameInput}
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape")
                    setEditingName(false);
                }}
                autoFocus
              />
              <button
                type="button"
                className={styles.nameConfirmBtn}
                onClick={() => setEditingName(false)}
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.nameDisplay}
              onClick={() => setEditingName(true)}
            >
              <span className={styles.nameText}>{chartName}</span>
              <Edit2 size={12} className={styles.editIcon} />
            </button>
          )}
        </div>

        <div className={styles.topRight}>
          {/* Loadout chip */}
          <button
            type="button"
            className={`${styles.loadoutChip} ${character?.loadout?.mainHand ? styles.loadoutChipArmed : ""}`}
            onClick={() => setShowLoadoutPicker(true)}
            title="Configure weapon loadout"
          >
            <Sword size={13} />
            {character?.loadout?.mainHand
              ? (() => {
                  const allWeapons = [...WEAPONS, ...customWeapons];
                  const mh = allWeapons.find(
                    (w) => w.id === character.loadout?.mainHand
                  );
                  const oh =
                    character.loadout?.offHand === "shield"
                      ? "Shield"
                      : character.loadout?.offHand === "weapon"
                        ? (allWeapons.find(
                            (w) => w.id === character.loadout?.offHandWeaponId
                          )?.name ?? "Weapon")
                        : null;
                  return oh
                    ? `${mh?.name ?? "Weapon"} / ${oh}`
                    : character.loadout?.twoHanded
                      ? `${mh?.name ?? "Weapon"} (2H)`
                      : (mh?.name ?? "Weapon");
                })()
              : "Loadout"}
          </button>
          <span className={styles.topDivider} />
          <div
            className={styles.edgeStyleGroup}
            role="group"
            aria-label="Edge routing style"
          >
            <button
              type="button"
              className={`${styles.edgeStyleBtn} ${edgeStyle === "smoothstep" ? styles.edgeStyleBtnActive : ""}`}
              onClick={() => setEdgeStyle("smoothstep")}
              title="Curved edges (smooth step)"
            >
              Curved
            </button>
            <button
              type="button"
              className={`${styles.edgeStyleBtn} ${edgeStyle === "step" ? styles.edgeStyleBtnActive : ""}`}
              onClick={() => setEdgeStyle("step")}
              title="Orthogonal edges (step)"
            >
              Step
            </button>
            <button
              type="button"
              className={`${styles.edgeStyleBtn} ${edgeStyle === "straight" ? styles.edgeStyleBtnActive : ""}`}
              onClick={() => setEdgeStyle("straight")}
              title="Straight edges"
            >
              Straight
            </button>
          </div>
          <span className={styles.topDivider} />
          <button
            type="button"
            className={`${styles.actionBtn} ${isSaved ? styles.savedBtn : ""}`}
            onClick={handleSave}
            title="Save (Ctrl+S)"
          >
            <Save size={14} />
            {isSaved ? "Saved!" : "Save"}
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportJpg}
            title="Export as JPG image"
          >
            <Download size={14} />
            JPG
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportPdf}
            title="Export as PDF"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </header>

      {/* Loadout picker modal */}
      {showLoadoutPicker && character && (
        <LoadoutPicker
          character={character}
          customWeapons={customWeapons}
          onAddCustomWeapon={handleAddCustomWeapon}
          onSave={handleSaveLoadout}
          onClose={() => setShowLoadoutPicker(false)}
        />
      )}

      {/* Main layout */}
      <ReactFlowProvider>
        <div className={styles.workspace}>
          <SpellPanel
            character={character}
            customWeapons={customWeapons}
            onDragStart={handleDragStart}
          />

          <FlowCanvas
            key={activeTabId ?? "draft"}
            initialNodes={activeChart?.nodes as Node[] | undefined}
            initialEdges={
              activeChart?.edges as import("@xyflow/react").Edge[] | undefined
            }
            onSelectionChange={setSelectedNodes}
            onExportReady={handleExportReady}
            onFlowChange={handleFlowChange}
            edgeStyle={edgeStyle}
          />

          {selectedNodes.length === 1 && (
            <NodeEditor
              selectedNode={selectedNodes[0]}
              onClose={() => setSelectedNodes([])}
              character={character}
            />
          )}
          {selectedNodes.length > 1 && (
            <MultiSelectBar
              selectedNodes={selectedNodes}
              onDeselect={() => setSelectedNodes([])}
            />
          )}
        </div>
      </ReactFlowProvider>

      {/* Keyboard hint */}
      <div className={styles.hint}>
        <span>Drag items from the left panel onto the canvas</span>
        <span>·</span>
        <span>Connect nodes by dragging from their handles</span>
        <span>·</span>
        <span>Delete / Backspace removes selected nodes</span>
        <span>·</span>
        <span>
          Ctrl+C/V copy·paste · Ctrl+Z/Y undo·redo · Ctrl+A select all
        </span>
        <span>·</span>
        <span>Hold Shift while connecting to snap edges to 45° angles</span>
        <span>·</span>
        <span>Hover spell cards for full descriptions</span>
      </div>
    </div>
  );
}
