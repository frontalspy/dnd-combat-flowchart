import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { CLASSES } from "../data/classes";
import type { Character, DndClass } from "../types";
import styles from "./CharacterSetup.module.css";

export function CharacterSetup() {
  const {
    setCharacter,
    goToBuilder,
    state,
    setActiveFlowchart,
    deleteFlowchart,
    openTab,
  } = useApp();
  const [selectedClass, setSelectedClass] = useState<DndClass | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState("");
  const [level, setLevel] = useState(1);

  const classDef = selectedClass
    ? CLASSES.find((c) => c.id === selectedClass)
    : null;

  const handleClassSelect = (classId: DndClass) => {
    setSelectedClass(classId);
    setSelectedSubclass("");
  };

  const handleStart = () => {
    if (!selectedClass || !selectedSubclass) return;
    const character: Character = {
      class: selectedClass,
      subclass: selectedSubclass,
      level,
    };
    const draftId = `draft-${Date.now()}`;
    setActiveFlowchart(null);
    setCharacter(character);
    openTab(draftId);
    goToBuilder();
  };

  const handleLoadChart = (chartId: string) => {
    const chart = state.savedFlowcharts.find((f) => f.id === chartId);
    if (!chart) return;
    setCharacter(chart.character);
    setActiveFlowchart(chartId);
    openTab(chartId);
    goToBuilder();
  };

  const handleDeleteChart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this flowchart?")) {
      deleteFlowchart(id);
    }
  };

  return (
    <div className={styles.page}>
      {/* Decorative background */}
      <div className={styles.bgDecor} aria-hidden="true" />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logo}>⚔️</div>
          <h1 className={styles.title}>D&D Combat Flowchart Builder</h1>
          <p className={styles.subtitle}>
            Build visual combat decision trees for your class. Drag spells and
            actions, connect them with conditional branches, and export
            ready-to-table references.
          </p>
        </header>

        <div className={styles.layout}>
          {/* Setup form */}
          <section className={styles.setupCard}>
            <h2 className={styles.sectionTitle}>New Flowchart</h2>

            {/* Class selection */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Choose Your Class</label>
              <div className={styles.classGrid}>
                {CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    className={`${styles.classBtn} ${selectedClass === cls.id ? styles.classBtnActive : ""}`}
                    style={
                      selectedClass === cls.id
                        ? {
                            borderColor: cls.color,
                            boxShadow: `0 0 0 2px ${cls.color}33`,
                          }
                        : {}
                    }
                    onClick={() => handleClassSelect(cls.id)}
                  >
                    <span className={styles.classBtnIcon}>{cls.icon}</span>
                    <span className={styles.classBtnName}>{cls.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subclass */}
            {classDef && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Subclass</label>
                <select
                  className={styles.select}
                  value={selectedSubclass}
                  onChange={(e) => setSelectedSubclass(e.target.value)}
                >
                  <option value="">— Choose subclass —</option>
                  {classDef.subclasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Level */}
            {classDef && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Character Level:{" "}
                  <span className={styles.levelValue}>{level}</span>
                </label>
                <input
                  type="range"
                  className={styles.levelSlider}
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                />
                <div className={styles.levelPips}>
                  {[1, 5, 10, 15, 20].map((n) => (
                    <span key={n} className={styles.levelPip}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.startBtn}
              disabled={!selectedClass || !selectedSubclass}
              onClick={handleStart}
            >
              ⚔️ Start Building
            </button>
          </section>

          {/* Saved flowcharts */}
          {state.savedFlowcharts.length > 0 && (
            <section className={styles.savedSection}>
              <h2 className={styles.sectionTitle}>Saved Flowcharts</h2>
              <div className={styles.savedList}>
                {state.savedFlowcharts.map((chart) => {
                  const cls = CLASSES.find(
                    (c) => c.id === chart.character.class
                  );
                  return (
                    <button
                      key={chart.id}
                      type="button"
                      className={styles.savedCard}
                      onClick={() => handleLoadChart(chart.id)}
                    >
                      <div className={styles.savedCardLeft}>
                        <span className={styles.savedCardIcon}>
                          {cls?.icon ?? "⚔️"}
                        </span>
                        <div className={styles.savedCardInfo}>
                          <span className={styles.savedCardName}>
                            {chart.name}
                          </span>
                          <span className={styles.savedCardMeta}>
                            {cls?.name ?? chart.character.class} · Lv{" "}
                            {chart.character.level} ·{" "}
                            {new Date(chart.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteSavedBtn}
                        onClick={(e) => handleDeleteChart(e, chart.id)}
                        title="Delete flowchart"
                      >
                        ✕
                      </button>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
