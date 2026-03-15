import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useState } from "react";
import combatIcon from "../../icons/game/combat.svg";
import type { StartNodeData } from "../../types";
import { Icon } from "../Icon";
import styles from "./StartNode.module.css";

type StartNodeType = Node<StartNodeData, "startNode">;

export function StartNode({ id, data, selected }: NodeProps<StartNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: labelValue });
  }, [id, labelValue, updateNodeData]);

  return (
    <div className={`${styles.startNode} ${selected ? styles.selected : ""}`}>
      <div className={styles.inner}>
        <span className={styles.icon}>
          <Icon src={combatIcon} size={17} />
        </span>
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
          >
            {data.label}
          </button>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
    </div>
  );
}
