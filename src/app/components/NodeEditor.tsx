import type { Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { Layers, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getClassDefinition } from "../data/classes";
import {
  ACTION_TYPE_LABELS,
  DAMAGE_TYPES,
  SPELL_SCHOOLS,
} from "../data/damageTypes";
import {
  ABILITY_FULL_NAMES,
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
} from "../data/stats";
import type {
  Character,
  ConditionStatusNodeData,
  DndClass,
  DndCondition,
  ResourceCost,
  ResourceType,
  SelectionGroup,
} from "../types";
import { Icon } from "./Icon";
import styles from "./NodeEditor.module.css";
import { ConditionIcon } from "./nodes/ConditionIcon";
import {
  CONDITION_DESCRIPTIONS,
  CONDITION_DISPLAY_NAMES,
  CONDITION_ICONS,
} from "./nodes/ConditionStatusNode";

const RESOURCE_LABELS: Record<ResourceType, string> = {
  "spell-slot": "Spell Slot",
  ki: "Ki Points",
  rage: "Rage",
  "superiority-die": "Superiority Die",
  "channel-divinity": "Channel Divinity",
  "bardic-inspiration": "Bardic Inspiration",
  "lay-on-hands": "Lay on Hands",
  "wild-shape": "Wild Shape",
  "sorcery-point": "Sorcery Points",
  "warlock-invocation": "Warlock Slot",
  custom: "Custom",
};

const CLASS_RESOURCES: Record<DndClass, ResourceType[]> = {
  barbarian: ["rage", "custom"],
  bard: ["spell-slot", "bardic-inspiration", "custom"],
  cleric: ["spell-slot", "channel-divinity", "custom"],
  druid: ["spell-slot", "wild-shape", "custom"],
  fighter: ["spell-slot", "superiority-die", "custom"],
  monk: ["ki", "custom"],
  paladin: ["spell-slot", "channel-divinity", "lay-on-hands", "custom"],
  ranger: ["spell-slot", "custom"],
  rogue: ["spell-slot", "custom"],
  sorcerer: ["spell-slot", "sorcery-point", "custom"],
  warlock: ["spell-slot", "warlock-invocation", "custom"],
  wizard: ["spell-slot", "custom"],
};

const ALL_RESOURCE_TYPES: ResourceType[] = [
  "spell-slot",
  "ki",
  "rage",
  "superiority-die",
  "channel-divinity",
  "bardic-inspiration",
  "lay-on-hands",
  "wild-shape",
  "sorcery-point",
  "warlock-invocation",
  "custom",
];

/** Resource types that carry a numeric amount */
const AMOUNT_RESOURCE_TYPES = new Set<ResourceType>([
  "spell-slot",
  "ki",
  "superiority-die",
  "lay-on-hands",
  "sorcery-point",
]);

interface NodeEditorProps {
  selectedNode: Node | null;
  onClose: () => void;
  character?: Character;
  customWeapons?: import("../data/weapons").Weapon[];
  selectionGroups?: SelectionGroup[];
  onRemoveFromGroup?: (nodeId: string, groupId: string) => void;
  onDisbandGroup?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, name: string) => void;
  /** When true the panel renders as a bottom-sheet overlay (phone layout). */
  isSheet?: boolean;
}

