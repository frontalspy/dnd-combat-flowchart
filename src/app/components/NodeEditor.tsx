import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { Plus, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { STANDARD_ACTIONS } from "../data/actions";
import type { ClassAction } from "../data/classes";
import { getClassDefinition, getMaxSpellLevel } from "../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  detectDamageType,
  getActionTypeFromCastingTime,
  SPELL_SCHOOLS,
} from "../data/damageTypes";
import spellsData from "../data/spells.json";
import {
  ABILITY_FULL_NAMES,
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
} from "../data/stats";
import type { Character, GroupNodeData, GroupVariant, Spell } from "../types";
import { Icon } from "./Icon";
import styles from "./NodeEditor.module.css";

const allSpells = spellsData as Spell[];

interface NodeEditorProps {
  selectedNode: Node | null;
  onClose: () => void;
  character?: Character;
}

export function NodeEditor({
  selectedNode,
  onClose,
  character,
}: NodeEditorProps) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const [notes, setNotes] = useState("");
  const [label, setLabel] = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [showVariantAdd, setShowVariantAdd] = useState(false);

  useEffect(() => {
    if (!selectedNode) return;
    const d = selectedNode.data as Record<string, unknown>;
    setNotes(typeof d.notes === "string" ? d.notes : "");
    setLabel(typeof d.label === "string" ? d.label : "");
    setVariantSearch("");
    setShowVariantAdd(false);
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

  // ── Variant management (groupNode only) ──────────────────────────

  const groupData =
    selectedNode?.type === "groupNode"
      ? (selectedNode.data as GroupNodeData)
      : null;

  const handleRemoveVariant = useCallback(
    (variantId: string) => {
      if (!selectedNode || !groupData) return;
      updateNodeData(selectedNode.id, {
        variants: groupData.variants.filter((v) => v.id !== variantId),
      });
    },
    [selectedNode, groupData, updateNodeData]
  );

  const handleAddVariant = useCallback(
    (variant: GroupVariant) => {
      if (!selectedNode || !groupData) return;
      if (groupData.variants.some((v) => v.label === variant.label)) return;
      updateNodeData(selectedNode.id, {
        variants: [...groupData.variants, variant],
      });
      setVariantSearch("");
    },
    [selectedNode, groupData, updateNodeData]
  );

  const variantPool = useMemo(() => {
    if (!groupData || !character) return [];

    const classDef = getClassDefinition(character.class);
    const maxSpellLevel = getMaxSpellLevel(
      character.class,
      character.subclass,
      character.level
    );

    const classActionItems = classDef
      ? classDef.classActions
          .filter((a: ClassAction) => a.minLevel <= character.level)
          .map((a: ClassAction) => ({
            id: a.id,
            label: a.name,
            actionType: a.actionType,
            damageType: a.damageType,
            school: undefined as string | undefined,
            spellLevel: undefined as string | undefined,
            description: a.description,
          }))
      : [];

    const standardItems = STANDARD_ACTIONS.map((a) => ({
      id: a.id,
      label: a.name,
      actionType: a.actionType,
      damageType: a.damageType,
      school: a.school,
      spellLevel: a.level,
      description: a.description,
    }));

    const spellItems =
      maxSpellLevel > 0
        ? allSpells
            .filter((spell) => {
              if (!spell.classes.includes(character.class)) return false;
              if (spell.level === "cantrip") return true;
              const lvl = parseInt(spell.level, 10);
              return !isNaN(lvl) && lvl <= maxSpellLevel;
            })
            .map((spell) => ({
              id: `spell-${spell.name}`,
              label: spell.name,
              actionType: getActionTypeFromCastingTime(spell.casting_time),
              damageType: detectDamageType(spell.description),
              school: spell.school,
              spellLevel: spell.level,
              description: spell.description,
            }))
        : [];

    return [...classActionItems, ...standardItems, ...spellItems];
  }, [groupData, character]);

  const filteredPool = useMemo(() => {
    if (!variantSearch.trim()) return variantPool.slice(0, 20);
    const q = variantSearch.toLowerCase();
    return variantPool
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 20);
  }, [variantPool, variantSearch]);

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
        {nodeType === "groupNode" && groupData && (
          <div className={styles.field}>
            <div className={styles.variantsHeader}>
              <label className={styles.fieldLabel}>
                Variants ({groupData.variants.length})
              </label>
              <button
                type="button"
                className={styles.addVariantBtn}
                onClick={() => setShowVariantAdd((v) => !v)}
                title="Add a variant"
              >
                <Plus size={12} />
                Add
              </button>
            </div>

            {/* Existing variants list */}
            {groupData.variants.length > 0 && (
              <div className={styles.variantsList}>
                {groupData.variants.map((variant) => {
                  const vDamage = variant.damageType
                    ? DAMAGE_TYPES[variant.damageType]
                    : null;
                  const vAction =
                    ACTION_TYPE_LABELS[variant.actionType] ??
                    ACTION_TYPE_LABELS.action;
                  return (
                    <div key={variant.id} className={styles.variantItem}>
                      <span className={styles.variantItemLabel}>
                        {variant.label}
                      </span>
                      <div className={styles.variantItemBadges}>
                        {variant.spellLevel !== undefined && (
                          <span className={styles.variantLevelBadge}>
                            {variant.spellLevel === "cantrip"
                              ? "✦"
                              : `Lv${variant.spellLevel}`}
                          </span>
                        )}
                        <span
                          className={styles.variantActionBadge}
                          style={{ backgroundColor: vAction.color }}
                          title={vAction.label}
                        >
                          {vAction.short}
                        </span>
                        {vDamage && (
                          <span
                            className={styles.variantDamageBadge}
                            style={{
                              color: vDamage.color,
                              backgroundColor: vDamage.bgColor,
                            }}
                          >
                            {vDamage.label}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.removeVariantBtn}
                        onClick={() => handleRemoveVariant(variant.id)}
                        title={`Remove ${variant.label}`}
                        aria-label={`Remove variant ${variant.label}`}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add variant search panel */}
            {showVariantAdd && (
              <div className={styles.variantSearch}>
                <input
                  className={styles.variantSearchInput}
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  placeholder="Search spells & actions…"
                  autoFocus
                />
                <div className={styles.variantSearchResults}>
                  {filteredPool.length === 0 ? (
                    <div className={styles.variantSearchEmpty}>
                      {character
                        ? "No matches found."
                        : "Character data unavailable."}
                    </div>
                  ) : (
                    filteredPool.map((item) => {
                      const alreadyAdded = groupData.variants.some(
                        (v) => v.label === item.label
                      );
                      const iAction =
                        ACTION_TYPE_LABELS[item.actionType] ??
                        ACTION_TYPE_LABELS.action;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.variantResultRow} ${
                            alreadyAdded ? styles.variantResultAdded : ""
                          }`}
                          onClick={() => {
                            if (!alreadyAdded) {
                              handleAddVariant({
                                id: `variant-${item.id}-${Date.now()}`,
                                label: item.label,
                                actionType: item.actionType,
                                damageType: item.damageType,
                                school: item.school,
                                spellLevel: item.spellLevel,
                                description: item.description,
                              });
                            }
                          }}
                          disabled={alreadyAdded}
                          title={
                            alreadyAdded
                              ? "Already in group"
                              : `Add ${item.label}`
                          }
                        >
                          <span className={styles.variantResultLabel}>
                            {item.label}
                          </span>
                          <span
                            className={styles.variantResultBadge}
                            style={{ backgroundColor: iAction.color }}
                            title={iAction.label}
                          >
                            {iAction.short}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
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
