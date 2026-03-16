import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { Trash2, X } from "lucide-react";
import React, { useCallback } from "react";
import styles from "./MultiSelectBar.module.css";

interface MultiSelectBarProps {
  selectedNodes: Node[];
  onDeselect: () => void;
}

export function MultiSelectBar({
  selectedNodes,
  onDeselect,
}: MultiSelectBarProps) {
  const { deleteElements } = useReactFlow();

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: selectedNodes });
    onDeselect();
  }, [deleteElements, selectedNodes, onDeselect]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>
          {selectedNodes.length} nodes selected
        </span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onDeselect}
          title="Deselect all (Escape)"
        >
          <X size={14} />
        </button>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
          title="Delete all selected nodes"
        >
          <Trash2 size={14} />
          Delete all
        </button>
        <button
          type="button"
          className={styles.deselectBtn}
          onClick={onDeselect}
        >
          Deselect
        </button>
      </div>
    </div>
  );
}
