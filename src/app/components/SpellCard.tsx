import React, { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  detectDamageType,
  extractDamageDice,
  extractRollType,
  extractSaveAbility,
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
  top: number;
  left: number;
}

function SpellTooltip({ spell, visible, top, left }: SpellTooltipProps) {
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div className={styles.tooltip} style={{ top, left }}>
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
      <div className={styles.tooltipFooter}>
        {spell.ritual && <span className={styles.ritualBadge}>Ritual</span>}
        {spell.source && spell.source !== "SRD" && (
          <span className={styles.sourceBadge} data-source={spell.source}>
            {spell.source}
          </span>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ActionTooltipProps {
  action: ActionItem;
  visible: boolean;
  top: number;
  left: number;
}

function ActionTooltip({ action, visible, top, left }: ActionTooltipProps) {
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div className={styles.tooltip} style={{ top, left }}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{action.name}</span>
        <span className={styles.tooltipType}>
          {ACTION_TYPE_LABELS[action.actionType]?.label ?? action.actionType}
        </span>
      </div>
      <p className={styles.tooltipDesc}>{action.description}</p>
    </div>,
    document.body
  );
}

interface SpellCardProps {
  spell: Spell;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
  classBadges?: Array<{ label: string; color: string }>;
}

export function SpellCard({ spell, onDragStart, classBadges }: SpellCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const damageType = detectDamageType(spell.description, spell.name);
  const damageInfo = damageType ? DAMAGE_TYPES[damageType] : null;
  const schoolInfo = SPELL_SCHOOLS[spell.school?.toLowerCase()] ?? null;
  const actionType = getActionTypeFromCastingTime(spell.casting_time);
  const actionInfo = ACTION_TYPE_LABELS[actionType];

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.right + 8 });
    }
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
    baseDamageDice: extractDamageDice(spell.description) ?? undefined,
    baseDuration: spell.duration,
    saveDC: extractSaveDC(spell.description) ?? undefined,
    saveAbility: extractSaveAbility(spell.description) ?? undefined,
    rollType: extractRollType(spell.description),
    higherLevels: spell.higher_levels ?? undefined,
    concentration:
      spell.concentration === true ||
      spell.duration?.toLowerCase().includes("concentration") === true,
  };

  return (
    <div
      ref={cardRef}
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

      {classBadges && classBadges.length > 0 && (
        <div className={styles.classBadges}>
          {classBadges.map((b) => (
            <span
              key={b.label}
              className={styles.classBadge}
              style={{ borderColor: b.color, color: b.color }}
              title={`Available from ${b.label}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      <SpellTooltip
        spell={spell}
        visible={tooltipVisible}
        top={tooltipPos.top}
        left={tooltipPos.left}
      />
    </div>
  );
}

interface ActionCardProps {
  action: ActionItem;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

export function ActionCard({ action, onDragStart }: ActionCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const damageInfo = action.damageType ? DAMAGE_TYPES[action.damageType] : null;
  const actionInfo =
    ACTION_TYPE_LABELS[action.actionType] ?? ACTION_TYPE_LABELS.action;

  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top, left: rect.right + 8 });
    }
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
    damageDice: extractDamageDice(action.description) ?? undefined,
    saveDC: extractSaveDC(action.description) ?? undefined,
    saveAbility: extractSaveAbility(action.description) ?? undefined,
    rollType: extractRollType(action.description),
  };

  return (
    <div
      ref={cardRef}
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

      <ActionTooltip
        action={action}
        visible={tooltipVisible}
        top={tooltipPos.top}
        left={tooltipPos.left}
      />
    </div>
  );
}
