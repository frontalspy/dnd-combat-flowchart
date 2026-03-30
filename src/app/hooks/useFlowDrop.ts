import type { Node } from "@xyflow/react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import type {
  ActionNodeData,
  ConditionNodeData,
  ConditionStatusNodeData,
  DndCondition,
  EndNodeData,
  NoteNodeData,
  StartNodeData,
} from "../types";

let nodeIdCounter = 1;
function newId() {
  return `node-${Date.now()}-${nodeIdCounter++}`;
}

/** Shared node construction logic used by both the HTML5 drag-drop handler
 *  and the touch drag-drop handler. */
function buildNodeFromItem(
  item: Record<string, unknown>,
  position: { x: number; y: number }
): Node {
  const nodeType =
    (item.nodeType as string | undefined) ?? (item.type as string);

  if (nodeType === "conditionNode") {
    const data: ConditionNodeData = {
      label: (item.label as string) ?? "Condition?",
    };
    return { id: newId(), type: "conditionNode", position, data };
  }
  if (nodeType === "noteNode") {
    const data: NoteNodeData = { content: "" };
    return { id: newId(), type: "noteNode", position, data };
  }
  if (nodeType === "startNode") {
    const data: StartNodeData = {
      label: (item.label as string) ?? "Start",
    };
    return { id: newId(), type: "startNode", position, data };
  }
  if (nodeType === "endNode") {
    const data: EndNodeData = {
      label: (item.label as string) ?? "End of Round",
    };
    return { id: newId(), type: "endNode", position, data };
  }
  if (nodeType === "conditionStatusNode") {
    const data: ConditionStatusNodeData = {
      condition: (item.condition as DndCondition) ?? "poisoned",
      label: item.label as string | undefined,
      affects: (item.affects as ConditionStatusNodeData["affects"]) ?? "target",
      notes: "",
    };
    return { id: newId(), type: "conditionStatusNode", position, data };
  }

  // Default: actionNode — auto-populate resourceCost for spell nodes
  let resourceCost: ActionNodeData["resourceCost"];
  const spellLevelRaw = item.spellLevel as string | undefined;
  if (item.source === "spell" && spellLevelRaw && spellLevelRaw !== "cantrip") {
    const lvl = parseInt(spellLevelRaw, 10);
    if (!Number.isNaN(lvl)) {
      resourceCost = { type: "spell-slot", amount: lvl };
    }
  }

  const data: ActionNodeData = {
    label: (item.label as string) ?? "Action",
    actionType: (item.actionType as ActionNodeData["actionType"]) ?? "action",
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
    ritual: (item.ritual as boolean | undefined) ?? false,
    notes: "",
    resourceCost,
    spellComponents: item.spellComponents as string | undefined,
  };
  return { id: newId(), type: "actionNode", position, data };
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

      const newNode = buildNodeFromItem(item, position);
      setNodes((nds) => [...nds, newNode]);
      scheduleSnapshot();
    },
    [screenToFlowPosition, setNodes, scheduleSnapshot]
  );

  /** Drop a node at raw screen coordinates — used by the touch drag handler
   *  since HTML5 drag events are not fired by touch. */
  const dropAtPosition = useCallback(
    (clientX: number, clientY: number, rawData: unknown) => {
      const position = screenToFlowPosition({ x: clientX, y: clientY });
      const item = rawData as Record<string, unknown>;
      const newNode = buildNodeFromItem(item, position);
      setNodes((nds) => [...nds, newNode]);
      scheduleSnapshot();
    },
    [screenToFlowPosition, setNodes, scheduleSnapshot]
  );

  return { onDrop, onDragOver, dropAtPosition };
}
