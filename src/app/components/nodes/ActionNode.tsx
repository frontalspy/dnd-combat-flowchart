import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useContext, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getClassDefinition, getMaxSpellLevel } from "../../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../../data/damageTypes";
import {
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
} from "../../data/stats";
import barbarianIcon from "../../icons/class/barbarian.svg";
import bardIcon from "../../icons/class/bard.svg";
import clericIcon from "../../icons/class/cleric.svg";
import druidIcon from "../../icons/class/druid.svg";
import fighterIcon from "../../icons/class/fighter.svg";
import monkIcon from "../../icons/class/monk.svg";
import paladinIcon from "../../icons/class/paladin.svg";
import sorcererIcon from "../../icons/class/sorcerer.svg";
import warlockIcon from "../../icons/class/warlock.svg";
import reachIcon from "../../icons/combat/reach.svg";
import d20Icon from "../../icons/dice/d20.svg";
import timeIcon from "../../icons/entity/time.svg";
import spellIcon from "../../icons/game/spell.svg";
import concentrationIcon from "../../icons/spell/concentration.svg";
import starIcon from "../../icons/util/star.svg";
import type { ActionNodeData, ResourceType } from "../../types";
import {
  getScaledDamageDice,
  getScaledDuration,
  toOrdinal,
} from "../../utils/spellScaling";
import {
  ActionEconomyContext,
  ConcentrationContext,
  SelectionGroupContext,
} from "../FlowCanvas";
import { Icon } from "../Icon";
import styles from "./ActionNode.module.css";

const RESOURCE_ICONS: Record<ResourceType, string> = {
  "spell-slot": spellIcon,
  ki: monkIcon,
  rage: barbarianIcon,
  "superiority-die": fighterIcon,
  "channel-divinity": clericIcon,
  "bardic-inspiration": bardIcon,
  "lay-on-hands": paladinIcon,
  "wild-shape": druidIcon,
  "sorcery-point": sorcererIcon,
  "warlock-invocation": warlockIcon,
  custom: starIcon,
};

const RESOURCE_SHORT_LABELS: Record<ResourceType, string> = {
  "spell-slot": "Slot",
  ki: "Ki",
  rage: "Rage",
  "superiority-die": "SD",
  "channel-divinity": "CD",
  "bardic-inspiration": "BI",
  "lay-on-hands": "LoH",
  "wild-shape": "WS",
  "sorcery-point": "SP",
  "warlock-invocation": "Pact",
  custom: "",
};

type ActionNodeType = Node<ActionNodeData, "actionNode">;