export function NodeEditor({
  selectedNode,
  onClose,
  character,
  customWeapons = [],
  selectionGroups = [],
  onRemoveFromGroup,
  onDisbandGroup,
  onRenameGroup,
  isSheet = false,
}: NodeEditorProps) {
  const panelRef = useRef<HTMLElement>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const handleDragTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    if (panelRef.current) panelRef.current.style.transition = "none";
  }, []);

  const handleDragTouchMove = useCallback(
    (e: React.TouchEvent) => {
      touchCurrentY.current = e.touches[0].clientY;
      const dy = touchCurrentY.current - touchStartY.current;
      const el = panelRef.current;
      if (!el) return;
      if (dy > 0) {
        // Dragging down — translate the panel for the dismiss gesture
        el.style.transform = `translateY(${dy}px)`;
        el.style.height = "";
      } else if (!sheetExpanded) {
        // Dragging up while collapsed — grow height, never move position
        const baseVh = window.innerHeight * 0.25;
        const maxVh = window.innerHeight * 0.5;
        const newH = Math.min(baseVh + Math.abs(dy), maxVh);
        el.style.transform = "";
        el.style.height = `${newH}px`;
      }
    },
    [sheetExpanded]
  );

  const handleDragTouchEnd = useCallback(() => {
    const dy = touchCurrentY.current - touchStartY.current;
    const el = panelRef.current;
    if (!el) return;
    // Always clear any inline overrides first
    el.style.transform = "";
    el.style.height = "";
    if (dy > 80) {
      if (sheetExpanded) {
        // Collapse back to 25vh — don't close
        el.style.transition = "";
        setSheetExpanded(false);
      } else {
        // Close
        el.style.transition = "transform 0.22s ease";
        el.style.transform = "translateY(100%)";
        setTimeout(() => {
          el.style.transition = "";
          el.style.transform = "";
          onClose();
        }, 220);
      }
    } else if (dy < -40 && !sheetExpanded) {
      // Expand to 50vh
      el.style.transition = "";
      setSheetExpanded(true);
    } else {
      // Snap back to current snap point
      el.style.transition = "transform 0.22s ease";
      el.style.transform = "";
      setTimeout(() => {
        el.style.transition = "";
      }, 220);
    }
  }, [sheetExpanded, onClose]);
  const { updateNodeData, deleteElements } = useReactFlow();

  const [notes, setNotes] = useState("");
  const [label, setLabel] = useState("");
  const [rcType, setRcType] = useState<ResourceType | "">("");
  const [rcAmount, setRcAmount] = useState("");
  const [rcLabel, setRcLabel] = useState("");

  // Reset expanded state when a new node is selected
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on node id only
  useEffect(() => {
    setSheetExpanded(false);
  }, [selectedNode?.id]);

  useEffect(() => {
    if (!selectedNode) return;
    const d = selectedNode.data as Record<string, unknown>;
    setNotes(typeof d.notes === "string" ? d.notes : "");
    setLabel(typeof d.label === "string" ? d.label : "");
    const rc = d.resourceCost as ResourceCost | undefined;
    setRcType(rc?.type ?? "");
    setRcAmount(rc?.amount !== undefined ? String(rc.amount) : "");
    setRcLabel(rc?.label ?? "");
  }, [selectedNode]);

  const handleSaveNotes = useCallback(() => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { notes });
  }, [selectedNode, notes, updateNodeData]);

  const handleSaveLabel = useCallback(() => {
    if (!selectedNode) return;
    updateNodeData(selectedNode.id, { label });
  }, [selectedNode, label, updateNodeData]);

  const handleDelete = useCallback(() => {
    if (!selectedNode) return;
    deleteElements({ nodes: [selectedNode] });
    onClose();
  }, [selectedNode, deleteElements, onClose]);

  const applyResourceCost = useCallback(
    (type: ResourceType | "", amount: string, label: string) => {
      if (!selectedNode) return;
      if (!type) {
        updateNodeData(selectedNode.id, { resourceCost: undefined });
        return;
      }
      const parsedAmount = parseInt(amount, 10);
      const rc: ResourceCost = {
        type,
        amount:
          AMOUNT_RESOURCE_TYPES.has(type) && !Number.isNaN(parsedAmount)
            ? parsedAmount
            : undefined,
        label: type === "custom" && label ? label : undefined,
      };
      updateNodeData(selectedNode.id, { resourceCost: rc });
    },
    [selectedNode, updateNodeData]
  );

  const handleRcTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as ResourceType | "";
      setRcType(newType);
      applyResourceCost(newType, rcAmount, rcLabel);
    },
    [applyResourceCost, rcAmount, rcLabel]
  );

  const handleRcAmountBlur = useCallback(() => {
    applyResourceCost(rcType, rcAmount, rcLabel);
  }, [applyResourceCost, rcType, rcAmount, rcLabel]);

  const handleRcLabelBlur = useCallback(() => {
    applyResourceCost(rcType, rcAmount, rcLabel);
  }, [applyResourceCost, rcType, rcAmount, rcLabel]);

  // ─────────────────────────────────────────────────────────────────

  if (!selectedNode) return null;

  const nodeType = selectedNode.type as string;
  const data = selectedNode.data as Record<string, unknown>;

  const damageTypeKey =
    typeof data.damageType === "string" ? data.damageType : null;
  const schoolKey =
    typeof data.school === "string" ? data.school.toLowerCase() : null;
  const actionTypeKey =
    typeof data.actionType === "string" ? data.actionType : null;

  const damageInfo = damageTypeKey
    ? DAMAGE_TYPES[damageTypeKey as keyof typeof DAMAGE_TYPES]
    : null;
  const schoolInfo = schoolKey ? SPELL_SCHOOLS[schoolKey] : null;
  const actionInfo = actionTypeKey ? ACTION_TYPE_LABELS[actionTypeKey] : null;

  const typeLabel =
    nodeType === "actionNode"
      ? "Action / Spell"
      : nodeType === "conditionNode"
        ? "Condition"
        : nodeType === "startNode"
          ? "Start Node"
          : nodeType === "conditionStatusNode"
            ? "Condition Status"
            : "Note";

  const descriptionText =
    typeof data.description === "string" ? data.description : null;
  const rangeText = typeof data.range === "string" ? data.range : null;
  const durationText = typeof data.duration === "string" ? data.duration : null;

  return (
    <aside
      ref={panelRef}
      className={`${styles.panel}${isSheet ? ` ${styles.panelSheet}` : ""}${
        isSheet && sheetExpanded ? ` ${styles.panelSheetExpanded}` : ""
      }`}
    >
      {/* Mobile drag handle — drag up to expand, drag down to collapse/close */}
      {isSheet && (
        <div
          className={styles.sheetHandle}
          onTouchStart={handleDragTouchStart}
          onTouchMove={handleDragTouchMove}
          onTouchEnd={handleDragTouchEnd}
          role="button"
          aria-label={
            sheetExpanded
              ? "Drag down to collapse"
              : "Drag up to expand or tap to close"
          }
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onClose();
          }}
        >
          <span className={styles.sheetHandleBar} />
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.nodeTypeLabel}>{typeLabel}</span>
          {actionInfo && (
            <span
              className={styles.actionTypeBadge}
              style={{ backgroundColor: actionInfo.color }}
            >
              {actionInfo.label}
            </span>
          )}
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className={styles.body}>
        {/* Damage & school info */}
        {(damageInfo || schoolInfo) && (
          <div className={styles.infoRow}>
            {schoolInfo && (
              <span
                className={styles.schoolChip}
                style={{
                  color: schoolInfo.color,
                  borderColor: schoolInfo.color,
                }}
              >
                {schoolInfo.label}
              </span>
            )}
            {damageInfo && (
              <span
                className={styles.damageChip}
                style={{
                  color: damageInfo.color,
                  backgroundColor: damageInfo.bgColor,
                }}
              >
                <Icon src={damageInfo.icon} size={14} alt={damageInfo.label} />{" "}
                {damageInfo.label}
              </span>
            )}
          </div>
        )}

        {/* Name / label editing */}
        {(nodeType === "actionNode" ||
          nodeType === "conditionNode" ||
          nodeType === "startNode") && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Name</label>
            <div className={styles.fieldRow}>
              <input
                className={styles.fieldInput}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleSaveLabel}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveLabel();
                }}
              />
            </div>
          </div>
        )}

        {/* Range / Duration for action nodes */}
        {nodeType === "actionNode" && (rangeText || durationText) && (
          <div className={styles.pillRow}>
            {rangeText && (
              <span className={styles.infoPill}>📏 {rangeText}</span>
            )}
            {durationText && durationText !== "Instantaneous" && (
              <span className={styles.infoPill}>⏱ {durationText}</span>
            )}
          </div>
        )}

        {/* Condition Status Node — condition info + affects editor */}
        {nodeType === "conditionStatusNode" &&
          (() => {
            const csData = data as unknown as ConditionStatusNodeData;
            const cond = csData.condition as DndCondition;
            const desc = CONDITION_DESCRIPTIONS[cond];
            const iconSrc = CONDITION_ICONS[cond];
            const displayName = CONDITION_DISPLAY_NAMES[cond];
            return (
              <>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Condition</label>
                  <div className={styles.conditionInfoRow}>
                    <ConditionIcon svg={iconSrc} size={20} alt={displayName} />
                    <span className={styles.conditionDisplayName}>
                      {displayName}
                    </span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Affects</label>
                  <div className={styles.pillRow}>
                    {(["target", "self", "area"] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        className={`${styles.infoPill} ${csData.affects === a ? styles.infoPillActive : ""}`}
                        onClick={() =>
                          updateNodeData(selectedNode!.id, { affects: a })
                        }
                      >
                        {a === "target"
                          ? "Target"
                          : a === "self"
                            ? "Self"
                            : "Area"}
                      </button>
                    ))}
                  </div>
                </div>
                {desc && (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Effect</label>
                    <p className={styles.descText}>{desc}</p>
                  </div>
                )}
              </>
            );
          })()}

        {/* Description */}
        {descriptionText && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description</label>
            <p className={styles.descText}>{descriptionText}</p>
          </div>
        )}

        {/* Resource Cost (action nodes only) */}
        {nodeType === "actionNode" &&
          (() => {
            const availableResources: ResourceType[] = character
              ? (CLASS_RESOURCES[character.class] ?? ALL_RESOURCE_TYPES)
              : ALL_RESOURCE_TYPES;
            return (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Resource Cost</label>
                <div className={styles.fieldRow}>
                  <select
                    className={styles.resourceSelect}
                    value={rcType}
                    onChange={handleRcTypeChange}
                  >
                    <option value="">— None —</option>
                    {availableResources.map((rt) => (
                      <option key={rt} value={rt}>
                        {RESOURCE_LABELS[rt]}
                      </option>
                    ))}
                  </select>
                </div>
                {rcType && AMOUNT_RESOURCE_TYPES.has(rcType) && (
                  <div className={styles.fieldRow}>
                    <label className={styles.amountLabel}>Amount</label>
                    <input
                      type="number"
                      min={1}
                      className={styles.amountInput}
                      value={rcAmount}
                      onChange={(e) => setRcAmount(e.target.value)}
                      onBlur={handleRcAmountBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRcAmountBlur();
                      }}
                      placeholder="1"
                    />
                  </div>
                )}
                {rcType === "custom" && (
                  <div className={styles.fieldRow}>
                    <input
                      className={styles.fieldInput}
                      value={rcLabel}
                      onChange={(e) => setRcLabel(e.target.value)}
                      onBlur={handleRcLabelBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRcLabelBlur();
                      }}
                      placeholder="Label (e.g. Bardic Dice)"
                    />
                  </div>
                )}
              </div>
            );
          })()}

        {/* Notes */}
        {nodeType !== "noteNode" && nodeType !== "startNode" && (
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Notes</label>
            <textarea
              className={styles.notesTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add personal notes, reminders, or conditions..."
              rows={4}
            />
          </div>
        )}

        {/* Computed character stats */}
        {nodeType === "actionNode" &&
          character?.abilityScores &&
          (() => {
            const classDef = getClassDefinition(character.class);
            const spellAbility = classDef?.spellcastingAbility ?? null;
            const scores = character.abilityScores;
            const prof = proficiencyBonus(character.level);
            if (!spellAbility) return null;
            const score = scores[spellAbility];
            const dc = spellSaveDC(character.level, score);
            const atk = spellAttackBonus(character.level, score);
            const mod = abilityModifier(score);
            const abilityName = ABILITY_FULL_NAMES[spellAbility];
            return (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Computed Stats</label>
                <div className={styles.computedRows}>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>
                      Spellcasting ({abilityName})
                    </span>
                    <span className={styles.computedVal}>
                      {score} ({formatModifier(mod)})
                    </span>
                  </div>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>
                      Proficiency Bonus
                    </span>
                    <span className={styles.computedVal}>
                      {formatModifier(prof)}
                    </span>
                  </div>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>Spell Save DC</span>
                    <span className={styles.computedVal}>{dc}</span>
                  </div>
                  <div className={styles.computedRow}>
                    <span className={styles.computedKey}>
                      Spell Attack Bonus
                    </span>
                    <span className={styles.computedVal}>
                      {formatModifier(atk)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* ── Selection Group section ── */}
        {(() => {
          const memberGroup = selectionGroups.find((g) =>
            g.nodeIds.includes(selectedNode.id)
          );
          if (!memberGroup) return null;
          return (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                <Layers
                  size={12}
                  style={{ verticalAlign: "middle", marginRight: 4 }}
                />
                Selection Group
              </label>
              <input
                className={styles.fieldInput}
                defaultValue={memberGroup.label}
                onBlur={(e) => onRenameGroup?.(memberGroup.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    onRenameGroup?.(
                      memberGroup.id,
                      (e.target as HTMLInputElement).value
                    );
                }}
                key={memberGroup.id}
              />
              <p className={styles.groupMemberCount}>
                {memberGroup.nodeIds.length} node
                {memberGroup.nodeIds.length !== 1 ? "s" : ""} in this group
              </p>
              <div className={styles.groupActions}>
                <button
                  type="button"
                  className={styles.removeFromGroupBtn}
                  onClick={() =>
                    onRemoveFromGroup?.(selectedNode.id, memberGroup.id)
                  }
                >
                  Remove from group
                </button>
                <button
                  type="button"
                  className={styles.disbandGroupBtn}
                  onClick={() => onDisbandGroup?.(memberGroup.id)}
                >
                  Disband group
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
        >
          <Trash2 size={14} />
          Delete Node
        </button>
        <span className={styles.hint}>
          Delete key also removes selected nodes
        </span>
      </div>
    </aside>
  );
}
