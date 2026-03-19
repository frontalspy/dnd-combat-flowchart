import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useState } from "react";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../../data/damageTypes";
import type { GroupNodeData } from "../../types";
import styles from "./GroupNode.module.css";

type GroupNodeType = Node<GroupNodeData, "groupNode">;

export function GroupNode({ id, data, selected }: NodeProps<GroupNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);

  const toggleCollapsed = useCallback(() => {
    updateNodeData(id, { collapsed: !data.collapsed });
  }, [id, data.collapsed, updateNodeData]);

  const handleLabelBlur = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: labelValue });
  }, [id, labelValue, updateNodeData]);

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        if (e.key === "Escape") setLabelValue(data.label);
        setEditing(false);
        if (e.key !== "Escape") updateNodeData(id, { label: labelValue });
      }
    },
    [id, data.label, labelValue, updateNodeData]
  );

  return (
    <div
      className={`${styles.groupNode} ${selected ? styles.selected : ""} ${data.collapsed ? styles.collapsed : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={styles.handle}
      />

      {/* Header */}
      <div className={styles.header}>
        {editing ? (
          <input
            className={styles.labelInput}
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className={styles.headerLabel}
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {data.label || "Action Group"}
          </button>
        )}

        <div className={styles.headerRight}>
          <span
            className={styles.countBadge}
            title={`${data.variants.length} variant${data.variants.length !== 1 ? "s" : ""}`}
          >
            {data.variants.length}
          </span>
          <button
            type="button"
            className={`${styles.chevron} ${data.collapsed ? styles.chevronCollapsed : ""}`}
            onClick={toggleCollapsed}
            title={data.collapsed ? "Expand variants" : "Collapse variants"}
            aria-label={data.collapsed ? "Expand group" : "Collapse group"}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Variant list — hidden when collapsed via CSS transition */}
      <div className={styles.variantList}>
        {data.variants.length === 0 ? (
          <div className={styles.emptyHint}>
            No variants — select node to add
          </div>
        ) : (
          data.variants.map((variant) => {
            const damageInfo = variant.damageType
              ? DAMAGE_TYPES[variant.damageType]
              : null;
            const schoolInfo = variant.school
              ? SPELL_SCHOOLS[variant.school.toLowerCase()]
              : null;
            const actionInfo =
              ACTION_TYPE_LABELS[variant.actionType] ??
              ACTION_TYPE_LABELS.action;

            return (
              <div key={variant.id} className={styles.variantRow}>
                <div className={styles.variantRowTop}>
                  <span className={styles.variantDot}>✦</span>
                  <span className={styles.variantLabel} title={variant.label}>
                    {variant.label}
                  </span>
                  <div className={styles.variantBadges}>
                    {schoolInfo && (
                      <span
                        className={styles.schoolBadge}
                        style={{ color: schoolInfo.color }}
                        title={schoolInfo.label}
                      >
                        {schoolInfo.abbreviation}
                      </span>
                    )}
                    {variant.spellLevel !== undefined && (
                      <span className={styles.levelBadge}>
                        {variant.spellLevel === "cantrip"
                          ? "✦"
                          : `Lv${variant.spellLevel}`}
                      </span>
                    )}
                    <span
                      className={styles.actionTypeBadge}
                      style={{ backgroundColor: actionInfo.color }}
                      title={actionInfo.label}
                    >
                      {actionInfo.short}
                    </span>
                    {damageInfo && (
                      <span
                        className={styles.damagePill}
                        style={{
                          color: damageInfo.color,
                          backgroundColor: damageInfo.bgColor,
                        }}
                      >
                        {variant.damageDice ? `${variant.damageDice} ` : ""}
                        {damageInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Detail sub-line: roll type, range, duration */}
                {(variant.rollType === "attack" ||
                  (variant.rollType === "save" && variant.saveAbility) ||
                  variant.range ||
                  (variant.duration &&
                    variant.duration !== "Instantaneous")) && (
                  <div className={styles.variantDetails}>
                    {variant.rollType === "attack" && (
                      <span
                        className={styles.variantAttackPill}
                        title="Attack roll"
                      >
                        ATK
                      </span>
                    )}
                    {variant.rollType === "save" && variant.saveAbility && (
                      <span
                        className={styles.variantSavePill}
                        title="Saving throw"
                      >
                        {variant.saveAbility} SAVE
                      </span>
                    )}
                    {variant.range && (
                      <span className={styles.variantDetailPill} title="Range">
                        {variant.range}
                      </span>
                    )}
                    {variant.duration &&
                      variant.duration !== "Instantaneous" && (
                        <span
                          className={styles.variantDetailPill}
                          title="Duration"
                        >
                          {variant.duration}
                        </span>
                      )}
                  </div>
                )}

                {!data.collapsed && (
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`source-variant-${variant.id}`}
                    className={styles.variantHandle}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className={`${styles.handle} ${styles.bottomHandle}`}
      />
    </div>
  );
}
