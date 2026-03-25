import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { TouchDropContext } from "../context/TouchDropContext";
import { DAMAGE_TYPES } from "../data/damageTypes";
import type { Weapon } from "../data/weapons";
import type { ActionNodeData } from "../types";
import { Icon } from "./Icon";
import styles from "./WeaponCard.module.css";

interface WeaponTooltipProps {
  weapon: Weapon;
  visible: boolean;
  top: number;
  left: number;
}

function WeaponTooltip({ weapon, visible, top, left }: WeaponTooltipProps) {
  if (!visible) return null;
  const damageInfo = DAMAGE_TYPES[weapon.damageType];
  return ReactDOM.createPortal(
    <div className={styles.tooltip} style={{ top, left }}>
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
    </div>,
    document.body
  );
}

interface WeaponCardProps {
  weapon: Weapon;
  hand?: "main" | "off";
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

/** Hold a card for 200 ms then drag it to the canvas on touch devices. */
function useTouchDragDrop(
  data: unknown,
  label: string,
  accentColor: string,
  cardRef: React.RefObject<HTMLDivElement | null>
) {
  const { dropAtPosition, closeLibrary } = useContext(TouchDropContext);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const libraryClosedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: cardRef.current is stable after mount
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (isDraggingRef.current) {
        e.preventDefault();
        if (ghostRef.current) {
          ghostRef.current.style.left = `${touch.clientX - 50}px`;
          ghostRef.current.style.top = `${touch.clientY - 20}px`;
          const overCanvas = !!document
            .elementFromPoint(touch.clientX, touch.clientY)
            ?.closest("[data-canvas-drop]");
          ghostRef.current.style.borderColor = overCanvas
            ? "#d4a017"
            : "rgba(139,148,158,0.5)";
          if (!libraryClosedRef.current) {
            const stillInPanel = !!document
              .elementFromPoint(touch.clientX, touch.clientY)
              ?.closest("[data-spell-panel]");
            if (!stillInPanel) {
              libraryClosedRef.current = true;
              closeLibrary();
            }
          }
        }
      } else {
        const dx = touch.clientX - startXRef.current;
        const dy = touch.clientY - startYRef.current;
        if ((Math.abs(dx) > 10 || Math.abs(dy) > 10) && holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        isDraggingRef.current = true;
        libraryClosedRef.current = false;
        const ghost = document.createElement("div");
        ghost.textContent = label;
        ghost.style.cssText = [
          "position:fixed",
          `left:${startXRef.current - 50}px`,
          `top:${startYRef.current - 22}px`,
          "background:#1c2026",
          "border:1.5px solid rgba(139,148,158,0.5)",
          `border-left:3px solid ${accentColor}`,
          "border-radius:6px",
          "padding:6px 12px",
          "font-size:13px",
          "font-weight:600",
          "color:#cdd9e5",
          "pointer-events:none",
          "z-index:9999",
          "opacity:0.92",
          "white-space:nowrap",
          "box-shadow:0 4px 20px rgba(0,0,0,0.5)",
          "font-family:system-ui,sans-serif",
        ].join(";");
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
      }, 200);
    },
    [label, accentColor]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      const wasDragging = isDraggingRef.current;
      isDraggingRef.current = false;
      if (ghostRef.current) {
        document.body.removeChild(ghostRef.current);
        ghostRef.current = null;
      }
      if (wasDragging) {
        const touch = e.changedTouches[0];
        const overCanvas = !!document
          .elementFromPoint(touch.clientX, touch.clientY)
          ?.closest("[data-canvas-drop]");
        if (overCanvas) {
          dropAtPosition(touch.clientX, touch.clientY, data);
        }
      }
    },
    [dropAtPosition, data]
  );

  return { handleTouchStart, handleTouchEnd };
}

export function WeaponCard({ weapon, hand, onDragStart }: WeaponCardProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const damageInfo = DAMAGE_TYPES[weapon.damageType];

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

  const isRanged =
    weapon.category === "simple-ranged" || weapon.category === "martial-ranged";

  const dragData: Partial<ActionNodeData> & { type: string } = {
    type: "actionNode",
    label: weapon.name,
    actionType: hand === "off" ? "bonus" : "action",
    damageType: weapon.damageType,
    damageDice: weapon.damageDice,
    rollType: "attack",
    range: weapon.range,
    description: [
      `${weapon.damageDice} ${damageInfo?.label ?? weapon.damageType}`,
      weapon.versatileDice ? `Versatile: ${weapon.versatileDice}` : "",
      weapon.properties.length > 0 ? weapon.properties.join(", ") : "",
    ]
      .filter(Boolean)
      .join(". "),
    source: "weapon",
    hand,
  };

  const { handleTouchStart, handleTouchEnd } = useTouchDragDrop(
    dragData,
    weapon.name,
    damageInfo?.color ?? "var(--border-accent)",
    cardRef
  );

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
      ref={cardRef}
      className={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, dragData)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ borderLeftColor: damageInfo?.color ?? "var(--border-accent)" }}
    >
      <div className={styles.cardTop}>
        <span className={styles.categoryBadge}>
          {isRanged ? "Ranged" : "Melee"}
        </span>
        {weapon.category.startsWith("martial") && (
          <span className={styles.martialTag}>Martial</span>
        )}
        {weapon.icon && (
          <span className={styles.weaponIconBadge}>
            <Icon src={weapon.icon} size={16} />
          </span>
        )}
        {hand === "main" && (
          <span className={styles.handBadgeMh} title="Main hand">
            MH
          </span>
        )}
        {hand === "off" && (
          <span className={styles.handBadgeOh} title="Off hand — Bonus Action">
            OH
          </span>
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

      <WeaponTooltip
        weapon={weapon}
        visible={tooltipVisible}
        top={tooltipPos.top}
        left={tooltipPos.left}
      />
    </div>
  );
}
