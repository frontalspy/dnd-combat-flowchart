import type { Edge, Node } from "@xyflow/react";

export type DndClass =
  | "artificer"
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
  /** Explicit damage dice expression — takes precedence over description-parsed value. */
  damageDice?: string;
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
  /** Raw V/S/M component string from the spell (e.g. "V, S, M (a tiny bell)"). */
  spellComponents?: string;
  /** Whether this spell can be cast as a ritual. */
  ritual?: boolean;
  /** Advantage / disadvantage state for attack-roll nodes. */
  advantageState?: "advantage" | "disadvantage" | "none";
  /** Optional note explaining the source of advantage/disadvantage. */
  advantageNote?: string;
}

export type CompanionType =
  | "beast"
  | "construct"
  | "undead"
  | "elemental"
  | "fey"
  | "fiend"
  | "dragon"
  | "celestial"
  | "humanoid";

export interface CompanionAction {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  damageType?: DamageType;
  damageDice?: string;
}

export interface CompanionNodeData extends Record<string, unknown> {
  label: string;
  companionId: string;
  companionType: CompanionType;
  classId: DndClass;
  hp: string;
  ac: string;
  speed?: string;
  description?: string;
  actions: CompanionAction[];
  notes?: string;
}

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  notes?: string;
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

export interface SelectionGroup {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface SavedFlowchart {
  id: string;
  name: string;
  character: Character;
  nodes: unknown[];
  edges: unknown[];
  selectionGroups?: SelectionGroup[];
  createdAt: number;
  updatedAt: number;
}

/** A single end-to-end path through the flowchart with its action economy spend. */
export interface PathBudget {
  pathId: string;
  /** All node IDs on the path, in traversal order. */
  nodeIds: string[];
  /** Labels of ActionNodes that consume action/bonus/reaction on this path. */
  nodeLabels: string[];
  actions: number;
  bonusActions: number;
  reactions: number;
}

/** Functions exposed by FlowCanvas to its parent via onExportReady. */
export interface FlowCanvasExports {
  exportJpg: (name: string) => Promise<void>;
  exportPdf: (name: string) => Promise<void>;
  getFlowObject: () => { nodes: Node[]; edges: Edge[] };
  loadFlowObject: (nodes: Node[], edges: Edge[]) => void;
  copy: (nodes: Node[]) => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  /** Take an immediate snapshot of the current flow state (for undo of NodeEditor edits). */
  takeSnapshot: () => void;
  selectAll: () => void;
  selectNodes: (ids: string[]) => void;
  focusNodes: (ids: string[]) => void;
  /** Touch drag-to-canvas: add a node at the given screen coordinates. */
  dropAtPosition: (clientX: number, clientY: number, data: unknown) => void;
}

export type EdgeStyleType = "smoothstep" | "step" | "straight";
