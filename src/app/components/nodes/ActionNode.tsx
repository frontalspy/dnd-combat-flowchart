import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useContext, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useApp } from "../../context/AppContext";
import { getClassDefinition, getMaxSpellLevel } from "../../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  extractAoE,
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
import advantageIcon from "../../icons/dice/advantage.svg";
import d20Icon from "../../icons/dice/d20.svg";
import disadvantageIcon from "../../icons/dice/disadvantage.svg";
import timeIcon from "../../icons/entity/time.svg";
import spellIcon from "../../icons/game/spell.svg";
import criticalRoleIcon from "../../icons/logo/critical-role.svg";
import concentrationIcon from "../../icons/spell/concentration.svg";
import materialIcon from "../../icons/spell/material.svg";
import ritualIcon from "../../icons/spell/ritual.svg";
import somaticIcon from "../../icons/spell/somatic.svg";
import vocalIcon from "../../icons/spell/vocal.svg";
import circleIcon from "../../icons/target/circle.svg";
import coneIcon from "../../icons/target/cone.svg";
import cubeIcon from "../../icons/target/cube.svg";
import cylinderIcon from "../../icons/target/cylinder.svg";
import emanationIcon from "../../icons/target/emanation.svg";
import lineIcon from "../../icons/target/line.svg";
import sphereIcon from "../../icons/target/sphere.svg";
import squareIcon from "../../icons/target/square.svg";
import wallIcon from "../../icons/target/wall.svg";
import starIcon from "../../icons/util/star.svg";
import type { ActionNodeData, ResourceType } from "../../types";
import {
  getCritDice,
  getScaledDamageDice,
  getScaledDuration,
  toOrdinal,
} from "../../utils/spellScaling";
import {
  ActionEconomyContext,
  ConcentrationContext,
  CritDiceContext,
  SelectionGroupContext,
} from "../FlowCanvasContexts";
import { Icon } from "../Icon";
import styles from "./ActionNode.module.css";

interface NodeTooltipProps {
  data: ActionNodeData;
  visible: boolean;
  top: number;
  left: number;
}

function NodeTooltip({ data, visible, top, left }: NodeTooltipProps) {
  if (!visible) return null;
  const damageInfo = data.damageType ? DAMAGE_TYPES[data.damageType] : null;
  const schoolInfo = data.school
    ? SPELL_SCHOOLS[data.school.toLowerCase()]
    : null;
  const actionInfo =
    ACTION_TYPE_LABELS[data.actionType] ?? ACTION_TYPE_LABELS.action;
  return ReactDOM.createPortal(
    <div className={styles.nodeTooltip} style={{ top, left }}>
      <div className={styles.nodeTooltipHeader}>
        <span className={styles.nodeTooltipName}>{data.label}</span>
        <span className={styles.nodeTooltipType}>{actionInfo.label}</span>
      </div>
      {(schoolInfo || damageInfo || data.range || data.duration) && (
        <div className={styles.nodeTooltipMeta}>
          {schoolInfo && (
            <span>
              <strong>School:</strong> {schoolInfo.label}
            </span>
          )}
          {damageInfo && (
            <span>
              <strong>Damage:</strong>{" "}
              {data.damageDice ? `${data.damageDice} ` : ""}
              {damageInfo.label}
            </span>
          )}
          {data.range && (
            <span>
              <strong>Range:</strong> {data.range}
            </span>
          )}
          {data.duration && (
            <span>
              <strong>Duration:</strong> {data.duration}
              {data.concentration && " (Concentration)"}
            </span>
          )}
          {data.spellLevel && (
            <span>
              <strong>Level:</strong>{" "}
              {data.spellLevel === "cantrip" ? "Cantrip" : `${data.spellLevel}`}
            </span>
          )}
          {data.spellComponents && (
            <span>
              <strong>Components:</strong> {data.spellComponents}
            </span>
          )}
        </div>
      )}
      {data.description && (
        <p className={styles.nodeTooltipDesc}>{data.description}</p>
      )}
      {data.higherLevels && (
        <p className={styles.nodeTooltipHigher}>
          <strong>At Higher Levels:</strong> {data.higherLevels}
        </p>
      )}
      {data.notes && (
        <p className={styles.nodeTooltipNotes}>
          <strong>Notes:</strong> {data.notes}
        </p>
      )}
    </div>,
    document.body
  );
}

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

