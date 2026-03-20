import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useContext, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getClassDefinition } from "../../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../../data/damageTypes";
import { spellSaveDC } from "../../data/stats";
import reachIcon from "../../icons/combat/reach.svg";
import d20Icon from "../../icons/dice/d20.svg";
import timeIcon from "../../icons/entity/time.svg";
import concentrationIcon from "../../icons/spell/concentration.svg";
import type { ActionNodeData } from "../../types";
import { ConcentrationContext } from "../FlowCanvas";
import { Icon } from "../Icon";
import styles from "./ActionNode.module.css";

type ActionNodeType = Node<ActionNodeData, "actionNode">;

export function ActionNode({ id, data, selected }: NodeProps<ActionNodeType>) {
  const { updateNodeData } = useReactFlow();
  const { state } = useApp();
  const conflictNodeIds = useContext(ConcentrationContext);
  const isConflict = conflictNodeIds.has(id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(data.notes ?? "");

  // Compute spell save DC from character context
  const character = state.character;
  const computedSaveDC = (() => {
    if (!character?.abilityScores) return null;
    const classDef = getClassDefinition(character.class);
    const ability = classDef?.spellcastingAbility;
    if (!ability) return null;
    return spellSaveDC(character.level, character.abilityScores[ability]);
  })();

  const damageInfo = data.damageType ? DAMAGE_TYPES[data.damageType] : null;
  const schoolInfo = data.school
    ? SPELL_SCHOOLS[data.school.toLowerCase()]
    : null;
  const actionInfo =
    ACTION_TYPE_LABELS[data.actionType] ?? ACTION_TYPE_LABELS.action;

  const handleNotesBlur = useCallback(() => {
    setEditingNotes(false);
    updateNodeData(id, { notes: notesValue });
  }, [id, notesValue, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingNotes(false);
        setNotesValue(data.notes ?? "");
      }
    },
    [data.notes]
  );

  const borderColor = damageInfo?.color ?? schoolInfo?.color ?? "#30363d";

  return (
    <div
      className={`${styles.actionNode} ${selected ? styles.selected : ""} ${isConflict ? styles.concentrationConflict : ""}`}
      style={{ borderColor }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={styles.handle}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className={styles.handle}
        style={{ top: "50%" }}
      />

      <div className={styles.header} style={{ borderColor }}>
        <div className={styles.badges}>
          {schoolInfo && (
            <span
              className={styles.schoolBadge}
              style={{ color: schoolInfo.color, borderColor: schoolInfo.color }}
            >
              {schoolInfo.abbreviation}
            </span>
          )}
          {data.spellLevel !== undefined && (
            <span className={styles.levelBadge}>
              {data.spellLevel === "cantrip" ? "✦" : `Lv${data.spellLevel}`}
            </span>
          )}
          {data.concentration && (
            <span
              className={styles.concentrationBadge}
              title="Concentration spell"
            >
              <Icon src={concentrationIcon} size={10} />
            </span>
          )}
          {data.hand === "main" && (
            <span className={styles.handBadgeMh} title="Main hand">
              MH
            </span>
          )}
          {data.hand === "off" && (
            <span
              className={styles.handBadgeOh}
              title="Off hand (Bonus Action)"
            >
              OH
            </span>
          )}
        </div>
        <span
          className={styles.actionTypeBadge}
          style={{ backgroundColor: actionInfo.color, color: "#0d1117" }}
          title={actionInfo.label}
        >
          {actionInfo.short}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.name}>{data.label}</div>

        <div className={styles.pills}>
          {damageInfo && (
            <span
              className={styles.damagePill}
              style={{
                color: damageInfo.color,
                backgroundColor: damageInfo.bgColor,
              }}
            >
              <img
                src={damageInfo.icon}
                width={12}
                height={12}
                alt=""
                aria-hidden="true"
                style={{ verticalAlign: "middle" }}
              />{" "}
              {data.damageDice ? `${data.damageDice} ` : ""}
              {damageInfo.label}
            </span>
          )}
          {data.range && (
            <span className={styles.infoPill} title="Range">
              <Icon src={reachIcon} size={12} /> {data.range}
            </span>
          )}
          {data.duration && data.duration !== "Instantaneous" && (
            <span className={styles.infoPill} title="Duration">
              <Icon src={timeIcon} size={12} /> {data.duration}
            </span>
          )}
        </div>

        {/* Roll type + standalone dice indicators */}
        {(data.rollType === "attack" ||
          data.label === "Attack" ||
          data.rollType === "save" ||
          (data.damageDice && !data.damageType)) && (
          <div className={styles.diceRow}>
            {(data.rollType === "attack" || data.label === "Attack") && (
              <span className={styles.attackPill} title="Attack roll required">
                <Icon src={d20Icon} size={12} /> 1d20
              </span>
            )}
            {data.rollType === "save" && (
              <span
                className={styles.savePill}
                title={
                  computedSaveDC
                    ? `DC ${computedSaveDC} saving throw`
                    : "Saving throw required"
                }
              >
                {computedSaveDC && (
                  <span className={styles.saveDcValue}>{computedSaveDC} </span>
                )}
                {data.saveAbility ? `${data.saveAbility} SAVE` : "SAVE"}
              </span>
            )}
            {data.damageDice && !data.damageType && (
              <span className={styles.dicePill}>{data.damageDice}</span>
            )}
          </div>
        )}

        {data.higherLevels && (
          <div className={styles.higherLevels} title="At higher levels">
            ↑ {data.higherLevels}
          </div>
        )}

        <div className={styles.notesSection}>
          {editingNotes ? (
            <textarea
              className={styles.notesInput}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              onKeyDown={handleKeyDown}
              placeholder="Add notes..."
              autoFocus
              rows={3}
            />
          ) : (
            <button
              type="button"
              className={styles.notesDisplay}
              onClick={() => setEditingNotes(true)}
              title="Click to add notes"
            >
              {data.notes ? (
                <span className={styles.notesText}>{data.notes}</span>
              ) : (
                <span className={styles.notesPlaceholder}>+ Add notes</span>
              )}
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className={styles.handle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className={styles.handle}
        style={{ top: "50%" }}
      />
    </div>
  );
}
