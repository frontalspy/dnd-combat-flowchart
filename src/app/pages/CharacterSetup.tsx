import React, { useState } from "react";
import { Icon } from "../components/Icon";
import { useApp } from "../context/AppContext";
import { CLASSES } from "../data/classes";
import {
  ABILITY_LABELS,
  abilityModifier,
  DEFAULT_SCORES,
  formatModifier,
} from "../data/stats";
import combatIcon from "../icons/game/combat.svg";
import dndIcon from "../icons/logo/dnd.svg";
import crossIcon from "../icons/util/cross.svg";
import type {
  AbilityScores,
  Character,
  CharacterClass,
  DndClass,
} from "../types";
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
  const [abilityScores, setAbilityScores] = useState<AbilityScores>({
    ...DEFAULT_SCORES,
  });

  // Second class (multiclassing)
  const [showSecondClass, setShowSecondClass] = useState(false);
  const [selectedClass2, setSelectedClass2] = useState<DndClass | null>(null);
  const [selectedSubclass2, setSelectedSubclass2] = useState("");
  const [level2, setLevel2] = useState(1);

  const totalLevel = level + (showSecondClass ? level2 : 0);
  const levelOverflow = totalLevel > 20;

  const setScore = (key: keyof AbilityScores, raw: string) => {
    const n = Math.min(30, Math.max(1, Number.parseInt(raw, 10) || 1));
    setAbilityScores((prev) => ({ ...prev, [key]: n }));
  };

  const classDef = selectedClass
    ? CLASSES.find((c) => c.id === selectedClass)
    : null;
  const classDef2 = selectedClass2
    ? CLASSES.find((c) => c.id === selectedClass2)
    : null;

  const handleClassSelect = (classId: DndClass) => {
    setSelectedClass(classId);
    setSelectedSubclass("");
  };

  const handleClassSelect2 = (classId: DndClass) => {
    setSelectedClass2(classId);
    setSelectedSubclass2("");
  };

  const handleRemoveSecondClass = () => {
    setShowSecondClass(false);
    setSelectedClass2(null);
    setSelectedSubclass2("");
    setLevel2(1);
  };

  const handleStart = () => {
    if (!selectedClass) return;
    const secondaryClasses: CharacterClass[] | undefined =
      showSecondClass && selectedClass2
        ? [
            {
              class: selectedClass2,
              subclass: selectedSubclass2,
              level: level2,
            },
          ]
        : undefined;
    const character: Character = {
      class: selectedClass,
      subclass: selectedSubclass,
      level,
      abilityScores,
      secondaryClasses,
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
          <div className={styles.logo}>
            <Icon src={dndIcon} size={50} alt="D&D" />
          </div>
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
                    <span className={styles.classBtnIcon}>
                      <Icon src={cls.icon} size={22} />
                    </span>
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
                <label className={styles.fieldLabel}>Character Level</label>
                <div className={styles.levelStepper}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setLevel((v) => Math.max(1, v - 1))}
                    disabled={level <= 1}
                    aria-label="Decrease level"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className={styles.levelInput}
                    min={1}
                    max={20}
                    value={level}
                    onChange={(e) =>
                      setLevel(
                        Math.min(20, Math.max(1, Number(e.target.value)))
                      )
                    }
                  />
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setLevel((v) => Math.min(20, v + 1))}
                    disabled={level >= 20}
                    aria-label="Increase level"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Ability Scores */}
            {classDef && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Ability Scores</label>
                <div className={styles.abilityGrid}>
                  {(Object.keys(abilityScores) as (keyof AbilityScores)[]).map(
                    (key) => {
                      const mod = abilityModifier(abilityScores[key]);
                      return (
                        <div key={key} className={styles.abilityCell}>
                          <span className={styles.abilityLabel}>
                            {ABILITY_LABELS[key]}
                          </span>
                          <input
                            type="number"
                            className={styles.abilityInput}
                            min={1}
                            max={30}
                            value={abilityScores[key]}
                            onChange={(e) => setScore(key, e.target.value)}
                          />
                          <span className={styles.abilityMod}>
                            {formatModifier(mod)}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Add multiclass button */}
            {classDef && !showSecondClass && (
              <button
                type="button"
                className={styles.addClassBtn}
                onClick={() => setShowSecondClass(true)}
              >
                + Multiclass
              </button>
            )}

            {/* Second class section */}
            {classDef && showSecondClass && (
              <div className={styles.secondClassSection}>
                <div className={styles.secondClassHeader}>
                  <span className={styles.secondClassTitle}>Second Class</span>
                  <button
                    type="button"
                    className={styles.removeClassBtn}
                    onClick={handleRemoveSecondClass}
                    title="Remove second class"
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Second class grid */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Class</label>
                  <div className={styles.classGrid}>
                    {CLASSES.filter((c) => c.id !== selectedClass).map(
                      (cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          className={`${styles.classBtn} ${selectedClass2 === cls.id ? styles.classBtnActive : ""}`}
                          style={
                            selectedClass2 === cls.id
                              ? {
                                  borderColor: cls.color,
                                  boxShadow: `0 0 0 2px ${cls.color}33`,
                                }
                              : {}
                          }
                          onClick={() => handleClassSelect2(cls.id)}
                        >
                          <span className={styles.classBtnIcon}>
                            <Icon src={cls.icon} size={22} />
                          </span>
                          <span className={styles.classBtnName}>
                            {cls.name}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Second class subclass */}
                {classDef2 && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Subclass</label>
                    <select
                      className={styles.select}
                      value={selectedSubclass2}
                      onChange={(e) => setSelectedSubclass2(e.target.value)}
                    >
                      <option value="">— Choose subclass —</option>
                      {classDef2.subclasses.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Second class level */}
                {classDef2 && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Class Level</label>
                    <div className={styles.levelStepper}>
                      <button
                        type="button"
                        className={styles.stepBtn}
                        onClick={() => setLevel2((v) => Math.max(1, v - 1))}
                        disabled={level2 <= 1}
                        aria-label="Decrease second class level"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className={styles.levelInput}
                        min={1}
                        max={19}
                        value={level2}
                        onChange={(e) =>
                          setLevel2(
                            Math.min(19, Math.max(1, Number(e.target.value)))
                          )
                        }
                      />
                      <button
                        type="button"
                        className={styles.stepBtn}
                        onClick={() => setLevel2((v) => Math.min(19, v + 1))}
                        disabled={level2 >= 19}
                        aria-label="Increase second class level"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Total level indicator */}
                <div className={styles.totalLevelRow}>
                  <span className={styles.totalLevelLabel}>Total Level:</span>
                  <span
                    className={`${styles.totalLevelBadge} ${levelOverflow ? styles.totalLevelBadgeError : ""}`}
                  >
                    {totalLevel} / 20
                  </span>
                  {levelOverflow && (
                    <span className={styles.totalLevelWarning}>
                      Total level cannot exceed 20
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.startBtn}
              disabled={!selectedClass || levelOverflow}
              onClick={handleStart}
            >
              <Icon src={combatIcon} size={16} /> Start Building
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
                          <Icon src={cls?.icon ?? combatIcon} size={26} />
                        </span>
                        <div className={styles.savedCardInfo}>
                          <span className={styles.savedCardName}>
                            {chart.name}
                          </span>
                          <span className={styles.savedCardMeta}>
                            {cls?.name ?? chart.character.class} Lv{" "}
                            {chart.character.level}
                            {(chart.character.secondaryClasses ?? [])
                              .map((sc) => {
                                const sc2 = CLASSES.find(
                                  (c) => c.id === sc.class
                                );
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
                        onClick={(e) => handleDeleteChart(e, chart.id)}
                        title="Delete flowchart"
                      >
                        <Icon src={crossIcon} size={12} />
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
