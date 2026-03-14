import type { ActionItem } from "../types";

export const STANDARD_ACTIONS: ActionItem[] = [
  {
    id: "std-attack",
    name: "Attack",
    description:
      "Make one melee or ranged weapon attack. Features like Extra Attack grant additional attacks within the same action.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-cast-spell",
    name: "Cast a Spell",
    description:
      "Cast a prepared spell with a casting time of 1 action. Spell slots are expended unless the spell is a cantrip.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-dash",
    name: "Dash",
    description:
      "Gain extra movement equal to your speed for this turn. Difficult terrain costs extra movement as usual.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-disengage",
    name: "Disengage",
    description:
      "Your movement doesn't provoke opportunity attacks for the rest of the turn.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-dodge",
    name: "Dodge",
    description:
      "Until start of your next turn: attacks against you have disadvantage (if you can see the attacker), and you have advantage on Dexterity saving throws.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-help",
    name: "Help",
    description:
      "Give an ally advantage on their next ability check or attack roll against a target within 5ft of you.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-hide",
    name: "Hide",
    description:
      "Make a Dexterity (Stealth) check against the enemy's Passive Perception to become hidden.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-ready",
    name: "Ready",
    description:
      "Prepare a specific action for a trigger. When triggered before your next turn, use your reaction to execute it. Holding a spell requires concentration.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-search",
    name: "Search",
    description:
      "Devote your attention to finding something. Make a Wisdom (Perception) or Intelligence (Investigation) check.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-grapple",
    name: "Grapple",
    description:
      "Contest: your Strength (Athletics) vs target's Athletics or Acrobatics (their choice). On success, target is grappled (speed = 0). Only works on creatures ≤ one size larger.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-shove",
    name: "Shove",
    description:
      "Contest: your Strength (Athletics) vs target's Athletics or Acrobatics. On success, push the target 5ft away or knock it prone. Only works on creatures ≤ one size larger.",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-use-object",
    name: "Use an Object",
    description:
      "Use an object that normally requires an action (potions, use magic items that require an action, etc.).",
    actionType: "action",
    source: "standard",
  },
  {
    id: "std-offhand-attack",
    name: "Off-Hand Attack",
    description:
      "When you attack with a light melee weapon, make one additional attack with a different light melee weapon in your other hand as a bonus action. No ability modifier to damage.",
    actionType: "bonus",
    source: "standard",
  },
  {
    id: "std-opportunity-attack",
    name: "Opportunity Attack",
    description:
      "Reaction: when a hostile creature you can see moves out of your reach, make one melee attack against it.",
    actionType: "reaction",
    source: "standard",
  },
  {
    id: "std-interact-object",
    name: "Interact with Object",
    description:
      "Once per turn for free: interact with one object (draw/sheathe weapon, open door, pick up item). Extra interactions cost an action.",
    actionType: "free",
    source: "standard",
  },
  {
    id: "std-drink-potion",
    name: "Drink/Use Potion",
    description:
      "Use your action to drink a potion yourself, or your bonus action via the optional rule. Administering to another creature costs an action.",
    actionType: "action",
    source: "standard",
  },
];
