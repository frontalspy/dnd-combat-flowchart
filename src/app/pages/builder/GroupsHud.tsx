import { Layers } from "lucide-react";
import React from "react";
import { GROUP_COLORS } from "../../data/groupColors";
import type { SelectionGroup } from "../../types";
import styles from "../FlowchartBuilder.module.css";

interface GroupsHudProps {
  selectionGroups: SelectionGroup[];
  showGroupsPopover: boolean;
  onTogglePopover: () => void;
  onClosePopover: () => void;
  onDisbandGroup: (id: string) => void;
  onFocusNodes: (ids: string[]) => void;
}

export function GroupsHud({
  selectionGroups,
  showGroupsPopover,
  onTogglePopover,
  onClosePopover,
  onDisbandGroup,
  onFocusNodes,
}: GroupsHudProps) {
  return (
    <>
      <button
        type="button"
        className={`${styles.loadoutChip} ${selectionGroups.length > 0 ? styles.groupsChipArmed : ""}`}
        onClick={onTogglePopover}
        title="Active selection groups"
      >
        <Layers size={13} />
        Groups
        {selectionGroups.length > 0 && (
          <span className={styles.groupsCount}>{selectionGroups.length}</span>
        )}
      </button>

      {showGroupsPopover && (
        <div className={styles.groupsPopover} onMouseLeave={onClosePopover}>
          <div className={styles.groupsPopoverHeader}>Selection Groups</div>

          {selectionGroups.length === 0 ? (
            <div className={styles.groupsPopoverEmpty}>
              No groups yet. Multi-select nodes and click &ldquo;Group
              Selection&rdquo;.
            </div>
          ) : (
            <ul className={styles.groupsPopoverList}>
              {selectionGroups.map((group, idx) => {
                const color = GROUP_COLORS[idx % GROUP_COLORS.length];
                return (
                  <li key={group.id} className={styles.groupsPopoverItem}>
                    <span
                      className={styles.groupsColorDot}
                      style={{ background: color }}
                    />
                    <button
                      type="button"
                      className={styles.groupsSelectBtn}
                      onClick={() => {
                        onFocusNodes(group.nodeIds);
                        onClosePopover();
                      }}
                      title="Click to select all nodes in this group"
                    >
                      {group.label}
                    </button>
                    <span className={styles.groupsMemberCount}>
                      {group.nodeIds.length} nodes
                    </span>
                    <button
                      type="button"
                      className={styles.groupsDisbandBtn}
                      onClick={() => onDisbandGroup(group.id)}
                      title="Disband group"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
