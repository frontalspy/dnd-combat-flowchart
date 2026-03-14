import { ActionNode } from "./ActionNode";
import { ConditionNode } from "./ConditionNode";
import { NoteNode } from "./NoteNode";
import { StartNode } from "./StartNode";

export const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  startNode: StartNode,
  noteNode: NoteNode,
} as const;

export { ActionNode, ConditionNode, StartNode, NoteNode };
