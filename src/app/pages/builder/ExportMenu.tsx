import {
  Activity,
  BarChart2,
  Check,
  Download,
  FileText,
  Focus,
  GitMerge,
  Layers,
  Link2,
  MoreHorizontal,
  Printer,
  Save,
  Sword,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { CLASSES } from "../../data/classes";
import type { SavedFlowchart, SelectionGroup } from "../../types";
import styles from "../FlowchartBuilder.module.css";

export interface ExportMenuProps {
  isSaved: boolean;
  isCopied: boolean;
  isCompact: boolean;
  isNarrow: boolean;
  openTabIds: string[];
  savedFlowcharts: SavedFlowchart[];
  activeTabId: string | null;
  animatedEdges: boolean;
  bundleEdges: boolean;
  // Collapsed toolbar state (shown when isNarrow)
  economyHudHidden: boolean;
  showEconomyPopover: boolean;
  actionEconomyOverBudget: boolean;
  hasSlotsToTrack: boolean;
  totalSlotsSpent: number;
  isWarlock: boolean;
  selectionGroups: SelectionGroup[];
  concentrationSpellCount: number;
  concentrationConflict: boolean;
  hasAbilityScores: boolean;
  hasLoadout: boolean;
  // Callbacks
  onSave: () => void;
  onShare: () => void;
  onExportJpg: () => void;
  onExportPdf: () => void;
  onPrintCard: () => void;
  onSetActiveTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onToggleAnimatedEdges: () => void;
  onToggleBundleEdges: () => void;
  onToggleEconomyPopover: () => void;
  onToggleSlotsPopover: () => void;
  onToggleGroupsPopover: () => void;
  onToggleConcentrationPopover: () => void;
  onShowStatsPicker: () => void;
  onShowLoadoutPicker: () => void;
}

export function ExportMenu({
  isSaved,
  isCopied,
  isCompact,
  isNarrow,
  openTabIds,
  savedFlowcharts,
  activeTabId,
  animatedEdges,
  bundleEdges,
  economyHudHidden,
  showEconomyPopover,
  actionEconomyOverBudget,
  hasSlotsToTrack,
  totalSlotsSpent,
  isWarlock,
  selectionGroups,
  concentrationSpellCount,
  concentrationConflict,
  hasAbilityScores,
  hasLoadout,
  onSave,
  onShare,
  onExportJpg,
  onExportPdf,
  onPrintCard,
  onSetActiveTab,
  onCloseTab,
  onToggleAnimatedEdges,
  onToggleBundleEdges,
  onToggleEconomyPopover,
  onToggleSlotsPopover,
  onToggleGroupsPopover,
  onToggleConcentrationPopover,
  onShowStatsPicker,
  onShowLoadoutPicker,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        e.target instanceof Element &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <div className={styles.exportMenuWrapper} ref={menuRef}>
      <button
        type="button"
        className={`${styles.actionBtn} ${isSaved ? styles.savedBtn : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        title="Save & Export options"
      >
        <MoreHorizontal size={14} />
        {isSaved ? "Saved!" : "Menu"}
      </button>

      {isOpen && (
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
                        onSetActiveTab(id);
                        close();
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
                      onClick={() => onCloseTab(id)}
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

          {/* ── Collapsed toolbar items (≤ 1700 px) ── */}
          {isNarrow && (
            <>
              <div className={styles.exportMenuTabHeader}>Toolbar</div>
              {!economyHudHidden && (
                <button
                  type="button"
                  className={`${styles.exportMenuItem} ${
                    actionEconomyOverBudget
                      ? styles.exportMenuItemAlert
                      : showEconomyPopover
                        ? styles.exportMenuItemActive
                        : ""
                  }`}
                  onClick={() => {
                    onToggleEconomyPopover();
                    close();
                  }}
                >
                  <Activity size={14} />
                  Economy
                  {actionEconomyOverBudget && (
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
                    onToggleSlotsPopover();
                    close();
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
                  selectionGroups.length > 0 ? styles.exportMenuItemActive : ""
                }`}
                onClick={() => {
                  onToggleGroupsPopover();
                  close();
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
                  concentrationConflict
                    ? styles.exportMenuItemAlert
                    : concentrationSpellCount > 0
                      ? styles.exportMenuItemActive
                      : ""
                }`}
                onClick={() => {
                  onToggleConcentrationPopover();
                  close();
                }}
              >
                <Focus size={14} />
                Concentration
                {concentrationSpellCount > 0 && (
                  <span className={styles.exportMenuItemCheck}>
                    {concentrationSpellCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`${styles.exportMenuItem} ${
                  hasAbilityScores ? styles.exportMenuItemActive : ""
                }`}
                onClick={() => {
                  onShowStatsPicker();
                  close();
                }}
              >
                <BarChart2 size={14} />
                Stats
              </button>
              <button
                type="button"
                className={`${styles.exportMenuItem} ${
                  hasLoadout ? styles.exportMenuItemActive : ""
                }`}
                onClick={() => {
                  onShowLoadoutPicker();
                  close();
                }}
              >
                <Sword size={14} />
                Loadout
              </button>
              <div className={styles.exportMenuDivider} />
            </>
          )}

          {/* ── Core actions ── */}
          <button
            type="button"
            className={`${styles.exportMenuItem} ${isSaved ? styles.exportMenuItemSuccess : ""}`}
            onClick={() => {
              onSave();
              close();
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
              onShare();
              close();
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
              onExportJpg();
              close();
            }}
          >
            <Download size={14} />
            Export JPG
          </button>
          <button
            type="button"
            className={styles.exportMenuItem}
            onClick={() => {
              onExportPdf();
              close();
            }}
          >
            <FileText size={14} />
            Export PDF
          </button>
          <button
            type="button"
            className={styles.exportMenuItem}
            onClick={() => {
              onPrintCard();
              close();
            }}
            title="Export condensed A5 reference card as PDF"
          >
            <Printer size={14} />
            Print Card
          </button>
          <div className={styles.exportMenuDivider} />
          <button
            type="button"
            className={`${styles.exportMenuItem} ${animatedEdges ? styles.exportMenuItemActive : ""}`}
            onClick={onToggleAnimatedEdges}
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
            onClick={onToggleBundleEdges}
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
  );
}
