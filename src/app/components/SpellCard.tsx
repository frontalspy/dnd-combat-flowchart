import React, { useCallback, useRef, useState } from "react";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  detectDamageType,
  extractDamageDice,
  extractRollType,
  extractSaveDC,
  getActionTypeFromCastingTime,
  SPELL_SCHOOLS,
} from "../data/damageTypes";
import buildIcon from "../icons/util/build.svg";
import starIcon from "../icons/util/star.svg";
import type { ActionItem, Spell } from "../types";
import { Icon } from "./Icon";
import styles from "./SpellCard.module.css";

interface SpellTooltipProps {
  spell: Spell;
  visible: boolean;
}

function SpellTooltip({ spell, visible }: SpellTooltipProps) {
  if (!visible) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{spell.name}</span>
        <span className={styles.tooltipType}>{spell.type}</span>
      </div>
      <div className={styles.tooltipMeta}>
        <span>
          <strong>Casting Time:</strong> {spell.casting_time}
        </span>
        <span>
          <strong>Range:</strong> {spell.range}
        </span>
        <span>
          <strong>Components:</strong> {spell.components.raw}
        </span>
        <span>
          <strong>Duration:</strong> {spell.duration}
        </span>
      </div>
      <p className={styles.tooltipDesc}>{spell.description}</p>
      {spell.higher_levels && (
        <p className={styles.tooltipHigher}>
          <strong>At Higher Levels:</strong> {spell.higher_levels}
        </p>
      )}
      {spell.ritual && <span className={styles.ritualBadge}>Ritual</span>}
    </div>
  );
}

interface ActionTooltipProps {
  action: ActionItem;
  visible: boolean;
}

function ActionTooltip({ action, visible }: ActionTooltipProps) {
  if (!visible) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{action.name}</span>
        <span className={styles.tooltipType}>
          {ACTION_TYPE_LABELS[action.actionType]?.label ?? action.actionType}
        </span>
      </div>
      <p className={styles.tooltipDesc}>{action.description}</p>
    </div>
  );
}

interface SpellCardProps {
  spell: Spell;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

export function SpellCard({ spell, onDragStart }: SpellCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const damageType = detectDamageType(spell.description, spell.name);
  const damageInfo = damageType ? DAMAGE_TYPES[damageType] : null;
  const schoolInfo = SPELL_SCHOOLS[spell.school?.toLowerCase()] ?? null;
  const actionType = getActionTypeFromCastingTime(spell.casting_time);
  const actionInfo = ACTION_TYPE_LABELS[actionType];

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setTooltipVisible(true), 500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTooltipVisible(false);
  }, []);

  const dragData = {
    type: "actionNode",
    label: spell.name,
    actionType,
    damageType,
    school: spell.school?.toLowerCase(),
    description: spell.description,
    spellLevel: spell.level,
    range: spell.range,
    duration: spell.duration,
    source: "spell" as const,
    damageDice: extractDamageDice(spell.description) ?? undefined,
    saveDC: extractSaveDC(spell.description) ?? undefined,
    rollType: extractRollType(spell.description),
    higherLevels: spell.higher_levels ?? undefined,
  };

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, dragData)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ borderLeftColor: schoolInfo?.color ?? "#30363d" }}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          {schoolInfo && (
            <span
              className={styles.schoolBadge}
              style={{ color: schoolInfo.color }}
            >
              {schoolInfo.abbreviation}
            </span>
          )}
          <span className={styles.levelBadge}>
            {spell.level === "cantrip" ? "✦ Cantrip" : `Lv ${spell.level}`}
          </span>
        </div>
        <span
          className={styles.actionBadge}
          style={{ backgroundColor: actionInfo.color }}
          title={actionInfo.label}
        >
          {actionInfo.short}
        </span>
      </div>

      <div className={styles.cardName}>{spell.name}</div>

      {damageInfo && (
        <span
          className={styles.damageBadge}
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
          {damageInfo.label}
        </span>
      )}

      <SpellTooltip spell={spell} visible={tooltipVisible} />
    </div>
  );
}

interface ActionCardProps {
  action: ActionItem;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

export function ActionCard({ action, onDragStart }: ActionCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const damageInfo = action.damageType ? DAMAGE_TYPES[action.damageType] : null;
  const actionInfo =
    ACTION_TYPE_LABELS[action.actionType] ?? ACTION_TYPE_LABELS.action;

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setTooltipVisible(true), 500);
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTooltipVisible(false);
  }, []);

  const dragData = {
    type: "actionNode",
    label: action.name,
    actionType: action.actionType,
    damageType: action.damageType,
    description: action.description,
    range: action.range,
    duration: action.duration,
    source: action.source,
  };

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, dragData)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ borderLeftColor: actionInfo.color }}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardMeta}>
          <span
            className={styles.sourceBadge}
            style={{ color: action.source === "class" ? "#d4a017" : "#8b949e" }}
          >
            {action.source === "class" ? (
              <>
                <Icon src={starIcon} size={11} /> Class
              </>
            ) : action.source === "custom" ? (
              <>
                <Icon src={buildIcon} size={11} /> Custom
              </>
            ) : (
              "Standard"
            )}
          </span>
        </div>
        <span
          className={styles.actionBadge}
          style={{ backgroundColor: actionInfo.color }}
          title={actionInfo.label}
        >
          {actionInfo.short}
        </span>
      </div>

      <div className={styles.cardName}>{action.name}</div>

      {damageInfo && (
        <span
          className={styles.damageBadge}
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
          {damageInfo.label}
        </span>
      )}

      <ActionTooltip action={action} visible={tooltipVisible} />
    </div>
  );
}
