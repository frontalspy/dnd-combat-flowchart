import React, { useCallback, useRef, useState } from "react";
import { DAMAGE_TYPES } from "../data/damageTypes";
import type { Weapon } from "../data/weapons";
import type { ActionNodeData } from "../types";
import styles from "./WeaponCard.module.css";

interface WeaponTooltipProps {
  weapon: Weapon;
  visible: boolean;
}

function WeaponTooltip({ weapon, visible }: WeaponTooltipProps) {
  if (!visible) return null;
  const damageInfo = DAMAGE_TYPES[weapon.damageType];
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipName}>{weapon.name}</span>
        <span className={styles.tooltipType}>
          {weapon.category.replace("-", " ")}
        </span>
      </div>
      <div className={styles.tooltipMeta}>
        <span>
          <strong>Damage:</strong> {weapon.damageDice}{" "}
          {damageInfo?.label ?? weapon.damageType}
          {weapon.versatileDice && ` (${weapon.versatileDice} versatile)`}
        </span>
        {weapon.range && (
          <span>
            <strong>Range:</strong> {weapon.range}
          </span>
        )}
        {weapon.properties.length > 0 && (
          <span>
            <strong>Properties:</strong> {weapon.properties.join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}

interface WeaponCardProps {
  weapon: Weapon;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

export function WeaponCard({ weapon, onDragStart }: WeaponCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const damageInfo = DAMAGE_TYPES[weapon.damageType];

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setTooltipVisible(true), 500);
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTooltipVisible(false);
  }, []);

  const isRanged =
    weapon.category === "simple-ranged" || weapon.category === "martial-ranged";

  const dragData: Partial<ActionNodeData> & { type: string } = {
    type: "actionNode",
    label: weapon.name,
    actionType: "action",
    damageType: weapon.damageType,
    damageDice: weapon.damageDice,
    range: weapon.range,
    description: [
      `${weapon.damageDice} ${damageInfo?.label ?? weapon.damageType}`,
      weapon.versatileDice ? `Versatile: ${weapon.versatileDice}` : "",
      weapon.properties.length > 0 ? weapon.properties.join(", ") : "",
    ]
      .filter(Boolean)
      .join(". "),
    source: "weapon",
  };

  const tagIcons: string[] = [];
  if (weapon.properties.includes("finesse")) tagIcons.push("Fin");
  if (weapon.properties.includes("versatile")) tagIcons.push("Ver");
  if (weapon.properties.includes("thrown")) tagIcons.push("Thr");
  if (weapon.properties.includes("reach")) tagIcons.push("Rch");
  if (weapon.properties.includes("heavy")) tagIcons.push("Hvy");
  if (weapon.properties.includes("light")) tagIcons.push("Lgt");
  if (isRanged && weapon.properties.includes("two-handed")) tagIcons.push("2H");

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, dragData)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ borderLeftColor: damageInfo?.color ?? "var(--border-accent)" }}
    >
      <div className={styles.cardTop}>
        <span className={styles.categoryBadge}>
          {isRanged ? "Ranged" : "Melee"}
        </span>
        {weapon.category.startsWith("martial") && (
          <span className={styles.martialTag}>Martial</span>
        )}
      </div>

      <div className={styles.cardName}>{weapon.name}</div>

      <div className={styles.cardPills}>
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
              width={11}
              height={11}
              alt=""
              aria-hidden="true"
              style={{ verticalAlign: "middle" }}
            />{" "}
            {weapon.damageDice} {damageInfo.label}
          </span>
        )}
        {weapon.range && (
          <span className={styles.rangePill}>{weapon.range}</span>
        )}
      </div>

      {tagIcons.length > 0 && (
        <div className={styles.propTags}>
          {tagIcons.map((t) => (
            <span key={t} className={styles.propTag}>
              {t}
            </span>
          ))}
        </div>
      )}

      <WeaponTooltip weapon={weapon} visible={tooltipVisible} />
    </div>
  );
}
