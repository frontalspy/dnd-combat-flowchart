import { Layers } from "lucide-react";
import React from "react";
import styles from "../FlowchartBuilder.module.css";

interface SpellSlotsHudProps {
  hasSlotsToTrack: boolean;
  totalSlotsSpent: number;
  showSlotsPopover: boolean;
  isWarlock: boolean;
  slotLevels: number[];
  maxSlots: Record<number, number>;
  spellSlots: Record<number, number>;
  onTogglePopover: () => void;
  onClosePopover: () => void;
  spendSlot: (level: number) => void;
  restoreSlot: (level: number) => void;
  restoreSpellSlots: () => void;
}

export function SpellSlotsHud({
  hasSlotsToTrack,
  totalSlotsSpent,
  showSlotsPopover,
  isWarlock,
  slotLevels,
  maxSlots,
  spellSlots,
  onTogglePopover,
  onClosePopover,
  spendSlot,
  restoreSlot,
  restoreSpellSlots,
}: SpellSlotsHudProps) {
  if (!hasSlotsToTrack) return null;

  return (
    <>
      <button
        type="button"
        className={`${styles.loadoutChip} ${totalSlotsSpent > 0 ? styles.slotsChipArmed : ""}`}
        onClick={onTogglePopover}
        title="Spell slot tracker"
      >
        <Layers size={13} />
        Slots
        {totalSlotsSpent > 0 && (
          <span className={styles.slotsSpentBadge}>{totalSlotsSpent}</span>
        )}
      </button>

      {showSlotsPopover && (
        <div className={styles.slotsPopover} onMouseLeave={onClosePopover}>
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
              const remaining = spellSlots[lvl] ?? max;
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
    </>
  );
}