export function ActionNode({ id, data, selected }: NodeProps<ActionNodeType>) {
  const { updateNodeData } = useReactFlow();
  const { state, getActiveFlowchart } = useApp();
  const conflictNodeIds = useContext(ConcentrationContext);
  const isConflict = conflictNodeIds.has(id);
  const overBudgetNodeIds = useContext(ActionEconomyContext);
  const isOverBudget = overBudgetNodeIds.has(id);
  const groupColorMap = useContext(SelectionGroupContext);
  const groupColor = groupColorMap.get(id);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(data.notes ?? "");

  // Compute spell save DC and attack bonus from character context
  const character = state.character;
  const computedSaveDC = (() => {
    if (!character?.abilityScores) return null;
    const classDef = getClassDefinition(character.class);
    const ability = classDef?.spellcastingAbility;
    if (!ability) return null;
    return spellSaveDC(character.level, character.abilityScores[ability]);
  })();

  const computedAttackBonus = (() => {
    if (!character?.abilityScores) return null;
    // Spell attack: triggered when the node was dropped from the spell list or carries a school
    const isSpellAttack = data.source === "spell" || Boolean(data.school);
    if (isSpellAttack) {
      const classDef = getClassDefinition(character.class);
      const ability = classDef?.spellcastingAbility;
      if (!ability) return null;
      return spellAttackBonus(
        character.level,
        character.abilityScores[ability]
      );
    }
    // Weapon / generic attack: proficiency + higher of STR or DEX
    const prof = proficiencyBonus(character.level);
    const strMod = abilityModifier(character.abilityScores.str);
    const dexMod = abilityModifier(character.abilityScores.dex);
    return prof + Math.max(strMod, dexMod);
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
      className={`${styles.actionNode} ${selected ? styles.selected : ""} ${isConflict ? styles.concentrationConflict : ""} ${isOverBudget && !isConflict ? styles.overBudget : ""}`}
      style={{ borderColor, position: "relative" }}
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
          {(() => {
            const baseLevel = parseInt(data.spellLevel ?? "0", 10);
            return data.castAtLevel && data.castAtLevel > baseLevel ? (
              <span
                className={styles.upcastBadge}
                title={`Upcast at ${toOrdinal(data.castAtLevel)} level`}
              >
                ↑ {toOrdinal(data.castAtLevel)}
              </span>
            ) : null;
          })()}
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
              <span
                className={styles.attackPill}
                title={
                  computedAttackBonus !== null
                    ? `Attack roll: ${formatModifier(computedAttackBonus)} to hit`
                    : "Attack roll required"
                }
              >
                <Icon src={d20Icon} size={12} /> 1d20
                {computedAttackBonus !== null && (
                  <span className={styles.attackBonusValue}>
                    {" "}
                    {formatModifier(computedAttackBonus)}
                  </span>
                )}
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

        {(() => {
          const baseLevel = parseInt(data.spellLevel ?? "0", 10);
          const isLevelledSpell = data.source === "spell" && baseLevel >= 1;
          if (!isLevelledSpell) return null;
          // Prefer the active chart's stored character so the pill range
          // stays correct after switching tabs (each tab has its own character).
          const activeCharacter = getActiveFlowchart()?.character ?? character;
          const maxLevel = activeCharacter
            ? getMaxSpellLevel(
                activeCharacter.class,
                activeCharacter.subclass,
                activeCharacter.level
              ) || 9
            : 9;
          const effectiveMax = Math.max(maxLevel, baseLevel);
          const activeCastLevel = data.castAtLevel ?? baseLevel;
          return (
            <div className={styles.castLevelRow}>
              {Array.from(
                { length: effectiveMax - baseLevel + 1 },
                (_, i) => baseLevel + i
              ).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  className={`${styles.castLevelPill}${
                    activeCastLevel === lvl
                      ? ` ${styles.castLevelPillActive}`
                      : ""
                  }`}
                  onClick={() => {
                    if (lvl === baseLevel) {
                      updateNodeData(id, {
                        castAtLevel: undefined,
                        damageDice: data.baseDamageDice,
                        duration: data.baseDuration ?? data.duration,
                        resourceCost: data.resourceCost
                          ? { ...data.resourceCost, amount: baseLevel }
                          : undefined,
                      });
                    } else {
                      updateNodeData(id, {
                        castAtLevel: lvl,
                        damageDice: data.baseDamageDice
                          ? getScaledDamageDice(
                              data.baseDamageDice,
                              data.higherLevels,
                              baseLevel,
                              lvl
                            )
                          : data.damageDice,
                        duration: getScaledDuration(
                          data.baseDuration ?? data.duration,
                          data.higherLevels,
                          lvl
                        ),
                        resourceCost: data.resourceCost
                          ? { ...data.resourceCost, amount: lvl }
                          : undefined,
                      });
                    }
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          );
        })()}

        {data.resourceCost && (
          <div className={styles.resourceCostRow}>
            <span
              className={styles.resourceCostBadge}
              title={`Resource cost: ${
                data.resourceCost.type === "spell-slot"
                  ? `${toOrdinal(data.resourceCost.amount ?? 1)} lvl spl slot`
                  : data.resourceCost.label ||
                    RESOURCE_SHORT_LABELS[data.resourceCost.type] ||
                    data.resourceCost.type
              }`}
            >
              <Icon
                src={RESOURCE_ICONS[data.resourceCost.type]}
                size={11}
                alt=""
              />
              {data.resourceCost.type === "spell-slot" ? (
                <>
                  <span className={styles.resourceCostAmount}>
                    {toOrdinal(data.resourceCost.amount ?? 1)}
                  </span>
                  lvl spl slot
                </>
              ) : (
                <>
                  {data.resourceCost.amount !== undefined && (
                    <span className={styles.resourceCostAmount}>
                      {data.resourceCost.amount}
                    </span>
                  )}
                  {data.resourceCost.label
                    ? data.resourceCost.label
                    : RESOURCE_SHORT_LABELS[data.resourceCost.type]}
                </>
              )}
            </span>
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
      {groupColor && (
        <span
          aria-label="Selection group member"
          style={{
            position: "absolute",
            bottom: 4,
            left: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: groupColor,
            boxShadow: "0 0 0 2px #0d1117",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
