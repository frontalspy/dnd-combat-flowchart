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
  source?: "SRD" | "XGtE" | "TCoE" | "PHB";
}

export interface WeaponLoadout {
  mainHand: string | null;
  offHand: "weapon" | "shield" | null;
  offHandWeaponId: string | null;
  twoHanded: boolean;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CharacterClass {
  class: DndClass;
  subclass: string;
  level: number;
}

export interface Character {
  class: DndClass;
  subclass: string;
  level: number;
  secondaryClasses?: CharacterClass[];
  loadout?: WeaponLoadout;
  abilityScores?: AbilityScores;
}

/** Returns the primary class entry as a CharacterClass object. */
export function primaryClass(c: Character): CharacterClass {
  return { class: c.class, subclass: c.subclass, level: c.level };
}

/** Returns all classes (primary + secondary) as CharacterClass array. */
export function allCharacterClasses(c: Character): CharacterClass[] {
  return [primaryClass(c), ...(c.secondaryClasses ?? [])];
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

export type ResourceType =
  | "spell-slot"
  | "ki"
  | "rage"
  | "superiority-die"
  | "channel-divinity"
  | "bardic-inspiration"
  | "lay-on-hands"
  | "wild-shape"
  | "sorcery-point"
  | "warlock-invocation"
  | "custom";

export interface ResourceCost {
  type: ResourceType;
  amount?: number;
  label?: string;
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
  source: "standard" | "class" | "spell" | "custom" | "weapon";
  damageDice?: string;
  saveDC?: string;
  saveAbility?: string;
  rollType?: "attack" | "save" | "auto";
  higherLevels?: string;
  hand?: "main" | "off";
  concentration?: boolean;
  resourceCost?: ResourceCost;
  castAtLevel?: number;
  baseDamageDice?: string;
  baseDuration?: string;
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
  damageDice?: string;
  saveAbility?: string;
  rollType?: "attack" | "save" | "auto";
  range?: string;
  duration?: string;
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

export type DndCondition =
  | "blinded"
  | "charmed"
  | "deafened"
  | "exhaustion"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious";

export interface ConditionStatusNodeData extends Record<string, unknown> {
  condition: DndCondition;
  label?: string;
  notes?: string;
  affects: "self" | "target" | "area";
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
