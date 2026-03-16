import { ActionNode } from "./ActionNode";
import { ConditionNode } from "./ConditionNode";
import { EndNode } from "./EndNode";
import { GroupNode } from "./GroupNode";
import { NoteNode } from "./NoteNode";
import { StartNode } from "./StartNode";

export const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  startNode: StartNode,
  endNode: EndNode,
  noteNode: NoteNode,
  groupNode: GroupNode,
} as const;

export { ActionNode, ConditionNode, StartNode, EndNode, NoteNode, GroupNode };
