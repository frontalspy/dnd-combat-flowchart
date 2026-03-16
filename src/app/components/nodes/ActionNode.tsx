import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useState } from "react";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../../data/damageTypes";
import reachIcon from "../../icons/combat/reach.svg";
import timeIcon from "../../icons/entity/time.svg";
import type { ActionNodeData } from "../../types";
import { Icon } from "../Icon";
import styles from "./ActionNode.module.css";

type ActionNodeType = Node<ActionNodeData, "actionNode">;

export function ActionNode({ id, data, selected }: NodeProps<ActionNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(data.notes ?? "");

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
      className={`${styles.actionNode} ${selected ? styles.selected : ""}`}
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
