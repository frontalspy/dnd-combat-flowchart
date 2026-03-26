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
import type {
  AbilityScores,
  Character,
  CharacterClass,
  DndClass,
} from "../types";
import styles from "./CharacterSetup.module.css";
import { MulticlassSection } from "./setup/MulticlassSection";
import { SavedFlowchartsList } from "./setup/SavedFlowchartsList";

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
              <MulticlassSection
                primaryClassId={selectedClass as DndClass}
                selectedClass2={selectedClass2}
                selectedSubclass2={selectedSubclass2}
                level2={level2}
                totalLevel={totalLevel}
                levelOverflow={levelOverflow}
                onSelectClass2={handleClassSelect2}
                onSubclass2Change={setSelectedSubclass2}
                onLevel2Change={setLevel2}
                onRemove={handleRemoveSecondClass}
              />
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
          <SavedFlowchartsList
            charts={state.savedFlowcharts}
            onLoad={handleLoadChart}
            onDelete={handleDeleteChart}
          />
        </div>
      </div>
    </div>
  );
}