const AOE_ICONS: Record<string, string> = {
  circle: circleIcon,
  cone: coneIcon,
  cube: cubeIcon,
  cylinder: cylinderIcon,
  emanation: emanationIcon,
  line: lineIcon,
  sphere: sphereIcon,
  square: squareIcon,
  wall: wallIcon,
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
  const { updateNodeData, setNodes } = useReactFlow();
  const { state, getActiveFlowchart } = useApp();
  const conflictNodeIds = useContext(ConcentrationContext);
  const isConflict = conflictNodeIds.has(id);
  const overBudgetNodeIds = useContext(ActionEconomyContext);
  const isOverBudget = overBudgetNodeIds.has(id);
  const groupColorMap = useContext(SelectionGroupContext);
  const groupColor = groupColorMap.get(id);
  const critDiceEnabled = useContext(CritDiceContext);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(data.notes ?? "");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  // Disable hover tooltip on touch devices — they use the NodeEditor drawer instead
  const isTouchDevice = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches
  );

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice.current) return;
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.right + 10 });
    }
    tooltipTimer.current = setTimeout(() => setTooltipVisible(true), 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice.current) return;
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setTooltipVisible(false);
  }, []);

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

  const showCrit = data.rollType === "attack" || data.source === "weapon";
  const critExpr =
    showCrit && data.damageDice ? getCritDice(data.damageDice) : null;

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
      ref={nodeRef}
      className={`${styles.actionNode} ${selected ? styles.selected : ""} ${isConflict ? styles.concentrationConflict : ""} ${isOverBudget && !isConflict ? styles.overBudget : ""}`}
      style={{ borderColor, position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
          {data.ritual && (
            <span
              className={styles.ritualBadge}
              title="Can be cast as a ritual"
            >
              <Icon src={ritualIcon} size={10} />
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
          {data.advantageState === "advantage" && (
            <div
              className={styles.advantageBadge}
              title={
                data.advantageNote
                  ? `Advantage — ${data.advantageNote}`
                  : "Advantage"
              }
            >
              <Icon src={advantageIcon} size={14} alt="Advantage" />
            </div>
          )}
          {data.advantageState === "disadvantage" && (
            <div
              className={styles.disadvantageBadge}
              title={
                data.advantageNote
                  ? `Disadvantage — ${data.advantageNote}`
                  : "Disadvantage"
              }
            >
              <Icon src={disadvantageIcon} size={14} alt="Disadvantage" />
            </div>
          )}
          {(() => {
            const baseLevelRaw = parseInt(data.spellLevel ?? "0", 10);
            const baseLevel = Number.isNaN(baseLevelRaw) ? 0 : baseLevelRaw;
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
          {critDiceEnabled && critExpr && damageInfo && (
            <span
              className={styles.critBadge}
              style={{
                color: damageInfo.color,
                backgroundColor: damageInfo.bgColor,
              }}
              title="Critical hit damage (all dice doubled)"
            >
              <Icon src={criticalRoleIcon} size={11} aria-hidden="true" />
              {critExpr} {damageInfo.label}
            </span>
          )}
          {data.range &&
            (() => {
              const aoe = extractAoE(data.range, data.description ?? "");
              const baseRange = aoe
                ? data.range.replace(/\s*\([^)]*\)/, "").trim()
                : data.range;
              return (
                <span
                  className={styles.infoPill}
                  title={
                    aoe
                      ? `Range: ${baseRange} — ${aoe.size} ${aoe.shape}`
                      : "Range"
                  }
                >
                  <Icon src={reachIcon} size={12} /> {baseRange}
                  {aoe && AOE_ICONS[aoe.shape] && (
                    <>
                      {" "}
                      {aoe.size} <Icon src={AOE_ICONS[aoe.shape]} size={12} />
                    </>
                  )}
                </span>
              );
            })()}
          {data.duration && data.duration !== "Instantaneous" && (
            <span className={styles.infoPill} title="Duration">
              <Icon src={timeIcon} size={12} /> {data.duration}
            </span>
          )}
          {data.spellComponents &&
            (() => {
              const raw = data.spellComponents;
              const prefix = raw.split("(")[0];
              const hasV = /\bV\b/.test(prefix);
              const hasS = /\bS\b/.test(prefix);
              const hasM = /\bM\b/.test(prefix);
              const matDesc = raw.match(/\(([^)]+)\)/)?.[1];
              if (!hasV && !hasS && !hasM) return null;
              return (
                <>
                  {hasV && (
                    <span
                      className={styles.componentPill}
                      title="Verbal component"
                    >
                      <Icon src={vocalIcon} size={11} alt="Verbal" />
                    </span>
                  )}
                  {hasS && (
                    <span
                      className={styles.componentPill}
                      title="Somatic component"
                    >
                      <Icon src={somaticIcon} size={11} alt="Somatic" />
                    </span>
                  )}
                  {hasM && (
                    <span
                      className={styles.componentPill}
                      title={
                        matDesc ? `Material: ${matDesc}` : "Material component"
                      }
                    >
                      <Icon src={materialIcon} size={11} alt="Material" />
                    </span>
                  )}
                </>
              );
            })()}
        </div>

        {/* Roll type + standalone dice indicators */}
        {(() => {
          const showRow =
            data.rollType === "attack" ||
            data.label === "Attack" ||
            data.rollType === "save" ||
            (data.damageDice && !data.damageType);
          if (!showRow) return null;
          return (
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
                      : data.saveDC
                        ? `DC ${data.saveDC} saving throw`
                        : "Saving throw required"
                  }
                >
                  {(computedSaveDC !== null || data.saveDC) && (
                    <span className={styles.saveDcValue}>
                      {computedSaveDC ?? data.saveDC}{" "}
                    </span>
                  )}
                  {data.saveAbility ? `${data.saveAbility} SAVE` : "SAVE"}
                </span>
              )}
              {data.damageDice && !data.damageType && (
                <span className={styles.dicePill}>{data.damageDice}</span>
              )}
            </div>
          );
        })()}

        {data.higherLevels && (
          <div className={styles.higherLevels} title="At higher levels">
            ↑ {data.higherLevels}
          </div>
        )}

        {!data.higherLevels &&
          data.castAtLevel !== undefined &&
          (() => {
            const bl =
              data.spellLevel === "cantrip"
                ? 0
                : parseInt(data.spellLevel ?? "0", 10) || 0;
            return data.castAtLevel > bl ? (
              <div className={styles.scalesNote}>Scales — see description</div>
            ) : null;
          })()}

        {(() => {
          const baseLevelRaw = parseInt(data.spellLevel ?? "0", 10);
          const baseLevel = Number.isNaN(baseLevelRaw) ? 0 : baseLevelRaw;
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setEditingNotes(true);
                if (!selected) {
                  setNodes((nds) =>
                    nds.map((n) => ({ ...n, selected: n.id === id }))
                  );
                }
              }}
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
      <NodeTooltip
        data={data}
        visible={tooltipVisible}
        top={tooltipPos.top}
        left={tooltipPos.left}
      />
    </div>
  );
}
