import { useReactFlow } from "@xyflow/react";
import { Plus, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { STANDARD_ACTIONS } from "../data/actions";
import type { ClassAction } from "../data/classes";
import { getClassDefinition, getMaxSpellLevel } from "../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  detectDamageType,
  extractDamageDice,
  extractRollType,
  extractSaveAbility,
  getActionTypeFromCastingTime,
} from "../data/damageTypes";
import spellsData from "../data/spells.json";
import type { Character, GroupNodeData, GroupVariant, Spell } from "../types";
import styles from "./NodeEditor.module.css";

const allSpells = spellsData as Spell[];

interface VariantManagerProps {
  selectedNodeId: string;
  groupData: GroupNodeData;
  character?: Character;
}

export function VariantManager({
  selectedNodeId,
  groupData,
  character,
}: VariantManagerProps) {
  const { updateNodeData, getNode } = useReactFlow();
  const [variantSearch, setVariantSearch] = useState("");
  const [showVariantAdd, setShowVariantAdd] = useState(false);

  const handleRemoveVariant = useCallback(
    (variantId: string) => {
      const live = getNode(selectedNodeId)?.data as GroupNodeData | undefined;
      if (!live) return;
      updateNodeData(selectedNodeId, {
        variants: live.variants.filter((v) => v.id !== variantId),
      });
    },
    [selectedNodeId, getNode, updateNodeData]
  );

  const handleAddVariant = useCallback(
    (variant: GroupVariant) => {
      const live = getNode(selectedNodeId)?.data as GroupNodeData | undefined;
      if (!live) return;
      if (live.variants.some((v) => v.label === variant.label)) return;
      updateNodeData(selectedNodeId, {
        variants: [...live.variants, variant],
      });
      setVariantSearch("");
      setShowVariantAdd(false);
    },
    [selectedNodeId, getNode, updateNodeData]
  );

  const variantPool = useMemo(() => {
    if (!character) return [];

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
            damageDice: extractDamageDice(a.description) ?? undefined,
            saveAbility: extractSaveAbility(a.description) ?? undefined,
            rollType: extractRollType(a.description) as
              | "attack"
              | "save"
              | "auto",
            range: undefined as string | undefined,
            duration: undefined as string | undefined,
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
      damageDice: extractDamageDice(a.description) ?? undefined,
      saveAbility: extractSaveAbility(a.description) ?? undefined,
      rollType: extractRollType(a.description) as "attack" | "save" | "auto",
      range: a.range,
      duration: a.duration,
    }));

    const spellItems =
      maxSpellLevel > 0
        ? allSpells
            .filter((spell) => {
              if (spell.classes.indexOf(character.class) === -1) return false;
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
              damageDice: extractDamageDice(spell.description) ?? undefined,
              saveAbility: extractSaveAbility(spell.description) ?? undefined,
              rollType: extractRollType(spell.description) as
                | "attack"
                | "save"
                | "auto",
              range: spell.range,
              duration: spell.duration,
            }))
        : [];

    return [...classActionItems, ...standardItems, ...spellItems];
  }, [character]);

  const filteredPool = useMemo(() => {
    if (!variantSearch.trim()) return variantPool.slice(0, 20);
    const q = variantSearch.toLowerCase();
    return variantPool
      .filter((item) => item.label.toLowerCase().includes(q))
      .slice(0, 20);
  }, [variantPool, variantSearch]);

  return (
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
                <span className={styles.variantItemLabel}>{variant.label}</span>
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
                          damageDice: item.damageDice,
                          saveAbility: item.saveAbility,
                          rollType: item.rollType,
                          range: item.range,
                          duration: item.duration,
                        });
                      }
                    }}
                    disabled={alreadyAdded}
                    title={
                      alreadyAdded ? "Already in group" : `Add ${item.label}`
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
  );
}
