export type DndClass =
  | "barbarian"
  | "bard"
  | "cleric"
  | "druid"
  | "fighter"
  | "monk"
  | "paladin"
  | "ranger"
  | "rogue"
  | "sorcerer"
  | "warlock"
  | "wizard";

export type ActionType =
  | "action"
  | "bonus"
  | "reaction"
  | "free"
  | "special"
  | "movement";

export type DamageType =
  | "acid"
  | "bludgeoning"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "piercing"
  | "poison"
  | "psychic"
  | "radiant"
  | "slashing"
  | "thunder"
  | "healing";

export interface SpellComponents {
  material: boolean;
  materials_needed?: string[];
  raw: string;
  somatic: boolean;
  verbal: boolean;
}

export interface Spell {
  casting_time: string;
  classes: string[];
  components: SpellComponents;
  description: string;
  duration: string;
  level: string;
  name: string;
  range: string;
  ritual: boolean;
  school: string;
  tags: string[];
  type: string;
  higher_levels?: string;
  concentration?: boolean;
}

export interface Character {
  class: DndClass;
  subclass: string;
  level: number;
}

export interface ActionItem {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  damageType?: DamageType;
  school?: string;
  range?: string;
  duration?: string;
  level?: string;
  source: "standard" | "class" | "spell" | "custom";
  minLevel?: number;
}

export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  actionType: ActionType;
  damageType?: DamageType;
  school?: string;
  description?: string;
  spellLevel?: string;
  range?: string;
  duration?: string;
  notes?: string;
  source: "standard" | "class" | "spell" | "custom";
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  notes?: string;
}

export interface GroupVariant {
  id: string;
  label: string;
  actionType: ActionType;
  damageType?: DamageType;
  school?: string;
  spellLevel?: string;
  description?: string;
}

export interface GroupNodeData extends Record<string, unknown> {
  label: string;
  variants: GroupVariant[];
  collapsed: boolean;
}

export interface StartNodeData extends Record<string, unknown> {
  label: string;
}

export interface EndNodeData extends Record<string, unknown> {
  label: string;
}

export interface NoteNodeData extends Record<string, unknown> {
  content: string;
}

export interface SavedFlowchart {
  id: string;
  name: string;
  character: Character;
  nodes: unknown[];
  edges: unknown[];
  createdAt: number;
  updatedAt: number;
}
