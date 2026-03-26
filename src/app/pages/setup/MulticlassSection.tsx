import React from "react";
import { Icon } from "../../components/Icon";
import { CLASSES } from "../../data/classes";
import type { DndClass } from "../../types";
import styles from "../CharacterSetup.module.css";

interface MulticlassSectionProps {
  primaryClassId: DndClass;
  selectedClass2: DndClass | null;
  selectedSubclass2: string;
  level2: number;
  totalLevel: number;
  levelOverflow: boolean;
  onSelectClass2: (id: DndClass) => void;
  onSubclass2Change: (subclass: string) => void;
  onLevel2Change: (level: number) => void;
  onRemove: () => void;
}

export function MulticlassSection({
  primaryClassId,
  selectedClass2,
  selectedSubclass2,
  level2,
  totalLevel,
  levelOverflow,
  onSelectClass2,
  onSubclass2Change,
  onLevel2Change,
  onRemove,
}: MulticlassSectionProps) {
  const classDef2 = selectedClass2
    ? CLASSES.find((c) => c.id === selectedClass2)
    : null;

  return (
    <div className={styles.secondClassSection}>
      <div className={styles.secondClassHeader}>
        <span className={styles.secondClassTitle}>Second Class</span>
        <button
          type="button"
          className={styles.removeClassBtn}
          onClick={onRemove}
          title="Remove second class"
        >
          ✕ Remove
        </button>
      </div>

      {/* Second class grid */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Class</label>
        <div className={styles.classGrid}>
          {CLASSES.filter((c) => c.id !== primaryClassId).map((cls) => (
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
              onClick={() => onSelectClass2(cls.id)}
            >
              <span className={styles.classBtnIcon}>
                <Icon src={cls.icon} size={22} />
              </span>
              <span className={styles.classBtnName}>{cls.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Second class subclass */}
      {classDef2 && (
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Subclass</label>
          <select
            className={styles.select}
            value={selectedSubclass2}
            onChange={(e) => onSubclass2Change(e.target.value)}
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
              onClick={() => onLevel2Change(Math.max(1, level2 - 1))}
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
                onLevel2Change(
                  Math.min(19, Math.max(1, Number(e.target.value)))
                )
              }
            />
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => onLevel2Change(Math.min(19, level2 + 1))}
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
  );
}
