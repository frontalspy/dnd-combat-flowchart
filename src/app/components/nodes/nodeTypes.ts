import { ActionNode } from "./ActionNode";
import { ConditionNode } from "./ConditionNode";
import { ConditionStatusNode } from "./ConditionStatusNode";
import { EndNode } from "./EndNode";
import { GroupNode } from "./GroupNode";
import { NoteNode } from "./NoteNode";
import { StartNode } from "./StartNode";

export const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  conditionStatusNode: ConditionStatusNode,
  startNode: StartNode,
  endNode: EndNode,
  noteNode: NoteNode,
  groupNode: GroupNode,
} as const;

export {
  ActionNode,
  ConditionNode,
  ConditionStatusNode,
  StartNode,
  EndNode,
  NoteNode,
  GroupNode,
};
