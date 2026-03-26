import React from "react";
import { Icon } from "../../components/Icon";
import { CLASSES } from "../../data/classes";
import combatIcon from "../../icons/game/combat.svg";
import crossIcon from "../../icons/util/cross.svg";
import type { SavedFlowchart } from "../../types";
import styles from "../CharacterSetup.module.css";

interface SavedFlowchartsListProps {
  charts: SavedFlowchart[];
  onLoad: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function SavedFlowchartsList({
  charts,
  onLoad,
  onDelete,
}: SavedFlowchartsListProps) {
  if (charts.length === 0) return null;

  return (
    <section className={styles.savedSection}>
      <h2 className={styles.sectionTitle}>Saved Flowcharts</h2>
      <div className={styles.savedList}>
        {charts.map((chart) => {
          const cls = CLASSES.find((c) => c.id === chart.character.class);
          return (
            <div
              key={chart.id}
              role="button"
              tabIndex={0}
              className={styles.savedCard}
              onClick={() => onLoad(chart.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onLoad(chart.id);
              }}
            >
              <div className={styles.savedCardLeft}>
                <span className={styles.savedCardIcon}>
                  <Icon src={cls?.icon ?? combatIcon} size={26} />
                </span>
                <div className={styles.savedCardInfo}>
                  <span className={styles.savedCardName}>{chart.name}</span>
                  <span className={styles.savedCardMeta}>
                    {cls?.name ?? chart.character.class} Lv{" "}
                    {chart.character.level}
                    {(chart.character.secondaryClasses ?? [])
                      .map((sc) => {
                        const sc2 = CLASSES.find((c) => c.id === sc.class);
                        return ` / ${sc2?.name ?? sc.class} Lv ${sc.level}`;
                      })
                      .join("")}
                    {" · "}
                    {new Date(chart.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.deleteSavedBtn}
                onClick={(e) => onDelete(e, chart.id)}
                title="Delete flowchart"
              >
                <Icon src={crossIcon} size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
