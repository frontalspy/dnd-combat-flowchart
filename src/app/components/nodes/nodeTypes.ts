import { ActionNode } from "./ActionNode";
import { CompanionNode } from "./CompanionNode";
import { ConditionNode } from "./ConditionNode";
import { ConditionStatusNode } from "./ConditionStatusNode";
import { EndNode } from "./EndNode";
import { NoteNode } from "./NoteNode";
import { StartNode } from "./StartNode";

export const nodeTypes = {
  actionNode: ActionNode,
  companionNode: CompanionNode,
  conditionNode: ConditionNode,
  conditionStatusNode: ConditionStatusNode,
  startNode: StartNode,
  endNode: EndNode,
  noteNode: NoteNode,
} as const;

export {
  ActionNode,
  CompanionNode,
  ConditionNode,
  ConditionStatusNode,
  StartNode,
  EndNode,
  NoteNode,
};
