import type { Node } from "@xyflow/react";
import { useReactFlow, useStore } from "@xyflow/react";
import { Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { getClassDefinition } from "../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../data/damageTypes";
import {
  ABILITY_FULL_NAMES,
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
} from "../data/stats";
import type {
  Character,
  ConditionStatusNodeData,
  DndCondition,
  GroupNodeData,
} from "../types";
import { Icon } from "./Icon";
import styles from "./NodeEditor.module.css";
import {
  CONDITION_DESCRIPTIONS,
  CONDITION_DISPLAY_NAMES,
  CONDITION_ICONS,
} from "./nodes/ConditionStatusNode";
import { VariantManager } from "./VariantManager";

interface NodeEditorProps {
  selectedNode: Node | null;
  onClose: () => void;
  character?: Character;
  customWeapons?: import("../data/weapons").Weapon[];
}

export function NodeEditor({
  selectedNode,
  onClose,
  character,
  customWeapons = [],
}: NodeEditorProps) {
  const { updateNodeData, deleteElements, getNode } = useReactFlow();

  // Reactively subscribe to the selected node's data so the panel re-renders
  // whenever updateNodeData fires (getNode() is imperative and does not trigger re-renders).
  const liveGroupData = useStore((s) => {
    if (!selectedNode || selectedNode.type !== "groupNode") return null;
    const node = s.nodeLookup.get(selectedNode.id);
    return node ? (node.data as GroupNodeData) : null;
  });
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

  // ─────────────────────────────────────────────────────────────────

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
          : nodeType === "groupNode"
            ? "Group Node"
            : nodeType === "conditionStatusNode"
              ? "Condition Status"
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
                <Icon src={damageInfo.icon} size={14} alt={damageInfo.label} />{" "}
                {damageInfo.label}
              </span>
            )}
          </div>
        )}

        {/* Name / label editing */}
        {(nodeType === "actionNode" ||
          nodeType === "conditionNode" ||
          nodeType === "startNode" ||
          nodeType === "groupNode") && (
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

        {/* Condition Status Node — condition info + affects editor */}
        {nodeType === "conditionStatusNode" &&
          (() => {
            const csData = data as unknown as ConditionStatusNodeData;
            const cond = csData.condition as DndCondition;
            const desc = CONDITION_DESCRIPTIONS[cond];
            const iconSrc = CONDITION_ICONS[cond];
            const displayName = CONDITION_DISPLAY_NAMES[cond];
            return (
              <>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Condition</label>
                  <div className={styles.conditionInfoRow}>
                    <Icon src={iconSrc} size={20} alt={displayName} />
                    <span className={styles.conditionDisplayName}>
                      {displayName}
                    </span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Affects</label>
                  <div className={styles.pillRow}>
                    {(["target", "self", "area"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`${styles.infoPill} ${csData.affects === a ? styles.infoPillActive : ""}`}
                        onClick={() =>
                          updateNodeData(selectedNode!.id, { affects: a })
                        }
                      >
                        {a === "target"
                          ? "Target"
                          : a === "self"
                            ? "Self"
                            : "Area"}
                      </button>
                    ))}
                  </div>
                </div>
                {desc && (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Effect</label>
                    <p className={styles.descText}>{desc}</p>
                  </div>
                )}
              </>
            );
          })()}

        {/* Description */}
        {descriptionText && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description</label>
            <p className={styles.descText}>{descriptionText}</p>
          </div>
        )}

        {/* Notes */}
        {nodeType !== "noteNode" &&
          nodeType !== "startNode" &&
          nodeType !== "groupNode" && (
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

        {/* Computed character stats */}
        {nodeType === "actionNode" &&
          character?.abilityScores &&
          (() => {
            const classDef = getClassDefinition(character.class);
            const spellAbility = classDef?.spellcastingAbility ?? null;
            const scores = character.abilityScores;
            const prof = proficiencyBonus(character.level);
            if (!spellAbility) return null;
            const score = scores[spellAbility];
            const dc = spellSaveDC(character.level, score);
            const atk = spellAttackBonus(character.level, score);
            const mod = abilityModifier(score);
            const abilityName = ABILITY_FULL_NAMES[spellAbility];
            return (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Computed Stats</label>
                <div className={styles.computedRows}>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>
                      Spellcasting ({abilityName})
                    </span>
                    <span className={styles.computedVal}>
                      {score} ({formatModifier(mod)})
                    </span>
                  </div>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>
                      Proficiency Bonus
                    </span>
                    <span className={styles.computedVal}>
                      {formatModifier(prof)}
                    </span>
                  </div>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>Spell Save DC</span>
                    <span className={styles.computedVal}>{dc}</span>
                  </div>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>
                      Spell Attack Bonus
                    </span>
                    <span className={styles.computedVal}>
                      {formatModifier(atk)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ── Variant management (groupNode only) ── */}
        {nodeType === "groupNode" && liveGroupData && (
          <VariantManager
            selectedNodeId={selectedNode.id}
            groupData={liveGroupData}
            character={character}
            customWeapons={customWeapons}
          />
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
