import { X } from "lucide-react";
import React, { useState } from "react";
import { CLASSES } from "../data/classes";
import {
  ABILITY_FULL_NAMES,
  ABILITY_LABELS,
  abilityModifier,
  DEFAULT_SCORES,
  formatModifier,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
} from "../data/stats";
import type { AbilityScores, Character } from "../types";
import styles from "./StatsEditor.module.css";

interface StatsEditorProps {
  character: Character;
  onSave: (scores: AbilityScores, level: number) => void;
  onClose: () => void;
}

export function StatsEditor({ character, onSave, onClose }: StatsEditorProps) {
  const [scores, setScores] = useState<AbilityScores>(
    character.abilityScores ?? { ...DEFAULT_SCORES }
  );
  const [level, setLevel] = useState(character.level);

  const setLevelValue = (raw: string) => {
    const n = Math.min(20, Math.max(1, Number.parseInt(raw, 10) || 1));
    setLevel(n);
  };

  const setScore = (key: keyof AbilityScores, raw: string) => {
    const n = Math.min(30, Math.max(1, Number.parseInt(raw, 10) || 1));
    setScores((prev) => ({ ...prev, [key]: n }));
  };

  const classDef = CLASSES.find((c) => c.id === character.class);
  const spellcastingAbility = classDef?.spellcastingAbility ?? null;
  const spellcastingScore = spellcastingAbility
    ? scores[spellcastingAbility]
    : null;
  const prof = proficiencyBonus(level);
  const autoDC =
    spellcastingScore !== null ? spellSaveDC(level, spellcastingScore) : null;
  const autoAttack =
    spellcastingScore !== null
      ? spellAttackBonus(level, spellcastingScore)
      : null;

  const abilityKeys = Object.keys(scores) as (keyof AbilityScores)[];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Ability Scores</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.levelRow}>
            <span className={styles.levelLabel}>Character Level</span>
            <input
              type="number"
              className={styles.levelInput}
              min={1}
              max={20}
              value={level}
              onChange={(e) => setLevelValue(e.target.value)}
            />
          </div>

          <div className={styles.scoresGrid}>
            {abilityKeys.map((key) => {
              const mod = abilityModifier(scores[key]);
              return (
                <div key={key} className={styles.scoreCell}>
                  <span className={styles.scoreLabel}>
                    {ABILITY_LABELS[key]}
                  </span>
                  <input
                    type="number"
                    className={styles.scoreInput}
                    min={1}
                    max={30}
                    value={scores[key]}
                    onChange={(e) => setScore(key, e.target.value)}
                    title={ABILITY_FULL_NAMES[key]}
                  />
                  <span
                    className={`${styles.modifier} ${mod >= 0 ? styles.modifierPos : ""}`}
                  >
                    {formatModifier(mod)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.computedSection}>
            <div className={styles.computedTitle}>Computed</div>
            <div className={styles.computedRow}>
              <span>Proficiency Bonus</span>
              <span className={styles.computedValue}>
                {formatModifier(prof)}
              </span>
            </div>
            {autoDC !== null && spellcastingAbility && (
              <div className={styles.computedRow}>
                <span>
                  Spell Save DC ({ABILITY_LABELS[spellcastingAbility]})
                </span>
                <span className={styles.computedValue}>{autoDC}</span>
              </div>
            )}
            {autoAttack !== null && spellcastingAbility && (
              <div className={styles.computedRow}>
                <span>
                  Spell Attack Bonus ({ABILITY_LABELS[spellcastingAbility]})
                </span>
                <span className={styles.computedValue}>
                  {formatModifier(autoAttack)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => {
              onSave(scores, level);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
