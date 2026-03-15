import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useState } from "react";
import puzzleIcon from "../../icons/game/puzzle.svg";
import type { ConditionNodeData } from "../../types";
import { Icon } from "../Icon";
import styles from "./ConditionNode.module.css";

type ConditionNodeType = Node<ConditionNodeData, "conditionNode">;

export function ConditionNode({
  id,
  data,
  selected,
}: NodeProps<ConditionNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: labelValue });
  }, [id, labelValue, updateNodeData]);

  return (
    <div
      className={`${styles.conditionNode} ${selected ? styles.selected : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
        id="target"
      />

      <div className={styles.inner}>
        <div className={styles.icon}>
          <Icon src={puzzleIcon} size={22} />
        </div>

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
            className={styles.labelDisplay}
            onDoubleClick={() => setEditing(true)}
          >
            {data.label || "Double-click to edit condition"}
          </button>
        )}

        <div className={styles.branchLabels}>
          <span className={styles.yesLabel}>Yes</span>
          <span className={styles.noLabel}>No</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Left}
        id="yes"
        className={`${styles.handle} ${styles.yesHandle}`}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        className={`${styles.handle} ${styles.noHandle}`}
      />
    </div>
  );
}
