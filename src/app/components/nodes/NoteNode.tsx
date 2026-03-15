import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import React, { useCallback, useState } from "react";
import scrollIcon from "../../icons/entity/scroll.svg";
import type { NoteNodeData } from "../../types";
import { Icon } from "../Icon";
import styles from "./NoteNode.module.css";

type NoteNodeType = Node<NoteNodeData, "noteNode">;

export function NoteNode({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [content, setContent] = useState(data.content);

  const handleBlur = useCallback(() => {
    updateNodeData(id, { content });
  }, [id, content, updateNodeData]);

  return (
    <div className={`${styles.noteNode} ${selected ? styles.selected : ""}`}>
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
        placeholder="Type your note here..."
        rows={4}
      />
    </div>
  );
}
