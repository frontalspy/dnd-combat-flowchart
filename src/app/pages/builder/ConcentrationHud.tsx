import { Focus } from "lucide-react";
import React from "react";
import styles from "../FlowchartBuilder.module.css";

interface ConcentrationHudProps {
  concentrationInfo: {
    spells: Array<{ id: string; label: string }>;
    conflictIds: string[];
  };
  showConcentrationPopover: boolean;
  onTogglePopover: () => void;
  onClosePopover: () => void;
}

export function ConcentrationHud({
  concentrationInfo,
  showConcentrationPopover,
  onTogglePopover,
  onClosePopover,
}: ConcentrationHudProps) {
  const hasConflict = concentrationInfo.conflictIds.length > 0;
  const hasSpells = concentrationInfo.spells.length > 0;

  return (
    <>
      <button
        type="button"
        className={`${styles.loadoutChip} ${
          hasConflict
            ? styles.concentrationChipConflict
            : hasSpells
              ? styles.concentrationChipArmed
              : ""
        }`}
        onClick={onTogglePopover}
        title="Concentration spells on this chart"
      >
        <Focus size={13} />
        Concentration
        {hasSpells && (
          <span className={styles.concentrationCount}>
            {concentrationInfo.spells.length}
          </span>
        )}
      </button>

      {showConcentrationPopover && (
        <div
          className={styles.concentrationPopover}
          onMouseLeave={onClosePopover}
        >
          <div className={styles.concentrationPopoverHeader}>
            Concentration Spells
          </div>

          {!hasSpells ? (
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
    </>
  );
}
