import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../data/damageTypes";
import styles from "./NodeEditor.module.css";

interface NodeEditorProps {
  selectedNode: Node | null;
  onClose: () => void;
}

export function NodeEditor({ selectedNode, onClose }: NodeEditorProps) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const [notes, setNotes] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!selectedNode) return;
    const d = selectedNode.data as Record<string, unknown>;
    setNotes(typeof d.notes === "string" ? d.notes : "");
    setLabel(typeof d.label === "string" ? d.label : "");
  }, [selectedNode]);

  const handleSaveNotes = useCallback(() => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { notes });
  }, [selectedNode, notes, updateNodeData]);

  const handleSaveLabel = useCallback(() => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { label });
  }, [selectedNode, label, updateNodeData]);

  const handleDelete = useCallback(() => {
    if (!selectedNode) return;
    deleteElements({ nodes: [selectedNode] });
    onClose();
  }, [selectedNode, deleteElements, onClose]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type as string;
  const data = selectedNode.data as Record<string, unknown>;

  const damageTypeKey =
    typeof data.damageType === "string" ? data.damageType : null;
  const schoolKey =
    typeof data.school === "string" ? data.school.toLowerCase() : null;
  const actionTypeKey =
    typeof data.actionType === "string" ? data.actionType : null;

  const damageInfo = damageTypeKey
    ? DAMAGE_TYPES[damageTypeKey as keyof typeof DAMAGE_TYPES]
    : null;
  const schoolInfo = schoolKey ? SPELL_SCHOOLS[schoolKey] : null;
  const actionInfo = actionTypeKey ? ACTION_TYPE_LABELS[actionTypeKey] : null;

  const typeLabel =
    nodeType === "actionNode"
      ? "Action / Spell"
      : nodeType === "conditionNode"
        ? "Condition"
        : nodeType === "startNode"
          ? "Start Node"
          : "Note";

  const descriptionText =
    typeof data.description === "string" ? data.description : null;
  const rangeText = typeof data.range === "string" ? data.range : null;
  const durationText = typeof data.duration === "string" ? data.duration : null;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.nodeTypeLabel}>{typeLabel}</span>
          {actionInfo && (
            <span
              className={styles.actionTypeBadge}
              style={{ backgroundColor: actionInfo.color }}
            >
              {actionInfo.label}
            </span>
          )}
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className={styles.body}>
        {/* Damage & school info */}
        {(damageInfo || schoolInfo) && (
          <div className={styles.infoRow}>
            {schoolInfo && (
              <span
                className={styles.schoolChip}
                style={{
                  color: schoolInfo.color,
                  borderColor: schoolInfo.color,
                }}
              >
                {schoolInfo.label}
              </span>
            )}
            {damageInfo && (
              <span
                className={styles.damageChip}
                style={{
                  color: damageInfo.color,
                  backgroundColor: damageInfo.bgColor,
                }}
              >
                {damageInfo.icon} {damageInfo.label}
              </span>
            )}
          </div>
        )}

        {/* Name / label editing */}
        {(nodeType === "actionNode" ||
          nodeType === "conditionNode" ||
          nodeType === "startNode") && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Name</label>
            <div className={styles.fieldRow}>
              <input
                className={styles.fieldInput}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveLabel();
                }}
              />
            </div>
          </div>
        )}

        {/* Range / Duration for action nodes */}
        {nodeType === "actionNode" && (rangeText || durationText) && (
          <div className={styles.pillRow}>
            {rangeText && (
              <span className={styles.infoPill}>📏 {rangeText}</span>
            )}
            {durationText && durationText !== "Instantaneous" && (
              <span className={styles.infoPill}>⏱ {durationText}</span>
            )}
          </div>
        )}

        {/* Description */}
        {descriptionText && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description</label>
            <p className={styles.descText}>{descriptionText}</p>
          </div>
        )}

        {/* Notes */}
        {nodeType !== "noteNode" && nodeType !== "startNode" && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Notes</label>
            <textarea
              className={styles.notesTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add personal notes, reminders, or conditions..."
              rows={4}
            />
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
        >
          <Trash2 size={14} />
          Delete Node
        </button>
        <span className={styles.hint}>
          Delete key also removes selected nodes
        </span>
      </div>
    </aside>
  );
}
