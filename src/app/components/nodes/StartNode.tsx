import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import React, { useCallback, useContext, useState } from "react";
import combatIcon from "../../icons/game/combat.svg";
import type { StartNodeData } from "../../types";
import { SelectionGroupContext } from "../FlowCanvasContexts";
import { Icon } from "../Icon";
import styles from "./StartNode.module.css";

type StartNodeType = Node<StartNodeData, "startNode">;

export function StartNode({ id, data, selected }: NodeProps<StartNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);
  const groupColorMap = useContext(SelectionGroupContext);
  const groupColor = groupColorMap.get(id);

  const handleBlur = useCallback(() => {
    setEditing(false);
    updateNodeData(id, { label: labelValue });
  }, [id, labelValue, updateNodeData]);

  return (
    <div
      className={`${styles.startNode} ${selected ? styles.selected : ""}`}
      style={{ position: "relative" }}
    >
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
        id="source-bottom"
        className={styles.handle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className={styles.handle}
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
