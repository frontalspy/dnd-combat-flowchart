import type { Node } from "@xyflow/react";
import { ReactFlowProvider } from "@xyflow/react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import {
  Activity,
  BarChart2,
  BookOpen,
  Check,
  ChevronLeft,
  Download,
  Edit2,
  FileText,
  Focus,
  GitMerge,
  Layers,
  Link2,
  Menu,
  MoreHorizontal,
  MousePointer2,
  Printer,
  Save,
  Sword,
  X,
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
  GROUP_COLORS,
  type PathBudget,
} from "../components/FlowCanvas";
import { LoadoutPicker } from "../components/LoadoutPicker";
import { MultiSelectBar } from "../components/MultiSelectBar";
import { NodeEditor } from "../components/NodeEditor";
import { PRINT_H, PRINT_W, PrintLayout } from "../components/PrintLayout";
import { SpellPanel } from "../components/SpellPanel";
import { StatsEditor } from "../components/StatsEditor";
import { TabBar } from "../components/TabBar";
import { useApp } from "../context/AppContext";
import { TouchDropContext } from "../context/TouchDropContext";
import {
  CLASSES,
  getMulticlassSpellSlots,
  getSpellSlots,
} from "../data/classes";
import { ACTION_TYPE_LABELS } from "../data/damageTypes";
import type { Weapon } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import { useViewportWidth } from "../hooks/useViewportWidth";
import type { SavedFlowchart, SelectionGroup, WeaponLoadout } from "../types";
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
    setCharacterLevel,
    spendSlot,
    restoreSlot,
    restoreSpellSlots,
    addCustomWeapon,
    addCustomAction,
    setActiveTab,
    closeTab,
  } = useApp();
  const {
    character: globalCharacter,
    activeTabId,
    customWeapons,
    openTabIds,
    savedFlowcharts,
  } = state;

  const activeChart = getActiveFlowchart();
  const character = activeChart?.character ?? globalCharacter;

  // Per-tab state: name, saved flash, editing name
  const [chartName, setChartName] = useState(
    activeChart?.name ?? "My Combat Flow"
  );
  const [editingName, setEditingName] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [edgeStyle] = useState<EdgeStyleType>("step");
  const [animatedEdges, setAnimatedEdges] = useState(false);
  const [bundleEdges, setBundleEdges] = useState(false);
  const [spellPanelCollapsed, setSpellPanelCollapsed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showLoadoutPicker, setShowLoadoutPicker] = useState(false);
  const [showStatsPicker, setShowStatsPicker] = useState(false);
  const [showSlotsPopover, setShowSlotsPopover] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [spellPanelOpen, setSpellPanelOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectionGroups, setSelectionGroups] = useState<SelectionGroup[]>(
    () => activeChart?.selectionGroups ?? []
  );
  const [printData, setPrintData] = useState<{
    nodes: Node[];
    edges: unknown[];
  } | null>(null);
  const printLayoutRef = useRef<HTMLDivElement>(null);
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
  const [showGroupsPopover, setShowGroupsPopover] = useState(false);

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

  const handleSaveLoadout = useCallback(
    (loadout: WeaponLoadout) => {
      setLoadout(loadout);
    },
    [setLoadout]
  );

  // Keep chart + group state in sync when active tab changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only sync on tab switch, not on every chart data change
  useEffect(() => {
    setChartName(activeChart?.name ?? "My Combat Flow");
    setSelectionGroups(activeChart?.selectionGroups ?? []);
    setEditingName(false);
    setSelectedNodes([]);
    setIsSaved(false);
    setSpellPanelCollapsed(false);
  }, [activeTabId]);

  const exportFnsRef = useRef<FlowCanvasExports | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
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

  /** Stable callback for touch drag-to-canvas — reads exportFnsRef at call time. */
  const touchDropAtPosition = useCallback(
    (clientX: number, clientY: number, data: unknown) => {
      exportFnsRef.current?.dropAtPosition(clientX, clientY, data);
    },
    []
  );

  const touchCloseLibrary = useCallback(() => {
    setSpellPanelOpen(false);
  }, []);

  const handleFlowChange = useCallback((nodes: Node[], edges: unknown[]) => {
    flowDataRef.current = { nodes, edges };
    setIsSaved(false);
    // Prune groups whose members were deleted
    setSelectionGroups((prev) => {
      const nodeIdSet = new Set(nodes.map((n: Node) => n.id));
      const pruned = prev
        .map((g) => ({
          ...g,
          nodeIds: g.nodeIds.filter((id) => nodeIdSet.has(id)),
        }))
        .filter((g) => g.nodeIds.length >= 2);
      return pruned.length === prev.length &&
        pruned.every((g, i) => g.nodeIds.length === prev[i].nodeIds.length)
        ? prev
        : pruned;
    });
  }, []);

  const handleCreateGroup = useCallback((nodeIds: string[], name: string) => {
    setSelectionGroups((prev) => {
      // Remove those nodes from any existing group first
      const cleaned = prev
        .map((g) => ({
          ...g,
          nodeIds: g.nodeIds.filter((id) => !nodeIds.includes(id)),
        }))
        .filter((g) => g.nodeIds.length >= 2);
      return [
        ...cleaned,
        {
          id: `sg-${Date.now()}`,
          label: name,
          nodeIds,
        },
      ];
    });
  }, []);

  const handleDisbandGroup = useCallback((groupId: string) => {
    setSelectionGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const handleRemoveFromGroup = useCallback(
    (nodeId: string, groupId: string) => {
      setSelectionGroups((prev) =>
        prev
          .map((g) =>
            g.id === groupId
              ? { ...g, nodeIds: g.nodeIds.filter((id) => id !== nodeId) }
              : g
          )
          .filter((g) => g.nodeIds.length >= 2)
      );
    },
    []
  );

  const handleRenameGroup = useCallback((groupId: string, name: string) => {
    setSelectionGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, label: name } : g))
    );
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
      selectionGroups,
      createdAt: activeChart?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    saveFlowchart(chart);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [
    activeChart,
    activeTabId,
    character,
    chartName,
    saveFlowchart,
    selectionGroups,
  ]);

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
      } else if (e.key === "[" && !mod) {
        // Toggle spell panel collapse (desktop only — the collapsed prop is guarded in JSX)
        setSpellPanelCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        exportMenuRef.current &&
        e.target instanceof Element &&
        !exportMenuRef.current.contains(e.target)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu]);

  // Print card capture: wait for PrintLayout to render, then capture via html-to-image
  useEffect(() => {
    if (!printData) return;
    const name = chartName;
    const timer = setTimeout(async () => {
      const el = printLayoutRef.current;
      if (!el) return;
      try {
        const dataUrl = await toPng(el, {
          backgroundColor: "#ffffff",
          width: PRINT_W,
          height: PRINT_H,
          pixelRatio: 1,
          skipFonts: true,
        });
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [148, 210],
        });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        pdf.addImage(dataUrl, "PNG", 0, 0, pw, ph);
        pdf.save(`${name}-reference-card.pdf`);
      } finally {
        setPrintData(null);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [printData, chartName]);

  const handleShare = useCallback(() => {
    if (!character) return;
    const id = activeChart?.id ?? activeTabId ?? `chart-${Date.now()}`;
    const chart: SavedFlowchart = {
      id,
      name: chartName,
      character,
      nodes: flowDataRef.current.nodes,
      edges: flowDataRef.current.edges,
      selectionGroups,
      createdAt: activeChart?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    const encoded = encodeFlowchart(chart);
    const url = `${window.location.origin}${window.location.pathname}?${SHARE_PARAM}=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [activeChart, activeTabId, character, chartName, selectionGroups]);

  // Spell slot tracker — must be before early return to satisfy hooks ordering
  const maxSlots = useMemo(
    () => (character ? getMulticlassSpellSlots(character) : {}),
    [character]
  );
  const slotLevels = useMemo(
    () =>
      Object.keys(maxSlots)
        .map(Number)
        .sort((a, b) => a - b),
    [maxSlots]
  );

  const handleExportJpg = useCallback(async () => {
    await exportFnsRef.current?.exportJpg(chartName);
  }, [chartName]);

  const handleExportPdf = useCallback(async () => {
    await exportFnsRef.current?.exportPdf(chartName);
  }, [chartName]);

  const handlePrintCard = useCallback(() => {
    setPrintData({
      nodes: flowDataRef.current.nodes,
      edges: flowDataRef.current.edges,
    });
    setShowExportMenu(false);
  }, []);

  const viewportWidth = useViewportWidth();
  const isPhone = viewportWidth <= 600;
  const isTablet = viewportWidth >= 601 && viewportWidth <= 899;
  const isCompact = viewportWidth <= 1200;
  const isNarrow = viewportWidth <= 1700;

  if (!character) {
    goToSetup();
    return null;
  }

  const classDef = CLASSES.find((c) => c.id === character.class);
  const subclassDef = classDef?.subclasses.find(
    (s) => s.id === character.subclass
  );

  // Spell slot tracker (character is guaranteed non-null here)
  const hasSlotsToTrack = slotLevels.length > 0;
  const isWarlock =
    character.class === "warlock" ||
    (character.secondaryClasses ?? []).some((sc) => sc.class === "warlock");
  const totalSlotsSpent = slotLevels.reduce((sum, lvl) => {
    const max = maxSlots[lvl] ?? 0;
    const remaining = state.spellSlots[lvl] ?? max;
    return sum + (max - remaining);
  }, 0);

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
          {isTablet && (
            <button
              type="button"
              className={`${styles.panelToggleBtn} ${
                spellPanelOpen ? styles.panelToggleBtnActive : ""
              }`}
              onClick={() => setSpellPanelOpen((v) => !v)}
              title={spellPanelOpen ? "Close library" : "Open library"}
              aria-label="Toggle spell library"
            >
              <Menu size={14} />
            </button>
          )}
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
                    {(["action", "bonus", "reaction"] as const).map((type) => {
                      const info = ACTION_TYPE_LABELS[type];
                      const count =
                        type === "action"
                          ? worstCase.actions
                          : type === "bonus"
                            ? worstCase.bonusActions
                            : worstCase.reactions;
                      const over = count > 1;
                      return (
                        <div key={type} className={styles.economyBudgetGroup}>
                          <span
                            className={styles.economyActionBadge}
                            style={{
                              backgroundColor: info.color,
                              color: "#0d1117",
                            }}
                            title={info.label}
                          >
                            {info.short}
                          </span>
                          <span
                            className={`${styles.economyBudgetCount} ${
                              over ? styles.economyOver : styles.economyOk
                            }`}
                          >
                            {count}/1 {over ? "⚠" : "✓"}
                          </span>
                        </div>
                      );
                    })}
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
                            {(["action", "bonus", "reaction"] as const).map(
                              (type) => {
                                const info = ACTION_TYPE_LABELS[type];
                                const count =
                                  type === "action"
                                    ? path.actions
                                    : type === "bonus"
                                      ? path.bonusActions
                                      : path.reactions;
                                const over = count > 1;
                                return (
                                  <span
                                    key={type}
                                    className={styles.economyPathStatGroup}
                                  >
                                    <span
                                      className={styles.economyActionBadgeSm}
                                      style={{
                                        backgroundColor: info.color,
                                        color: "#0d1117",
                                      }}
                                      title={info.label}
                                    >
                                      {info.short}
                                    </span>
                                    <span
                                      className={`${styles.economyPathStat} ${
                                        over
                                          ? styles.economyOver
                                          : styles.economyOk
                                      }`}
                                    >
                                      {count}
                                    </span>
                                  </span>
                                );
                              }
                            )}
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
          {/* Spell Slots chip */}
          {hasSlotsToTrack && (
            <button
              type="button"
              className={`${styles.loadoutChip} ${
                totalSlotsSpent > 0 ? styles.slotsChipArmed : ""
              }`}
              onClick={() => setShowSlotsPopover((v) => !v)}
              title="Spell slot tracker"
            >
              <Layers size={13} />
              Slots
              {totalSlotsSpent > 0 && (
                <span className={styles.slotsSpentBadge}>
                  {totalSlotsSpent}
                </span>
              )}
            </button>
          )}
          {showSlotsPopover && hasSlotsToTrack && (
            <div
              className={styles.slotsPopover}
              onMouseLeave={() => setShowSlotsPopover(false)}
            >
              <div className={styles.slotsPopoverHeader}>
                <span>{isWarlock ? "Pact Magic" : "Spell Slots"}</span>
                <button
                  type="button"
                  className={styles.slotsRestoreBtn}
                  onClick={restoreSpellSlots}
                  title={
                    isWarlock
                      ? "Short Rest — restore pact slots"
                      : "Long Rest — restore all slots"
                  }
                >
                  {isWarlock ? "Short Rest ↺" : "Long Rest ↺"}
                </button>
              </div>
              <ul className={styles.slotsLevelList}>
                {slotLevels.map((lvl) => {
                  const max = maxSlots[lvl] ?? 0;
                  const remaining = state.spellSlots[lvl] ?? max;
                  const ordSuffix = [, "st", "nd", "rd"][lvl] ?? "th";
                  return (
                    <li key={lvl} className={styles.slotsLevelRow}>
                      <span className={styles.slotsLevelLabel}>
                        {isWarlock
                          ? `${lvl}${ordSuffix} level`
                          : `${lvl}${ordSuffix}`}
                      </span>
                      <span className={styles.slotsCircles}>
                        {Array.from(
                          { length: max },
                          (_, ci) => `${lvl}-${ci + 1}`
                        ).map((slotKey, ci) => {
                          const filled = ci < remaining;
                          return (
                            <button
                              key={slotKey}
                              type="button"
                              className={`${styles.slotCircle} ${filled ? styles.slotCircleFilled : styles.slotCircleEmpty}`}
                              onClick={() => {
                                if (filled) spendSlot(lvl);
                                else restoreSlot(lvl);
                              }}
                              title={
                                filled
                                  ? `Use ${lvl}${ordSuffix}-level slot`
                                  : `Restore ${lvl}${ordSuffix}-level slot`
                              }
                            />
                          );
                        })}
                      </span>
                      <span className={styles.slotsCount}>
                        {remaining}/{max}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {/* Concentration chip */}
          <button
            type="button"
            className={`${styles.loadoutChip} ${selectionGroups.length > 0 ? styles.groupsChipArmed : ""}`}
            onClick={() => setShowGroupsPopover((v) => !v)}
            title="Active selection groups"
          >
            <Layers size={13} />
            Groups
            {selectionGroups.length > 0 && (
              <span className={styles.groupsCount}>
                {selectionGroups.length}
              </span>
            )}
          </button>
          {showGroupsPopover && (
            <div
              className={styles.groupsPopover}
              onMouseLeave={() => setShowGroupsPopover(false)}
            >
              <div className={styles.groupsPopoverHeader}>Selection Groups</div>
              {selectionGroups.length === 0 ? (
                <div className={styles.groupsPopoverEmpty}>
                  No groups yet. Multi-select nodes and click &ldquo;Group
                  Selection&rdquo;.
                </div>
              ) : (
                <ul className={styles.groupsPopoverList}>
                  {selectionGroups.map((group, idx) => {
                    const color = GROUP_COLORS[idx % GROUP_COLORS.length];
                    return (
                      <li key={group.id} className={styles.groupsPopoverItem}>
                        <span
                          className={styles.groupsColorDot}
                          style={{ background: color }}
                        />
                        <button
                          type="button"
                          className={styles.groupsSelectBtn}
                          onClick={() => {
                            exportFnsRef.current?.focusNodes(group.nodeIds);
                            setShowGroupsPopover(false);
                          }}
                          title="Click to select all nodes in this group"
                        >
                          {group.label}
                        </button>
                        <span className={styles.groupsMemberCount}>
                          {group.nodeIds.length} nodes
                        </span>
                        <button
                          type="button"
                          className={styles.groupsDisbandBtn}
                          onClick={() => handleDisbandGroup(group.id)}
                          title="Disband group"
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
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
          {/* Export / Save menu */}
          <div className={styles.exportMenuWrapper} ref={exportMenuRef}>
            <button
              type="button"
              className={`${styles.actionBtn} ${isSaved ? styles.savedBtn : ""}`}
              onClick={() => setShowExportMenu((v) => !v)}
              title="Save & Export options"
            >
              <MoreHorizontal size={14} />
              {isSaved ? "Saved!" : "Menu"}
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu}>
                {/* ── Mobile tabs section ── */}
                {isCompact && openTabIds.length > 0 && (
                  <>
                    <div className={styles.exportMenuTabHeader}>Open Tabs</div>
                    {openTabIds.map((id) => {
                      const chart = savedFlowcharts.find((f) => f.id === id);
                      const cls = chart
                        ? CLASSES.find((c) => c.id === chart.character.class)
                        : null;
                      const classLabel = chart
                        ? `${cls?.name ?? chart.character.class} ${chart.character.level}`
                        : null;
                      const isActiveTab = id === activeTabId;
                      return (
                        <div
                          key={id}
                          className={`${styles.exportMenuTabRow}${
                            isActiveTab ? ` ${styles.exportMenuTabActive}` : ""
                          }`}
                        >
                          <button
                            type="button"
                            className={styles.exportMenuTabSwitch}
                            onClick={() => {
                              setActiveTab(id);
                              setShowExportMenu(false);
                            }}
                          >
                            <span className={styles.exportMenuTabName}>
                              {chart?.name ?? "Unsaved Chart"}
                            </span>
                            {classLabel && (
                              <span className={styles.exportMenuTabMeta}>
                                {classLabel}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            className={styles.exportMenuTabClose}
                            onClick={() => closeTab(id)}
                            aria-label="Close tab"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                    <div className={styles.exportMenuDivider} />
                  </>
                )}
                {/* ── Collapsed toolbar items (≤1700px) ── */}
                {isNarrow && (
                  <>
                    <div className={styles.exportMenuTabHeader}>Toolbar</div>
                    {!economyHudHidden && (
                      <button
                        type="button"
                        className={`${styles.exportMenuItem} ${
                          actionEconomyInfo.overBudgetNodeIds.length > 0
                            ? styles.exportMenuItemAlert
                            : showEconomyPopover
                              ? styles.exportMenuItemActive
                              : ""
                        }`}
                        onClick={() => {
                          setShowEconomyPopover((v) => !v);
                          setShowExportMenu(false);
                        }}
                      >
                        <Activity size={14} />
                        Economy
                        {actionEconomyInfo.overBudgetNodeIds.length > 0 && (
                          <span className={styles.exportMenuItemCheck}>⚠</span>
                        )}
                      </button>
                    )}
                    {hasSlotsToTrack && (
                      <button
                        type="button"
                        className={`${styles.exportMenuItem} ${
                          totalSlotsSpent > 0 ? styles.exportMenuItemActive : ""
                        }`}
                        onClick={() => {
                          setShowSlotsPopover((v) => !v);
                          setShowExportMenu(false);
                        }}
                      >
                        <Layers size={14} />
                        {isWarlock ? "Pact Magic" : "Spell Slots"}
                        {totalSlotsSpent > 0 && (
                          <span className={styles.exportMenuItemCheck}>
                            {totalSlotsSpent} used
                          </span>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.exportMenuItem} ${
                        selectionGroups.length > 0
                          ? styles.exportMenuItemActive
                          : ""
                      }`}
                      onClick={() => {
                        setShowGroupsPopover((v) => !v);
                        setShowExportMenu(false);
                      }}
                    >
                      <Layers size={14} />
                      Groups
                      {selectionGroups.length > 0 && (
                        <span className={styles.exportMenuItemCheck}>
                          {selectionGroups.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`${styles.exportMenuItem} ${
                        concentrationInfo.conflictIds.length > 0
                          ? styles.exportMenuItemAlert
                          : concentrationInfo.spells.length > 0
                            ? styles.exportMenuItemActive
                            : ""
                      }`}
                      onClick={() => {
                        setShowConcentrationPopover((v) => !v);
                        setShowExportMenu(false);
                      }}
                    >
                      <Focus size={14} />
                      Concentration
                      {concentrationInfo.spells.length > 0 && (
                        <span className={styles.exportMenuItemCheck}>
                          {concentrationInfo.spells.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`${styles.exportMenuItem} ${
                        character?.abilityScores
                          ? styles.exportMenuItemActive
                          : ""
                      }`}
                      onClick={() => {
                        setShowStatsPicker(true);
                        setShowExportMenu(false);
                      }}
                    >
                      <BarChart2 size={14} />
                      Stats
                    </button>
                    <button
                      type="button"
                      className={`${styles.exportMenuItem} ${
                        character?.loadout?.mainHand
                          ? styles.exportMenuItemActive
                          : ""
                      }`}
                      onClick={() => {
                        setShowLoadoutPicker(true);
                        setShowExportMenu(false);
                      }}
                    >
                      <Sword size={14} />
                      Loadout
                    </button>
                    <div className={styles.exportMenuDivider} />
                  </>
                )}
                <button
                  type="button"
                  className={`${styles.exportMenuItem} ${isSaved ? styles.exportMenuItemSuccess : ""}`}
                  onClick={() => {
                    handleSave();
                    setShowExportMenu(false);
                  }}
                >
                  <Save size={14} />
                  Save
                  <span className={styles.exportMenuItemKbd}>Ctrl+S</span>
                </button>
                <button
                  type="button"
                  className={`${styles.exportMenuItem} ${isCopied ? styles.exportMenuItemSuccess : ""}`}
                  onClick={() => {
                    handleShare();
                    setShowExportMenu(false);
                  }}
                >
                  {isCopied ? <Check size={14} /> : <Link2 size={14} />}
                  {isCopied ? "Copied!" : "Share Link"}
                </button>
                <div className={styles.exportMenuDivider} />
                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    handleExportJpg();
                    setShowExportMenu(false);
                  }}
                >
                  <Download size={14} />
                  Export JPG
                </button>
                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    handleExportPdf();
                    setShowExportMenu(false);
                  }}
                >
                  <FileText size={14} />
                  Export PDF
                </button>
                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={handlePrintCard}
                  title="Export condensed A5 reference card as PDF"
                >
                  <Printer size={14} />
                  Print Card
                </button>
                <div className={styles.exportMenuDivider} />
                <button
                  type="button"
                  className={`${styles.exportMenuItem} ${animatedEdges ? styles.exportMenuItemActive : ""}`}
                  onClick={() => setAnimatedEdges((v) => !v)}
                >
                  <Zap size={14} />
                  Animate Edges
                  {animatedEdges && (
                    <span className={styles.exportMenuItemCheck}>✓</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`${styles.exportMenuItem} ${bundleEdges ? styles.exportMenuItemActive : ""}`}
                  onClick={() => setBundleEdges((v) => !v)}
                  title="Merge near-parallel edges into a single bundled edge with a count badge"
                >
                  <GitMerge size={14} />
                  Bundle Edges
                  {bundleEdges && (
                    <span className={styles.exportMenuItemCheck}>✓</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats editor modal */}
      {showStatsPicker && character && (
        <StatsEditor
          character={character}
          onSave={(scores, level) => {
            setAbilityScores(scores);
            setCharacterLevel(level);
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
          onAddCustomWeapon={addCustomWeapon}
          onSave={handleSaveLoadout}
          onClose={() => setShowLoadoutPicker(false)}
        />
      )}

      {/* Main layout */}
      <ReactFlowProvider>
        <TouchDropContext.Provider
          value={{
            dropAtPosition: touchDropAtPosition,
            closeLibrary: touchCloseLibrary,
          }}
        >
          <div className={styles.workspace}>
            {/* Dimmer overlay — tapping outside the drawer closes it on mobile/tablet */}
            {(isPhone || isTablet) && spellPanelOpen && (
              <div
                className={styles.drawerOverlay}
                onClick={() => setSpellPanelOpen(false)}
                aria-hidden="true"
              />
            )}

            <SpellPanel
              character={character}
              customWeapons={customWeapons}
              customActions={state.customActions}
              onAddCustomAction={addCustomAction}
              onDragStart={handleDragStart}
              isOpen={isPhone || isTablet ? spellPanelOpen : true}
              onClose={() => setSpellPanelOpen(false)}
              collapsed={!isPhone && !isTablet ? spellPanelCollapsed : false}
              onToggleCollapse={
                !isPhone && !isTablet
                  ? () => setSpellPanelCollapsed((v) => !v)
                  : undefined
              }
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
              selectionGroups={selectionGroups}
              bundleEdges={bundleEdges}
              selectMode={selectMode}
            />

            {/* Library FAB — phone only */}
            {isPhone && (
              <button
                type="button"
                className={styles.libraryFab}
                onClick={() => setSpellPanelOpen(true)}
                title="Open spell library"
                aria-label="Open spell library"
              >
                <BookOpen size={20} />
                <span>Library</span>
              </button>
            )}

            {/* Select mode toggle — phone and tablet */}
            {(isPhone || isTablet) && (
              <button
                type="button"
                className={`${styles.selectModeToggle} ${
                  selectMode ? styles.selectModeToggleActive : ""
                }`}
                onClick={() => setSelectMode((v) => !v)}
                title={
                  selectMode ? "Switch to pan mode" : "Switch to select mode"
                }
                aria-label={
                  selectMode ? "Switch to pan mode" : "Switch to select mode"
                }
              >
                <MousePointer2 size={16} />
              </button>
            )}

            {selectedNodes.length === 1 && (
              <NodeEditor
                selectedNode={selectedNodes[0]}
                onClose={() => setSelectedNodes([])}
                character={character}
                customWeapons={customWeapons}
                selectionGroups={selectionGroups}
                onRemoveFromGroup={handleRemoveFromGroup}
                onDisbandGroup={handleDisbandGroup}
                onRenameGroup={handleRenameGroup}
                isSheet={isPhone}
              />
            )}
            {selectedNodes.length > 1 && (
              <MultiSelectBar
                selectedNodes={selectedNodes}
                onDeselect={() => setSelectedNodes([])}
                selectionGroups={selectionGroups}
                onCreateGroup={handleCreateGroup}
                onDisbandGroup={handleDisbandGroup}
              />
            )}
          </div>
        </TouchDropContext.Provider>
      </ReactFlowProvider>

      {/* Print layout (off-screen, captured for reference card export) */}
      {printData && (
        <PrintLayout
          ref={printLayoutRef}
          nodes={printData.nodes}
          edges={printData.edges}
          chartName={chartName}
          characterLabel={
            character
              ? (() => {
                  const parts = [
                    `${classDef?.name ?? ""}${subclassDef?.name ? ` (${subclassDef.name})` : ""} Lv. ${character.level}`,
                    ...(character.secondaryClasses ?? []).map((sc) => {
                      const sc2Def = CLASSES.find((c) => c.id === sc.class);
                      const sc2SubDef = sc2Def?.subclasses.find(
                        (s) => s.id === sc.subclass
                      );
                      return `${sc2Def?.name ?? sc.class}${sc2SubDef ? ` (${sc2SubDef.name})` : ""} Lv. ${sc.level}`;
                    }),
                  ];
                  return parts.join(" / ");
                })()
              : ""
          }
        />
      )}

      {/* Keyboard hint — hidden on phone (keyboard shortcuts don't apply to touch) */}
      <div
        className={`${styles.hint}${isPhone ? ` ${styles.hintHidden}` : ""}`}
      >
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
        <span>[ toggles the library panel</span>
        <span>·</span>
        <span>Hover spell cards for full descriptions</span>
      </div>
    </div>
  );
}
