import type { Node } from "@xyflow/react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  Activity,
  BarChart2,
  Check,
  ChevronLeft,
  Download,
  Edit2,
  FileText,
  Focus,
  Link2,
  Save,
  Sword,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FlowCanvasExports } from "../components/FlowCanvas";
import {
  type EdgeStyleType,
  FlowCanvas,
  type PathBudget,
} from "../components/FlowCanvas";
import { LoadoutPicker } from "../components/LoadoutPicker";
import { MultiSelectBar } from "../components/MultiSelectBar";
import { NodeEditor } from "../components/NodeEditor";
import { SpellPanel } from "../components/SpellPanel";
import { StatsEditor } from "../components/StatsEditor";
import { TabBar } from "../components/TabBar";
import { useApp } from "../context/AppContext";
import { CLASSES } from "../data/classes";
import type { Weapon } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import type { SavedFlowchart, WeaponLoadout } from "../types";
import { encodeFlowchart, SHARE_PARAM } from "../utils/shareUrl";
import styles from "./FlowchartBuilder.module.css";

export function FlowchartBuilder() {
  const {
    state,
    goToSetup,
    saveFlowchart,
    getActiveFlowchart,
    setLoadout,
    setAbilityScores,
  } = useApp();
  const { character, activeTabId } = state;

  const activeChart = getActiveFlowchart();

  // Per-tab state: name, saved flash, editing name
  const [chartName, setChartName] = useState(
    activeChart?.name ?? "My Combat Flow"
  );
  const [editingName, setEditingName] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [edgeStyle] = useState<EdgeStyleType>("step");
  const [animatedEdges, setAnimatedEdges] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showLoadoutPicker, setShowLoadoutPicker] = useState(false);
  const [showStatsPicker, setShowStatsPicker] = useState(false);
  const [customWeapons, setCustomWeapons] = useState<Weapon[]>([]);
  const [concentrationInfo, setConcentrationInfo] = useState<{
    spells: Array<{ id: string; label: string }>;
    conflictIds: string[];
  }>({ spells: [], conflictIds: [] });
  const [showConcentrationPopover, setShowConcentrationPopover] =
    useState(false);

  const [actionEconomyInfo, setActionEconomyInfo] = useState<{
    budgets: PathBudget[];
    overBudgetNodeIds: string[];
  }>({ budgets: [], overBudgetNodeIds: [] });
  const [showEconomyPopover, setShowEconomyPopover] = useState(false);
  const [economyHudHidden, setEconomyHudHidden] = useState(false);

  const handleActionEconomyChange = useCallback(
    (budgets: PathBudget[], overBudgetNodeIds: string[]) => {
      setActionEconomyInfo({ budgets, overBudgetNodeIds });
    },
    []
  );

  // Worst-case budget across all paths
  const worstCase = useMemo(() => {
    if (actionEconomyInfo.budgets.length === 0) return null;
    return {
      actions: Math.max(...actionEconomyInfo.budgets.map((p) => p.actions)),
      bonusActions: Math.max(
        ...actionEconomyInfo.budgets.map((p) => p.bonusActions)
      ),
      reactions: Math.max(...actionEconomyInfo.budgets.map((p) => p.reactions)),
    };
  }, [actionEconomyInfo.budgets]);

  const handleConcentrationChange = useCallback(
    (spells: Array<{ id: string; label: string }>, conflictIds: string[]) => {
      setConcentrationInfo({ spells, conflictIds });
    },
    []
  );

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

  const handleShare = useCallback(() => {
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
    const encoded = encodeFlowchart(chart);
    const url = `${window.location.origin}${window.location.pathname}?${SHARE_PARAM}=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [activeChart, activeTabId, character, chartName]);

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
          {/* Action Economy HUD chip */}
          {!economyHudHidden && (
            <button
              type="button"
              className={`${styles.loadoutChip} ${
                actionEconomyInfo.overBudgetNodeIds.length > 0
                  ? styles.economyChipAlert
                  : worstCase
                    ? styles.economyChipActive
                    : ""
              }`}
              onClick={() => setShowEconomyPopover((v) => !v)}
              title="Action economy budget"
            >
              <Activity size={13} />
              Economy
              {actionEconomyInfo.overBudgetNodeIds.length > 0 && (
                <span className={styles.economyAlertBadge}>⚠</span>
              )}
            </button>
          )}
          {economyHudHidden && (
            <button
              type="button"
              className={`${styles.loadoutChip} ${
                actionEconomyInfo.overBudgetNodeIds.length > 0
                  ? styles.economyChipAlert
                  : ""
              }`}
              onClick={() => setEconomyHudHidden(false)}
              title="Show action economy HUD"
            >
              <Activity size={13} />
            </button>
          )}
          {showEconomyPopover && !economyHudHidden && (
            <div
              className={styles.economyPopover}
              onMouseLeave={() => setShowEconomyPopover(false)}
            >
              <div className={styles.economyPopoverHeader}>
                <span>Turn Budget</span>
                <button
                  type="button"
                  className={styles.economyPopoverCloseBtn}
                  onClick={() => {
                    setEconomyHudHidden(true);
                    setShowEconomyPopover(false);
                  }}
                  title="Minimize HUD"
                >
                  ×
                </button>
              </div>
              {!worstCase ? (
                <div className={styles.economyPopoverEmpty}>
                  Add action nodes to the canvas to track economy.
                </div>
              ) : (
                <>
                  <div className={styles.economyWorstCase}>
                    <span
                      className={`${styles.economyBudgetStat} ${
                        worstCase.actions > 1
                          ? styles.economyOver
                          : styles.economyOk
                      }`}
                    >
                      A: {worstCase.actions}/1{" "}
                      {worstCase.actions > 1 ? "⚠" : "✓"}
                    </span>
                    <span
                      className={`${styles.economyBudgetStat} ${
                        worstCase.bonusActions > 1
                          ? styles.economyOver
                          : styles.economyOk
                      }`}
                    >
                      B: {worstCase.bonusActions}/1{" "}
                      {worstCase.bonusActions > 1 ? "⚠" : "✓"}
                    </span>
                    <span
                      className={`${styles.economyBudgetStat} ${
                        worstCase.reactions > 1
                          ? styles.economyOver
                          : styles.economyOk
                      }`}
                    >
                      R: {worstCase.reactions}/1{" "}
                      {worstCase.reactions > 1 ? "⚠" : "✓"}
                    </span>
                  </div>
                  {actionEconomyInfo.budgets.length > 0 && (
                    <ul className={styles.economyPathList}>
                      {actionEconomyInfo.budgets.slice(0, 12).map((path, i) => {
                        const isOverBudget =
                          path.actions > 1 ||
                          path.bonusActions > 1 ||
                          path.reactions > 1;
                        return (
                          <li
                            key={path.pathId}
                            className={`${styles.economyPathItem} ${
                              isOverBudget ? styles.economyPathItemOver : ""
                            }`}
                          >
                            <span className={styles.economyPathLabel}>
                              Path {i + 1}
                            </span>
                            <span
                              className={`${styles.economyPathStat} ${
                                path.actions > 1
                                  ? styles.economyOver
                                  : styles.economyOk
                              }`}
                            >
                              A:{path.actions}
                            </span>
                            <span
                              className={`${styles.economyPathStat} ${
                                path.bonusActions > 1
                                  ? styles.economyOver
                                  : styles.economyOk
                              }`}
                            >
                              B:{path.bonusActions}
                            </span>
                            <span
                              className={`${styles.economyPathStat} ${
                                path.reactions > 1
                                  ? styles.economyOver
                                  : styles.economyOk
                              }`}
                            >
                              R:{path.reactions}
                            </span>
                            {path.nodeLabels.length > 0 && (
                              <span className={styles.economyPathNodes}>
                                {path.nodeLabels.join(" → ")}
                              </span>
                            )}
                          </li>
                        );
                      })}
                      {actionEconomyInfo.budgets.length > 12 && (
                        <li className={styles.economyPathMore}>
                          +{actionEconomyInfo.budgets.length - 12} more paths
                        </li>
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
          {/* Concentration chip */}
          <button
            type="button"
            className={`${styles.loadoutChip} ${
              concentrationInfo.conflictIds.length > 0
                ? styles.concentrationChipConflict
                : concentrationInfo.spells.length > 0
                  ? styles.concentrationChipArmed
                  : ""
            }`}
            onClick={() => setShowConcentrationPopover((v) => !v)}
            title="Concentration spells on this chart"
          >
            <Focus size={13} />
            Concentration
            {concentrationInfo.spells.length > 0 && (
              <span className={styles.concentrationCount}>
                {concentrationInfo.spells.length}
              </span>
            )}
          </button>
          {showConcentrationPopover && (
            <div
              className={styles.concentrationPopover}
              onMouseLeave={() => setShowConcentrationPopover(false)}
            >
              <div className={styles.concentrationPopoverHeader}>
                Concentration Spells
              </div>
              {concentrationInfo.spells.length === 0 ? (
                <div className={styles.concentrationPopoverEmpty}>
                  No concentration spells on this chart.
                </div>
              ) : (
                <ul className={styles.concentrationPopoverList}>
                  {concentrationInfo.spells.map((s) => (
                    <li
                      key={s.id}
                      className={`${styles.concentrationPopoverItem} ${
                        concentrationInfo.conflictIds.includes(s.id)
                          ? styles.concentrationPopoverItemConflict
                          : ""
                      }`}
                    >
                      {concentrationInfo.conflictIds.includes(s.id) && (
                        <span
                          className={styles.concentrationPopoverWarnIcon}
                          title="Conflict: another concentration spell is on the same branch"
                        >
                          ⚠
                        </span>
                      )}
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* Stats chip */}
          <button
            type="button"
            className={`${styles.loadoutChip} ${character?.abilityScores ? styles.loadoutChipArmed : ""}`}
            onClick={() => setShowStatsPicker(true)}
            title="Configure ability scores"
          >
            <BarChart2 size={13} />
            Stats
          </button>
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
          {/* Share button */}
          <button
            type="button"
            className={`${styles.actionBtn} ${isCopied ? styles.shareBtnActive : ""}`}
            onClick={handleShare}
            title="Copy shareable link to clipboard"
          >
            {isCopied ? <Check size={14} /> : <Link2 size={14} />}
            {isCopied ? "Copied!" : "Share"}
          </button>
          {/* Animate edges toggle */}
          <button
            type="button"
            className={`${styles.actionBtn} ${animatedEdges ? styles.animateBtnActive : ""}`}
            onClick={() => setAnimatedEdges((v) => !v)}
            title={animatedEdges ? "Disable edge animation" : "Animate edges"}
          >
            <Zap size={14} />
            Animate
          </button>
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

      {/* Stats editor modal */}
      {showStatsPicker && character && (
        <StatsEditor
          character={character}
          onSave={(scores) => {
            setAbilityScores(scores);
            setShowStatsPicker(false);
          }}
          onClose={() => setShowStatsPicker(false)}
        />
      )}

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
            onConcentrationChange={handleConcentrationChange}
            onActionEconomyChange={handleActionEconomyChange}
            edgeStyle={edgeStyle}
            animatedEdges={animatedEdges}
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
        <span>Hover spell cards for full descriptions</span>
      </div>
    </div>
  );
}
