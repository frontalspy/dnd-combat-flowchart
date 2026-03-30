import type { Node } from "@xyflow/react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  BarChart2,
  BookOpen,
  Check,
  ChevronLeft,
  Edit2,
  Menu,
  MousePointer2,
  Sword,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { FlowCanvas } from "../components/FlowCanvas";
import { LoadoutPicker } from "../components/LoadoutPicker";
import { MultiSelectBar } from "../components/MultiSelectBar";
import { NodeEditor } from "../components/NodeEditor";
import { PrintLayout } from "../components/PrintLayout";
import { SpellPanel } from "../components/SpellPanel";
import { StatsEditor } from "../components/StatsEditor";
import { TabBar } from "../components/TabBar";
import { useApp } from "../context/AppContext";
import { TouchDropContext } from "../context/TouchDropContext";
import { CLASSES } from "../data/classes";
import { WEAPONS } from "../data/weapons";
import { useChartMeta } from "../hooks/useChartMeta";
import { useChartPersistence } from "../hooks/useChartPersistence";
import { useEdgeOptions } from "../hooks/useEdgeOptions";
import { useFlowRefs } from "../hooks/useFlowRefs";
import { useHudState } from "../hooks/useHudState";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { usePrintCard } from "../hooks/usePrintCard";
import { useSelectionGroups } from "../hooks/useSelectionGroups";
import { useSpellPanel } from "../hooks/useSpellPanel";
import { useSpellSlots } from "../hooks/useSpellSlots";
import { useViewportWidth } from "../hooks/useViewportWidth";
import type { EdgeStyleType, FlowCanvasExports, WeaponLoadout } from "../types";
import { ConcentrationHud } from "./builder/ConcentrationHud";
import { EconomyHud } from "./builder/EconomyHud";
import { ExportMenu } from "./builder/ExportMenu";
import { GroupsHud } from "./builder/GroupsHud";
import { SpellSlotsHud } from "./builder/SpellSlotsHud";
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

  // ── Custom hooks ─────────────────────────────────────────────────────────
  const { chartName, setChartName, editingName, setEditingName } = useChartMeta(
    activeChart,
    activeTabId
  );

  const {
    selectionGroups,
    createGroup,
    disbandGroup,
    removeFromGroup,
    renameGroup,
    pruneForNodes,
  } = useSelectionGroups(activeChart, activeTabId);

  const {
    exportFnsRef,
    flowDataRef,
    selectedNodes,
    setSelectedNodes,
    selectedNodesRef,
    handleDragStart,
    handleExportReady,
    handleTouchDrop,
  } = useFlowRefs(activeChart, activeTabId);

  const { isSaved, setIsSaved, isCopied, handleSave, handleShare } =
    useChartPersistence({
      character,
      activeChart,
      activeTabId,
      chartName,
      selectionGroups,
      flowDataRef,
      saveFlowchart,
    });

  const { printData, printLayoutRef, triggerPrint } = usePrintCard(chartName);

  const {
    spellPanelOpen,
    setSpellPanelOpen,
    spellPanelCollapsed,
    setSpellPanelCollapsed,
  } = useSpellPanel(activeTabId);

  const {
    edgeStyle,
    animatedEdges,
    setAnimatedEdges,
    bundleEdges,
    setBundleEdges,
  } = useEdgeOptions();

  const { maxSlots, slotLevels, hasSlotsToTrack, isWarlock, totalSlotsSpent } =
    useSpellSlots(character, state.spellSlots);

  const {
    showSlotsPopover,
    setShowSlotsPopover,
    showEconomyPopover,
    setShowEconomyPopover,
    economyHudHidden,
    setEconomyHudHidden,
    showGroupsPopover,
    setShowGroupsPopover,
    showConcentrationPopover,
    setShowConcentrationPopover,
    concentrationInfo,
    handleConcentrationChange,
    actionEconomyInfo,
    handleActionEconomyChange,
    worstCase,
  } = useHudState();

  useKeyboardShortcuts({
    exportFnsRef,
    selectedNodesRef,
    handleSave,
    setSelectedNodes,
    setSpellPanelCollapsed,
  });

  // ── Local UI state ────────────────────────────────────────────────────────
  const [showLoadoutPicker, setShowLoadoutPicker] = useState(false);
  const [showStatsPicker, setShowStatsPicker] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  // ── Callbacks that bridge multiple hooks ─────────────────────────────────

  const handleFlowChange = useCallback(
    (nodes: Node[], edges: unknown[]) => {
      flowDataRef.current = { nodes, edges };
      setIsSaved(false);
      pruneForNodes(nodes);
    },
    [flowDataRef, setIsSaved, pruneForNodes]
  );

  const handlePrintCard = useCallback(() => {
    triggerPrint(flowDataRef.current.nodes, flowDataRef.current.edges);
  }, [triggerPrint, flowDataRef]);

  const handleExportJpg = useCallback(async () => {
    await exportFnsRef.current?.exportJpg(chartName);
  }, [exportFnsRef, chartName]);

  const handleExportPdf = useCallback(async () => {
    await exportFnsRef.current?.exportPdf(chartName);
  }, [exportFnsRef, chartName]);

  const handleSaveLoadout = useCallback(
    (loadout: WeaponLoadout) => setLoadout(loadout),
    [setLoadout]
  );

  // ── Viewport breakpoints ──────────────────────────────────────────────────
  const viewportWidth = useViewportWidth();
  const isPhone = viewportWidth <= 600;
  const isTablet = viewportWidth >= 601 && viewportWidth <= 899;
  const isCompact = viewportWidth <= 1200;
  const isNarrow = viewportWidth <= 1700;

  if (!character) {
    goToSetup();
    return null;
  }

  // ── Derived display values ────────────────────────────────────────────────
  const classDef = CLASSES.find((c) => c.id === character.class);
  const subclassDef = classDef?.subclasses.find(
    (s) => s.id === character.subclass
  );

  const loadoutLabel = character.loadout?.mainHand
    ? (() => {
        const allWeapons = [...WEAPONS, ...customWeapons];
        const mh = allWeapons.find((w) => w.id === character.loadout?.mainHand);
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
    : "Loadout";

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
          <EconomyHud
            actionEconomyInfo={actionEconomyInfo}
            worstCase={worstCase}
            economyHudHidden={economyHudHidden}
            showEconomyPopover={showEconomyPopover}
            onTogglePopover={() => setShowEconomyPopover((v) => !v)}
            onClosePopover={() => setShowEconomyPopover(false)}
            onHide={() => {
              setEconomyHudHidden(true);
              setShowEconomyPopover(false);
            }}
            onRestore={() => setEconomyHudHidden(false)}
          />
          <SpellSlotsHud
            hasSlotsToTrack={hasSlotsToTrack}
            totalSlotsSpent={totalSlotsSpent}
            showSlotsPopover={showSlotsPopover}
            isWarlock={isWarlock}
            slotLevels={slotLevels}
            maxSlots={maxSlots}
            spellSlots={state.spellSlots}
            onTogglePopover={() => setShowSlotsPopover((v) => !v)}
            onClosePopover={() => setShowSlotsPopover(false)}
            spendSlot={spendSlot}
            restoreSlot={restoreSlot}
            restoreSpellSlots={restoreSpellSlots}
          />
          <GroupsHud
            selectionGroups={selectionGroups}
            showGroupsPopover={showGroupsPopover}
            onTogglePopover={() => setShowGroupsPopover((v) => !v)}
            onClosePopover={() => setShowGroupsPopover(false)}
            onDisbandGroup={disbandGroup}
            onFocusNodes={(ids) => exportFnsRef.current?.focusNodes(ids)}
          />
          <ConcentrationHud
            concentrationInfo={concentrationInfo}
            showConcentrationPopover={showConcentrationPopover}
            onTogglePopover={() => setShowConcentrationPopover((v) => !v)}
            onClosePopover={() => setShowConcentrationPopover(false)}
          />
          {/* Stats chip */}
          <button
            type="button"
            className={`${styles.loadoutChip} ${character.abilityScores ? styles.loadoutChipArmed : ""}`}
            onClick={() => setShowStatsPicker(true)}
            title="Configure ability scores"
          >
            <BarChart2 size={13} />
            Stats
          </button>
          {/* Loadout chip */}
          <button
            type="button"
            className={`${styles.loadoutChip} ${character.loadout?.mainHand ? styles.loadoutChipArmed : ""}`}
            onClick={() => setShowLoadoutPicker(true)}
            title="Configure weapon loadout"
          >
            <Sword size={13} />
            {loadoutLabel}
          </button>
          <span className={styles.topDivider} />
          <ExportMenu
            isSaved={isSaved}
            isCopied={isCopied}
            isCompact={isCompact}
            isNarrow={isNarrow}
            openTabIds={openTabIds}
            savedFlowcharts={savedFlowcharts}
            activeTabId={activeTabId}
            animatedEdges={animatedEdges}
            bundleEdges={bundleEdges}
            economyHudHidden={economyHudHidden}
            showEconomyPopover={showEconomyPopover}
            actionEconomyOverBudget={
              actionEconomyInfo.overBudgetNodeIds.length > 0
            }
            hasSlotsToTrack={hasSlotsToTrack}
            totalSlotsSpent={totalSlotsSpent}
            isWarlock={isWarlock}
            selectionGroups={selectionGroups}
            concentrationSpellCount={concentrationInfo.spells.length}
            concentrationConflict={concentrationInfo.conflictIds.length > 0}
            hasAbilityScores={!!character.abilityScores}
            hasLoadout={!!character.loadout?.mainHand}
            onSave={handleSave}
            onShare={handleShare}
            onExportJpg={handleExportJpg}
            onExportPdf={handleExportPdf}
            onPrintCard={handlePrintCard}
            onSetActiveTab={setActiveTab}
            onCloseTab={closeTab}
            onToggleAnimatedEdges={() => setAnimatedEdges((v) => !v)}
            onToggleBundleEdges={() => setBundleEdges((v) => !v)}
            onToggleEconomyPopover={() => setShowEconomyPopover((v) => !v)}
            onToggleSlotsPopover={() => setShowSlotsPopover((v) => !v)}
            onToggleGroupsPopover={() => setShowGroupsPopover((v) => !v)}
            onToggleConcentrationPopover={() =>
              setShowConcentrationPopover((v) => !v)
            }
            onShowStatsPicker={() => setShowStatsPicker(true)}
            onShowLoadoutPicker={() => setShowLoadoutPicker(true)}
          />
        </div>
      </header>

      {/* Stats editor modal */}
      {showStatsPicker && (
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
      {showLoadoutPicker && (
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
            dropAtPosition: handleTouchDrop,
            closeLibrary: () => setSpellPanelOpen(false),
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
                onRemoveFromGroup={removeFromGroup}
                onDisbandGroup={disbandGroup}
                onRenameGroup={renameGroup}
                onBeforeCommit={() => exportFnsRef.current?.takeSnapshot()}
                isSheet={isPhone}
              />
            )}
            {selectedNodes.length > 1 && (
              <MultiSelectBar
                selectedNodes={selectedNodes}
                onDeselect={() => setSelectedNodes([])}
                selectionGroups={selectionGroups}
                onCreateGroup={createGroup}
                onDisbandGroup={disbandGroup}
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
          characterLabel={(() => {
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
          })()}
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
