import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import React, { useContext, useState } from "react";
import { getClassDefinition } from "../../data/classes";
import { ACTION_TYPE_LABELS, DAMAGE_TYPES } from "../../data/damageTypes";
import summonIcon from "../../icons/entity/summon.svg";
import beastIcon from "../../icons/monster/beast.svg";
import celestialIcon from "../../icons/monster/celestial.svg";
import constructIcon from "../../icons/monster/construct.svg";
import dragonIcon from "../../icons/monster/dragon.svg";
import elementalIcon from "../../icons/monster/elemental.svg";
import faeIcon from "../../icons/monster/fae.svg";
import fiendIcon from "../../icons/monster/fiend.svg";
import humanoidIcon from "../../icons/monster/humanoid.svg";
import undeadIcon from "../../icons/monster/undead.svg";
import type { CompanionNodeData, CompanionType } from "../../types";
import { SelectionGroupContext } from "../FlowCanvasContexts";
import { Icon } from "../Icon";
import styles from "./CompanionNode.module.css";

const COMPANION_TYPE_ICONS: Record<CompanionType, string> = {
  beast: beastIcon,
  construct: constructIcon,
  undead: undeadIcon,
  elemental: elementalIcon,
  fey: faeIcon,
  fiend: fiendIcon,
  dragon: dragonIcon,
  celestial: celestialIcon,
  humanoid: humanoidIcon,
};

const COMPANION_TYPE_LABELS: Record<CompanionType, string> = {
  beast: "Beast",
  construct: "Construct",
  undead: "Undead",
  elemental: "Elemental",
  fey: "Fey",
  fiend: "Fiend",
  dragon: "Dragon",
  celestial: "Celestial",
  humanoid: "Humanoid",
};

type CompanionNodeType = Node<CompanionNodeData, "companionNode">;

export function CompanionNode({
  id,
  data,
  selected,
}: NodeProps<CompanionNodeType>) {
  const groupColorMap = useContext(SelectionGroupContext);
  const groupColor = groupColorMap.get(id);

  const [actionsExpanded, setActionsExpanded] = useState(true);

  const classDef = getClassDefinition(data.classId);
  const headerColor = classDef?.color ?? "#5a6a78";

  const typeIcon = COMPANION_TYPE_ICONS[data.companionType] ?? summonIcon;
  const typeLabel =
    COMPANION_TYPE_LABELS[data.companionType] ?? data.companionType;

  const groupBorderStyle = groupColor
    ? { outline: `2px solid ${groupColor}`, outlineOffset: "2px" }
    : undefined;

  return (
    <div
      className={`${styles.companionNode}${selected ? ` ${styles.selected}` : ""}`}
      style={groupBorderStyle}
    >
      {/* Handles */}
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
      />
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
      />

      {/* Header */}
      <div className={styles.header} style={{ backgroundColor: headerColor }}>
        <div className={styles.headerLeft}>
          <Icon src={typeIcon} size={14} className={styles.typeIcon} />
          <span className={styles.companionName}>{data.label}</span>
        </div>
        <span className={styles.typeBadge}>{typeLabel}</span>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>HP</span>
          <span className={styles.statValue}>{data.hp}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>AC</span>
          <span className={styles.statValue}>{data.ac}</span>
        </div>
        {data.speed && (
          <>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statLabel}>Speed</span>
              <span className={styles.statValue}>{data.speed}</span>
            </div>
          </>
        )}
      </div>

      {/* Actions list */}
      {data.actions.length > 0 && (
        <div className={styles.actionsContainer}>
          <button
            type="button"
            className={styles.actionsToggle}
            onClick={() => setActionsExpanded((v) => !v)}
          >
            <span className={styles.actionsToggleLabel}>
              Actions ({data.actions.length})
            </span>
            <span className={styles.actionsToggleChevron}>
              {actionsExpanded ? "▾" : "▸"}
            </span>
          </button>
          {actionsExpanded && (
            <div className={styles.actionsList}>
              {data.actions.map((action) => {
                const dmgInfo = action.damageType
                  ? DAMAGE_TYPES[action.damageType]
                  : null;
                const actionInfo =
                  ACTION_TYPE_LABELS[action.actionType] ??
                  ACTION_TYPE_LABELS.action;
                return (
                  <div key={action.id} className={styles.actionRow}>
                    <span
                      className={styles.actionTypePip}
                      style={{ backgroundColor: actionInfo.color }}
                      title={actionInfo.label}
                    >
                      {actionInfo.short}
                    </span>
                    <span className={styles.actionName}>{action.name}</span>
                    {action.damageDice && dmgInfo && (
                      <span
                        className={styles.actionDamage}
                        style={{ color: dmgInfo.color }}
                      >
                        {action.damageDice}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className={styles.notes}>
          <span className={styles.notesText}>{data.notes}</span>
        </div>
      )}
    </div>
  );
}
