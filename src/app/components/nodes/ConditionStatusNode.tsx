import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useContext, useState } from "react";
// Lazy icon imports — indexed by condition key
import blindedIcon from "../../icons/condition/blinded.svg?raw";
import charmedIcon from "../../icons/condition/charmed.svg?raw";
import deafenedIcon from "../../icons/condition/deafened.svg?raw";
import exhaustionIcon from "../../icons/condition/exhaustion.svg?raw";
import frightenedIcon from "../../icons/condition/frightened.svg?raw";
import grappledIcon from "../../icons/condition/grappled.svg?raw";
import incapacitatedIcon from "../../icons/condition/incapacitated.svg?raw";
import invisibleIcon from "../../icons/condition/invisible.svg?raw";
import paralyzedIcon from "../../icons/condition/paralyzed.svg?raw";
import petrifiedIcon from "../../icons/condition/petrified.svg?raw";
import poisonedIcon from "../../icons/condition/poisoned.svg?raw";
import proneIcon from "../../icons/condition/prone.svg?raw";
import restrainedIcon from "../../icons/condition/restrained.svg?raw";
import stunnedIcon from "../../icons/condition/stunned.svg?raw";
import unconsciousIcon from "../../icons/condition/unconscious.svg?raw";
import type { ConditionStatusNodeData, DndCondition } from "../../types";
import { SelectionGroupContext } from "../FlowCanvasContexts";
import { ConditionIcon } from "./ConditionIcon";
import styles from "./ConditionStatusNode.module.css";

export const CONDITION_ICONS: Record<DndCondition, string> = {
  blinded: blindedIcon,
  charmed: charmedIcon,
  deafened: deafenedIcon,
  exhaustion: exhaustionIcon,
  frightened: frightenedIcon,
  grappled: grappledIcon,
  incapacitated: incapacitatedIcon,
  invisible: invisibleIcon,
  paralyzed: paralyzedIcon,
  petrified: petrifiedIcon,
  poisoned: poisonedIcon,
  prone: proneIcon,
  restrained: restrainedIcon,
  stunned: stunnedIcon,
  unconscious: unconsciousIcon,
};

export const CONDITION_DESCRIPTIONS: Record<DndCondition, string> = {
  blinded:
    "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
  charmed:
    "A charmed creature can't attack the charmer or target them with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.",
  deafened:
    "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
  exhaustion:
    "Exhaustion is measured in six levels. Each level imposes cumulative penalties to ability checks, speed, attack rolls, saving throws, and maximum HP. At level 6, the creature dies.",
  frightened:
    "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
  grappled:
    "A grappled creature's speed becomes 0 and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature.",
  incapacitated: "An incapacitated creature can't take actions or reactions.",
  invisible:
    "An invisible creature is impossible to see without magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature's attacks have advantage, and attacks against it have disadvantage.",
  paralyzed:
    "A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against it have advantage. Any attack that hits is a critical hit if the attacker is within 5 feet.",
  petrified:
    "A petrified creature is transformed into a solid inanimate substance. It is incapacitated, can't move or speak, and is unaware of its surroundings. Attack rolls against it have advantage and it has resistance to all damage. It's immune to poison and disease.",
  poisoned:
    "A poisoned creature has disadvantage on attack rolls and ability checks.",
  prone:
    "A prone creature's only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. Attack rolls against it have advantage if within 5 feet; otherwise, such rolls have disadvantage.",
  restrained:
    "A restrained creature's speed becomes 0. Attack rolls against it have advantage, and its own attack rolls have disadvantage. It has disadvantage on Dexterity saving throws.",
  stunned:
    "A stunned creature is incapacitated, can't move, and can only speak falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against it have advantage.",
  unconscious:
    "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. It automatically fails Strength and Dexterity saving throws. Attack rolls against it have advantage. Any hit is a critical hit if within 5 feet.",
};

export const CONDITION_DISPLAY_NAMES: Record<DndCondition, string> = {
  blinded: "Blinded",
  charmed: "Charmed",
  deafened: "Deafened",
  exhaustion: "Exhaustion",
  frightened: "Frightened",
  grappled: "Grappled",
  incapacitated: "Incapacitated",
  invisible: "Invisible",
  paralyzed: "Paralyzed",
  petrified: "Petrified",
  poisoned: "Poisoned",
  prone: "Prone",
  restrained: "Restrained",
  stunned: "Stunned",
  unconscious: "Unconscious",
};

type ConditionStatusNodeType = Node<
  ConditionStatusNodeData,
  "conditionStatusNode"
>;

export function ConditionStatusNode({
  id,
  data,
  selected,
}: NodeProps<ConditionStatusNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(
    data.label ?? CONDITION_DISPLAY_NAMES[data.condition]
  );
  const groupColorMap = useContext(SelectionGroupContext);
  const groupColor = groupColorMap.get(id);

  const displayName = data.label || CONDITION_DISPLAY_NAMES[data.condition];
  const icon = CONDITION_ICONS[data.condition];

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: labelValue || undefined });
  }, [id, labelValue, updateNodeData]);

  const affectsLabel =
    data.affects === "self"
      ? "Self"
      : data.affects === "area"
        ? "Area"
        : "Target";

  const affectsStyleMap: Record<ConditionStatusNodeData["affects"], string> = {
    target: styles.affectsTarget,
    self: styles.affectsSelf,
    area: styles.affectsArea,
  };

  return (
    <div
      className={`${styles.node} ${affectsStyleMap[data.affects]} ${selected ? styles.selected : ""}`}
      data-condition={data.condition}
      style={{ position: "relative" }}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={styles.handle}
      />

      <div className={styles.inner}>
        <span className={styles.icon}>
          <ConditionIcon svg={icon} size={18} alt={displayName} />
        </span>
        <div className={styles.content}>
          <span className={styles.affectsLabel}>{affectsLabel}</span>
          {editing ? (
            <input
              className={styles.labelInput}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") handleBlur();
              }}
              autoFocus
            />
          ) : (
            <button
              type="button"
              className={styles.label}
              onDoubleClick={() => setEditing(true)}
              title="Double-click to rename"
            >
              {displayName}
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
        title="Immune / not affected"
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
