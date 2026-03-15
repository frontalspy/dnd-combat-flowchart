import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useState } from "react";
import roundIcon from "../../icons/combat/round.svg";
import type { EndNodeData } from "../../types";
import { Icon } from "../Icon";
import styles from "./EndNode.module.css";

type EndNodeType = Node<EndNodeData, "endNode">;

export function EndNode({ id, data, selected }: NodeProps<EndNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: labelValue });
  }, [id, labelValue, updateNodeData]);

  return (
    <div className={`${styles.endNode} ${selected ? styles.selected : ""}`}>
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={styles.inner}>
        <span className={styles.icon}>
          <Icon src={roundIcon} size={17} />
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
    </div>
  );
}
