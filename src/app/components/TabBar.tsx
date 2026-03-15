import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { CLASSES } from "../data/classes";
import combatIcon from "../icons/game/combat.svg";
import buildIcon from "../icons/util/build.svg";
import crossIcon from "../icons/util/cross.svg";
import { Icon } from "./Icon";
import styles from "./TabBar.module.css";

export function TabBar() {
  const { state, openTab, closeTab, setActiveTab, goToSetup } = useApp();
  const { openTabIds, activeTabId, savedFlowcharts } = state;
  const [showModal, setShowModal] = useState(false);

  // Charts not yet open as tabs (available to open)
  const availableCharts = savedFlowcharts.filter(
    (f) => !openTabIds.includes(f.id)
  );

  const handleTabClick = (id: string) => {
    if (id !== activeTabId) setActiveTab(id);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    closeTab(id);
  };

  const handleOpenChart = (id: string) => {
    openTab(id);
    setShowModal(false);
  };

  const handleNewChart = () => {
    setShowModal(false);
    goToSetup();
  };

  return (
    <>
      <div className={styles.tabBar} role="tablist">
        {openTabIds.map((id) => {
          const chart = savedFlowcharts.find((f) => f.id === id);
          const cls = chart
            ? CLASSES.find((c) => c.id === chart.character.class)
            : null;
          const isActive = id === activeTabId;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => handleTabClick(id)}
              title={chart?.name ?? id}
            >
              <span className={styles.tabIcon}>
                <Icon src={cls?.icon ?? combatIcon} size={18} />
              </span>
              <div className={styles.tabInfo}>
                <span className={styles.tabName}>
                  {chart?.name ?? "Unsaved Chart"}
                </span>
                {cls && (
                  <span className={styles.tabMeta}>
                    {cls.name} · Lv {chart?.character.level}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={styles.tabClose}
                onClick={(e) => handleCloseTab(e, id)}
                title="Close tab"
                aria-label={`Close ${chart?.name ?? "tab"}`}
              >
                <Icon src={crossIcon} size={10} />
              </button>
            </button>
          );
        })}

        <button
          type="button"
          className={styles.addTabBtn}
          onClick={() => setShowModal(true)}
          title="Open a saved chart in a new tab"
          aria-label="Open chart in new tab"
        >
          <Icon src={buildIcon} size={16} />
        </button>
      </div>

      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Open in New Tab</h2>

            {/* New chart entry */}
            <button
              type="button"
              className={styles.modalItemNew}
              onClick={handleNewChart}
            >
              <span className={styles.modalItemIcon}>
                <Icon src={buildIcon} size={18} />
              </span>
              <div className={styles.modalItemInfo}>
                <span className={styles.modalItemName}>New Flowchart…</span>
                <span className={styles.modalItemMeta}>
                  Choose a class and build a fresh chart
                </span>
              </div>
            </button>

            {availableCharts.length > 0 && (
              <div className={styles.modalDivider}>Saved Charts</div>
            )}

            <div className={styles.modalList}>
              {availableCharts.map((chart) => {
                const cls = CLASSES.find((c) => c.id === chart.character.class);
                return (
                  <button
                    key={chart.id}
                    type="button"
                    className={styles.modalItem}
                    onClick={() => handleOpenChart(chart.id)}
                  >
                    <span className={styles.modalItemIcon}>
                      <Icon src={cls?.icon ?? combatIcon} size={18} />
                    </span>
                    <div className={styles.modalItemInfo}>
                      <span className={styles.modalItemName}>{chart.name}</span>
                      <span className={styles.modalItemMeta}>
                        {cls?.name ?? chart.character.class} · Lv{" "}
                        {chart.character.level} ·{" "}
                        {new Date(chart.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
