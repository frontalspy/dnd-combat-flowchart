import type { Node } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import type {
  ActionNodeData,
  ConditionNodeData,
  ConditionStatusNodeData,
  DndCondition,
  EndNodeData,
  GroupNodeData,
  NoteNodeData,
  StartNodeData,
} from "../types";

let nodeIdCounter = 1;
function newId() {
  return `node-${Date.now()}-${nodeIdCounter++}`;
}

interface UseFlowDropOptions {
  screenToFlowPosition: (pos: { x: number; y: number }) => {
    x: number;
    y: number;
  };
  setNodes: Dispatch<SetStateAction<Node[]>>;
  scheduleSnapshot: () => void;
}

export function useFlowDrop({
  screenToFlowPosition,
  setNodes,
  scheduleSnapshot,
}: UseFlowDropOptions) {
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;

      let item: Record<string, unknown>;
      try {
        item = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeType =
        (item.nodeType as string | undefined) ?? (item.type as string);

      let newNode: Node;

      if (nodeType === "conditionNode") {
        const data: ConditionNodeData = {
          label: (item.label as string) ?? "Condition?",
        };
        newNode = { id: newId(), type: "conditionNode", position, data };
      } else if (nodeType === "noteNode") {
        const data: NoteNodeData = { content: "" };
        newNode = { id: newId(), type: "noteNode", position, data };
      } else if (nodeType === "startNode") {
        const data: StartNodeData = {
          label: (item.label as string) ?? "Start",
        };
        newNode = { id: newId(), type: "startNode", position, data };
      } else if (nodeType === "endNode") {
        const data: EndNodeData = {
          label: (item.label as string) ?? "End of Round",
        };
        newNode = { id: newId(), type: "endNode", position, data };
      } else if (nodeType === "groupNode") {
        const data: GroupNodeData = {
          label: (item.label as string) ?? "Action Group",
          variants: (item.variants as GroupNodeData["variants"]) ?? [],
          collapsed: false,
        };
        newNode = { id: newId(), type: "groupNode", position, data };
      } else if (nodeType === "conditionStatusNode") {
        const data: ConditionStatusNodeData = {
          condition: (item.condition as DndCondition) ?? "poisoned",
          label: item.label as string | undefined,
          affects:
            (item.affects as ConditionStatusNodeData["affects"]) ?? "target",
          notes: "",
        };
        newNode = { id: newId(), type: "conditionStatusNode", position, data };
      } else {
        // Auto-populate resourceCost for spell nodes
        let resourceCost: ActionNodeData["resourceCost"];
        const spellLevelRaw = item.spellLevel as string | undefined;
        if (
          item.source === "spell" &&
          spellLevelRaw &&
          spellLevelRaw !== "cantrip"
        ) {
          const lvl = parseInt(spellLevelRaw, 10);
          if (!Number.isNaN(lvl)) {
            resourceCost = { type: "spell-slot", amount: lvl };
          }
        }

        const data: ActionNodeData = {
          label: (item.label as string) ?? "Action",
          actionType:
            (item.actionType as ActionNodeData["actionType"]) ?? "action",
          damageType: item.damageType as ActionNodeData["damageType"],
          school: item.school as string | undefined,
          description: item.description as string | undefined,
          spellLevel: item.spellLevel as string | undefined,
          range: item.range as string | undefined,
          duration: item.duration as string | undefined,
          source: (item.source as ActionNodeData["source"]) ?? "standard",
          damageDice: item.damageDice as string | undefined,
          baseDamageDice:
            (item.baseDamageDice as string | undefined) ??
            (item.damageDice as string | undefined),
          baseDuration:
            (item.baseDuration as string | undefined) ??
            (item.duration as string | undefined),
          saveDC: item.saveDC as string | undefined,
          saveAbility: item.saveAbility as string | undefined,
          rollType: item.rollType as ActionNodeData["rollType"],
          higherLevels: item.higherLevels as string | undefined,
          hand: item.hand as ActionNodeData["hand"],
          concentration: (item.concentration as boolean | undefined) ?? false,
          notes: "",
          resourceCost,
        };
        newNode = { id: newId(), type: "actionNode", position, data };
      }

      setNodes((nds) => [...nds, newNode]);
      scheduleSnapshot();
    },
    [screenToFlowPosition, setNodes, scheduleSnapshot]
  );

  return { onDrop, onDragOver };
}
