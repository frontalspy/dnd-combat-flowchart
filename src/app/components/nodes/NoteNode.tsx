import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import React, { useCallback, useContext, useState } from "react";
import scrollIcon from "../../icons/entity/scroll.svg";
import type { NoteNodeData } from "../../types";
import { SelectionGroupContext } from "../FlowCanvasContexts";
import { Icon } from "../Icon";
import styles from "./NoteNode.module.css";

type NoteNodeType = Node<NoteNodeData, "noteNode">;

export function NoteNode({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [content, setContent] = useState(data.content);
  const groupColorMap = useContext(SelectionGroupContext);
  const groupColor = groupColorMap.get(id);

  const handleBlur = useCallback(() => {
    updateNodeData(id, { content });
  }, [id, content, updateNodeData]);

  return (
    <div
      className={`${styles.wrapper} ${selected ? styles.selected : ""}`}
      style={{ position: "relative" }}
    >
      <div className={styles.noteNode}>
        <div className={styles.corner} />
        <div className={styles.header}>
          <span className={styles.icon}>
            <Icon src={scrollIcon} size={13} />
          </span>
          <span className={styles.title}>Note</span>
        </div>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onMouseDown={(e) => {
            // Let React Flow handle modifier+clicks for multi-select.
            // Without this, the textarea consumes Shift/Ctrl mousedown events
            // and the node never gets added to the selection.
            if (e.shiftKey || e.ctrlKey || e.metaKey) e.preventDefault();
          }}
          placeholder="Type your note here..."
          rows={4}
        />
      </div>
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
