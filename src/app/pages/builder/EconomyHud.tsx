import { Activity } from "lucide-react";
import React from "react";
import { ACTION_TYPE_LABELS } from "../../data/damageTypes";
import type { PathBudget } from "../../types";
import styles from "../FlowchartBuilder.module.css";

interface EconomyHudProps {
  actionEconomyInfo: {
    budgets: PathBudget[];
    overBudgetNodeIds: string[];
  };
  worstCase: {
    actions: number;
    bonusActions: number;
    reactions: number;
  } | null;
  economyHudHidden: boolean;
  showEconomyPopover: boolean;
  onTogglePopover: () => void;
  onClosePopover: () => void;
  onHide: () => void;
  onRestore: () => void;
}

export function EconomyHud({
  actionEconomyInfo,
  worstCase,
  economyHudHidden,
  showEconomyPopover,
  onTogglePopover,
  onClosePopover,
  onHide,
  onRestore,
}: EconomyHudProps) {
  const hasAlert = actionEconomyInfo.overBudgetNodeIds.length > 0;

  return (
    <>
      {!economyHudHidden ? (
        <button
          type="button"
          className={`${styles.loadoutChip} ${
            hasAlert
              ? styles.economyChipAlert
              : worstCase
                ? styles.economyChipActive
                : ""
          }`}
          onClick={onTogglePopover}
          title="Action economy budget"
        >
          <Activity size={13} />
          Economy
          {hasAlert && <span className={styles.economyAlertBadge}>⚠</span>}
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.loadoutChip} ${hasAlert ? styles.economyChipAlert : ""}`}
          onClick={onRestore}
          title="Show action economy HUD"
        >
          <Activity size={13} />
        </button>
      )}

      {showEconomyPopover && !economyHudHidden && (
        <div className={styles.economyPopover} onMouseLeave={onClosePopover}>
          <div className={styles.economyPopoverHeader}>
            <span>Turn Budget</span>
            <button
              type="button"
              className={styles.economyPopoverCloseBtn}
              onClick={onHide}
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
                        className={`${styles.economyBudgetCount} ${over ? styles.economyOver : styles.economyOk}`}
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
                        className={`${styles.economyPathItem} ${isOverBudget ? styles.economyPathItemOver : ""}`}
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
                                  className={`${styles.economyPathStat} ${over ? styles.economyOver : styles.economyOk}`}
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
    </>
  );
}
