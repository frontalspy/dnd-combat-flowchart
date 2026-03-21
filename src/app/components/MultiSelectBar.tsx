import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { Layers, Trash2, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import type { SelectionGroup } from "../types";
import styles from "./MultiSelectBar.module.css";

interface MultiSelectBarProps {
  selectedNodes: Node[];
  onDeselect: () => void;
  selectionGroups?: SelectionGroup[];
  onCreateGroup?: (nodeIds: string[], name: string) => void;
  onDisbandGroup?: (groupId: string) => void;
}

export function MultiSelectBar({
  selectedNodes,
  onDeselect,
  selectionGroups = [],
  onCreateGroup,
  onDisbandGroup,
}: MultiSelectBarProps) {
  const { deleteElements } = useReactFlow();
  const [groupName, setGroupName] = useState("");

  const handleDelete = useCallback(() => {
    deleteElements({ nodes: selectedNodes });
    onDeselect();
  }, [deleteElements, selectedNodes, onDeselect]);

  // Determine whether all selected nodes already belong to one shared group
  const selectedIds = selectedNodes.map((n) => n.id);
  const sharedGroup =
    selectionGroups.find(
      (g) =>
        selectedIds.length >= 2 &&
        selectedIds.every((id) => g.nodeIds.includes(id))
    ) ?? null;

  const handleCreateGroup = useCallback(() => {
    if (!onCreateGroup) return;
    const name = groupName.trim() || `Group ${selectionGroups.length + 1}`;
    onCreateGroup(selectedIds, name);
    setGroupName("");
  }, [onCreateGroup, selectedIds, groupName, selectionGroups.length]);

  const handleDisbandGroup = useCallback(() => {
    if (sharedGroup && onDisbandGroup) {
      onDisbandGroup(sharedGroup.id);
    }
  }, [sharedGroup, onDisbandGroup]);

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
      <div className={styles.groupSection}>
        {sharedGroup ? (
          <>
            <div className={styles.groupInfo}>
              <Layers size={12} />
              <span className={styles.groupInfoLabel}>{sharedGroup.label}</span>
            </div>
            <button
              type="button"
              className={styles.disbandBtn}
              onClick={handleDisbandGroup}
            >
              Disband group
            </button>
          </>
        ) : (
          <>
            <input
              className={styles.groupNameInput}
              placeholder={`Group ${selectionGroups.length + 1}`}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
            />
            <button
              type="button"
              className={styles.groupBtn}
              onClick={handleCreateGroup}
              title="Link selected nodes into a selection group"
            >
              <Layers size={13} />
              Group Selection
            </button>
          </>
        )}
      </div>
    </div>
  );
}
