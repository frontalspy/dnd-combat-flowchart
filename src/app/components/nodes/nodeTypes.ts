import { ActionNode } from "./ActionNode";
import { ConditionNode } from "./ConditionNode";
import { EndNode } from "./EndNode";
import { NoteNode } from "./NoteNode";
import { StartNode } from "./StartNode";

export const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  startNode: StartNode,
  endNode: EndNode,
  noteNode: NoteNode,
} as const;

export { ActionNode, ConditionNode, StartNode, EndNode, NoteNode };
