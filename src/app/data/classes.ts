import barbarianIcon from "../icons/class/barbarian.svg";
import bardIcon from "../icons/class/bard.svg";
import clericIcon from "../icons/class/cleric.svg";
import druidIcon from "../icons/class/druid.svg";
import fighterIcon from "../icons/class/fighter.svg";
import monkIcon from "../icons/class/monk.svg";
import paladinIcon from "../icons/class/paladin.svg";
import rangerIcon from "../icons/class/ranger.svg";
import rogueIcon from "../icons/class/rogue.svg";
import sorcererIcon from "../icons/class/sorcerer.svg";
import warlockIcon from "../icons/class/warlock.svg";
import wizardIcon from "../icons/class/wizard.svg";
import type { ActionType, DamageType, DndClass } from "../types";
import type { SpellcastingAbility } from "./stats";
import type { WeaponCategory } from "./weapons";

export type SpellcastingType = "full" | "half" | "third" | "warlock" | "none";

export interface ClassAction {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  damageType?: DamageType;
  minLevel: number;
}

export interface SubclassDefinition {
  id: string;
  name: string;
  spellcastingTypeOverride?: SpellcastingType;
}

export interface ClassDefinition {
  id: DndClass;
  name: string;
  color: string;
  icon: string;
  subclasses: SubclassDefinition[];
  spellcastingType: SpellcastingType;
  spellcastingAbility: SpellcastingAbility | null;
  classActions: ClassAction[];
  weaponProficiencies: WeaponCategory[];
}

export const CLASSES: ClassDefinition[] = [
  {
    id: "barbarian",
    name: "Barbarian",
    color: "#c62828",
    icon: barbarianIcon,
    spellcastingAbility: null,
    spellcastingType: "none",
    weaponProficiencies: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
    ],
    subclasses: [
      { id: "berserker", name: "Path of the Berserker" },
      { id: "totem-warrior", name: "Path of the Totem Warrior" },
      { id: "ancestral-guardian", name: "Path of the Ancestral Guardian" },
      { id: "storm-herald", name: "Path of the Storm Herald" },
      { id: "zealot", name: "Path of the Zealot" },
      { id: "beast", name: "Path of the Beast" },
      { id: "wild-magic", name: "Path of Wild Magic" },
      { id: "giant", name: "Path of the Giant" },
    ],
    classActions: [
      {
        id: "barbarian-rage",
        name: "Rage",
        description:
          "Enter a rage as a bonus action. While raging: advantage on Strength checks/saves, bonus melee damage (+2 to +4), resistance to bludgeoning, piercing, and slashing damage.",
        actionType: "bonus",
        minLevel: 1,
      },
      {
        id: "barbarian-reckless-attack",
        name: "Reckless Attack",
        description:
          "Gain advantage on your first Strength melee attack roll this turn – but attack rolls against you also have advantage until your next turn.",
        actionType: "special",
        minLevel: 2,
      },
      {
        id: "barbarian-extra-attack",
        name: "Extra Attack",
        description: "Attack twice when you take the Attack action.",
        actionType: "action",
        minLevel: 5,
      },
      {
        id: "barbarian-relentless-rage",
        name: "Relentless Rage",
        description:
          "When you drop to 0 HP while raging, make a DC 10 Con save (DC +5 each use). On success, drop to 1 HP instead.",
        actionType: "reaction",
        minLevel: 11,
      },
    ],
  },
  {
    id: "bard",
    name: "Bard",
    color: "#7b1fa2",
    icon: bardIcon,
    spellcastingAbility: "cha",
    spellcastingType: "full",
    weaponProficiencies: ["simple-melee", "simple-ranged", "martial-melee"],
    subclasses: [
      { id: "lore", name: "College of Lore" },
      { id: "valor", name: "College of Valor" },
      { id: "glamour", name: "College of Glamour" },
      { id: "swords", name: "College of Swords" },
      { id: "whispers", name: "College of Whispers" },
      { id: "creation", name: "College of Creation" },
      { id: "eloquence", name: "College of Eloquence" },
      { id: "spirits", name: "College of Spirits" },
    ],
    classActions: [
      {
        id: "bard-bardic-inspiration",
        name: "Bardic Inspiration",
        description:
          "Bonus action: give a creature within 60ft an Inspiration die (d6→d12). They can add the die to one attack roll, ability check, or saving throw within 10 minutes.",
        actionType: "bonus",
        minLevel: 1,
      },
      {
        id: "bard-cutting-words",
        name: "Cutting Words",
        description:
          "Reaction: use a Bardic Inspiration die to subtract its roll from a creature's attack roll, ability check, or damage roll (within 60ft).",
        actionType: "reaction",
        minLevel: 3,
      },
      {
        id: "bard-countercharm",
        name: "Countercharm",
        description:
          "Action: start a performance until the end of your next turn. Friendly creatures within 30ft have advantage on saves against being frightened or charmed.",
        actionType: "action",
        minLevel: 6,
      },
    ],
  },
  {
    id: "cleric",
    name: "Cleric",
    color: "#f57f17",
    icon: clericIcon,
    spellcastingAbility: "wis",
    spellcastingType: "full",
    weaponProficiencies: ["simple-melee", "simple-ranged"],
    subclasses: [
      { id: "life", name: "Life Domain" },
      { id: "light", name: "Light Domain" },
      { id: "trickery", name: "Trickery Domain" },
      { id: "knowledge", name: "Knowledge Domain" },
      { id: "nature", name: "Nature Domain" },
      { id: "tempest", name: "Tempest Domain" },
      { id: "war", name: "War Domain" },
      { id: "arcana", name: "Arcana Domain" },
      { id: "death", name: "Death Domain" },
      { id: "forge", name: "Forge Domain" },
      { id: "grave", name: "Grave Domain" },
      { id: "order", name: "Order Domain" },
      { id: "peace", name: "Peace Domain" },
      { id: "twilight", name: "Twilight Domain" },
    ],
    classActions: [
      {
        id: "cleric-turn-undead",
        name: "Turn Undead",
        description:
          "Channel Divinity: Each undead within 30ft must make a Wisdom save. On fail, the undead is turned for 1 minute (can't attack, must flee).",
        actionType: "action",
        minLevel: 2,
      },
      {
        id: "cleric-destroy-undead",
        name: "Destroy Undead",
        description:
          "When a turned undead fails its save, if its CR is low enough (scales with level), it is instantly destroyed.",
        actionType: "special",
        minLevel: 5,
      },
      {
        id: "cleric-divine-intervention",
        name: "Divine Intervention",
        description:
          "Implore your deity for aid. Roll d100; if ≤ cleric level, your deity intervenes. Useable once per 7 days (automatic success at level 20).",
        actionType: "action",
        minLevel: 10,
      },
    ],
  },
  {
    id: "druid",
    name: "Druid",
    color: "#2e7d32",
    icon: druidIcon,
    spellcastingAbility: "wis",
    spellcastingType: "full",
    weaponProficiencies: ["simple-melee", "simple-ranged"],
    subclasses: [
      { id: "land", name: "Circle of the Land" },
      { id: "moon", name: "Circle of the Moon" },
      { id: "dreams", name: "Circle of Dreams" },
      { id: "shepherd", name: "Circle of the Shepherd" },
      { id: "spores", name: "Circle of Spores" },
      { id: "stars", name: "Circle of Stars" },
      { id: "wildfire", name: "Circle of Wildfire" },
    ],
    classActions: [
      {
        id: "druid-wild-shape",
        name: "Wild Shape",
        description:
          "Transform into a beast you've seen. CR limit scales with level (1/4 at lv2, 1/2 at lv4, 1 at lv8). Lasts 2 × druid level hours. Moon druids get higher CR limits.",
        actionType: "action",
        minLevel: 2,
      },
      {
        id: "druid-wild-shape-bonus",
        name: "Wild Shape (Bonus Action)",
        description:
          "Moon Circle druids can use Wild Shape as a bonus action instead of an action.",
        actionType: "bonus",
        minLevel: 2,
      },
    ],
  },
  {
    id: "fighter",
    name: "Fighter",
    color: "#e64a19",
    icon: fighterIcon,
    spellcastingAbility: null,
    spellcastingType: "none",
    weaponProficiencies: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
    ],
    subclasses: [
      { id: "champion", name: "Champion" },
      { id: "battle-master", name: "Battle Master" },
      {
        id: "eldritch-knight",
        name: "Eldritch Knight",
        spellcastingTypeOverride: "third",
      },
      { id: "arcane-archer", name: "Arcane Archer" },
      { id: "cavalier", name: "Cavalier" },
      { id: "samurai", name: "Samurai" },
      { id: "echo-knight", name: "Echo Knight" },
      { id: "psi-warrior", name: "Psi Warrior" },
      { id: "rune-knight", name: "Rune Knight" },
    ],
    classActions: [
      {
        id: "fighter-second-wind",
        name: "Second Wind",
        description:
          "Bonus action: regain 1d10 + fighter level HP. Once per short/long rest.",
        actionType: "bonus",
        damageType: "healing",
        minLevel: 1,
      },
      {
        id: "fighter-action-surge",
        name: "Action Surge",
        description:
          "Take one additional action this turn (not a bonus action). Once per short rest (twice at level 17). Cannot be used on the same turn as the special bonus action from Quickened Spell.",
        actionType: "special",
        minLevel: 2,
      },
      {
        id: "fighter-extra-attack",
        name: "Extra Attack",
        description:
          "Attack twice (level 5), three times (level 11), or four times (level 20) when you take the Attack action.",
        actionType: "action",
        minLevel: 5,
      },
      {
        id: "fighter-indomitable",
        name: "Indomitable",
        description:
          "Reroll a failed saving throw (must use new roll). Once per long rest (twice at 13, three times at 17).",
        actionType: "special",
        minLevel: 9,
      },
    ],
  },
  {
    id: "monk",
    name: "Monk",
    color: "#00838f",
    icon: monkIcon,
    spellcastingAbility: "wis",
    spellcastingType: "none",
    weaponProficiencies: ["simple-melee", "simple-ranged"],
    subclasses: [
      { id: "open-hand", name: "Way of the Open Hand" },
      { id: "shadow", name: "Way of Shadow" },
      { id: "four-elements", name: "Way of the Four Elements" },
      { id: "drunken-master", name: "Way of the Drunken Master" },
      { id: "kensei", name: "Way of the Kensei" },
      { id: "long-death", name: "Way of the Long Death" },
      { id: "sun-soul", name: "Way of the Sun Soul" },
      { id: "mercy", name: "Way of Mercy" },
      { id: "astral-self", name: "Way of the Astral Self" },
      { id: "ascended-dragon", name: "Way of the Ascended Dragon" },
    ],
    classActions: [
      {
        id: "monk-unarmed-strike-d4",
        name: "Unarmed Strike",
        description:
          "Make a melee attack roll. On a hit, deal 1d4 + Strength or Dexterity modifier bludgeoning damage (Martial Arts die).",
        actionType: "action",
        damageType: "bludgeoning",
        minLevel: 1,
      },
      {
        id: "monk-unarmed-strike-d6",
        name: "Unarmed Strike",
        description:
          "Make a melee attack roll. On a hit, deal 1d6 + Strength or Dexterity modifier bludgeoning damage (Martial Arts die).",
        actionType: "action",
        damageType: "bludgeoning",
        minLevel: 5,
      },
      {
        id: "monk-unarmed-strike-d8",
        name: "Unarmed Strike",
        description:
          "Make a melee attack roll. On a hit, deal 1d8 + Strength or Dexterity modifier bludgeoning damage (Martial Arts die).",
        actionType: "action",
        damageType: "bludgeoning",
        minLevel: 11,
      },
      {
        id: "monk-unarmed-strike-d10",
        name: "Unarmed Strike",
        description:
          "Make a melee attack roll. On a hit, deal 1d10 + Strength or Dexterity modifier bludgeoning damage (Martial Arts die).",
        actionType: "action",
        damageType: "bludgeoning",
        minLevel: 17,
      },
      {
        id: "monk-martial-arts-bonus",
        name: "Martial Arts (Bonus Strike)",
        description:
          "After using the Attack action with an unarmed strike or monk weapon, make one additional melee attack roll as a bonus action (no ki required).",
        actionType: "bonus",
        damageType: "bludgeoning",
        minLevel: 1,
      },
      {
        id: "monk-flurry-of-blows",
        name: "Flurry of Blows",
        description:
          "Spend 1 ki: immediately after taking the Attack action, make 2 unarmed strikes as a bonus action.",
        actionType: "bonus",
        minLevel: 1,
      },
      {
        id: "monk-patient-defense",
        name: "Patient Defense",
        description: "Spend 1 ki: take the Dodge action as a bonus action.",
        actionType: "bonus",
        minLevel: 1,
      },
      {
        id: "monk-step-of-wind",
        name: "Step of the Wind",
        description:
          "Spend 1 ki: take Disengage or Dash as a bonus action. Jump distance is doubled.",
        actionType: "bonus",
        minLevel: 1,
      },
      {
        id: "monk-deflect-missiles",
        name: "Deflect Missiles",
        description:
          "Reaction: reduce damage from a ranged weapon attack by 1d10 + Dex mod + monk level. If reduced to 0, catch and throw it back (1d4+proficiency, 20/60ft range).",
        actionType: "reaction",
        minLevel: 3,
      },
      {
        id: "monk-stunning-strike",
        name: "Stunning Strike",
        description:
          "Spend 1 ki when you hit with a melee attack: target makes a Con save (DC = 8+prof+Wis). On fail, stunned until end of your next turn.",
        actionType: "special",
        minLevel: 5,
      },
    ],
  },
  {
    id: "paladin",
    name: "Paladin",
    color: "#f9a825",
    icon: paladinIcon,
    spellcastingAbility: "cha",
    spellcastingType: "half",
    weaponProficiencies: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
    ],
    subclasses: [
      { id: "devotion", name: "Oath of Devotion" },
      { id: "ancients", name: "Oath of the Ancients" },
      { id: "vengeance", name: "Oath of Vengeance" },
      { id: "conquest", name: "Oath of Conquest" },
      { id: "redemption", name: "Oath of Redemption" },
      { id: "glory", name: "Oath of Glory" },
      { id: "watchers", name: "Oath of the Watchers" },
      { id: "oathbreaker", name: "Oathbreaker" },
    ],
    classActions: [
      {
        id: "paladin-divine-smite",
        name: "Divine Smite",
        description:
          "On a melee hit, expend a spell slot to deal 2d8 + 1d8/slot level above 1st radiant damage (+1d8 vs undead/fiends). Max 5d8.",
        actionType: "special",
        damageType: "radiant",
        minLevel: 1,
      },
      {
        id: "paladin-lay-on-hands",
        name: "Lay on Hands",
        description:
          "Touch a creature: restore HP from a pool of 5 × paladin level. Spend 5 HP to cure a disease or poison instead.",
        actionType: "action",
        damageType: "healing",
        minLevel: 1,
      },
      {
        id: "paladin-divine-sense",
        name: "Divine Sense",
        description:
          "Until end of next turn, know location of celestials, fiends, undead within 60ft (not heavily obscured). Uses = 1 + Cha modifier per long rest.",
        actionType: "action",
        minLevel: 1,
      },
      {
        id: "paladin-channel-divinity",
        name: "Channel Divinity",
        description:
          "Use your oath's Channel Divinity options. Sacred Weapon (bonus action) or Turn the Unholy (action) are common default examples.",
        actionType: "action",
        minLevel: 3,
      },
      {
        id: "paladin-aura-of-protection",
        name: "Aura of Protection",
        description:
          "While conscious, you and friendly creatures within 10ft add your Charisma modifier (min +1) to all saving throws.",
        actionType: "special",
        minLevel: 6,
      },
    ],
  },
  {
    id: "ranger",
    name: "Ranger",
    color: "#388e3c",
    icon: rangerIcon,
    spellcastingAbility: "wis",
    spellcastingType: "half",
    weaponProficiencies: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
    ],
    subclasses: [
      { id: "hunter", name: "Hunter" },
      { id: "beast-master", name: "Beast Master" },
      { id: "gloom-stalker", name: "Gloom Stalker" },
      { id: "horizon-walker", name: "Horizon Walker" },
      { id: "monster-slayer", name: "Monster Slayer" },
      { id: "fey-wanderer", name: "Fey Wanderer" },
      { id: "swarmkeeper", name: "Swarmkeeper" },
      { id: "drakewarden", name: "Drakewarden" },
    ],
    classActions: [
      {
        id: "ranger-hunters-mark",
        name: "Hunter's Mark",
        description:
          "Bonus action: mark a target. Deal +1d6 damage to it on each hit. Advantage on Perception/Survival checks to find it. Lasts 1 hour (concentration). Move mark on new target as bonus action.",
        actionType: "bonus",
        minLevel: 1,
      },
      {
        id: "ranger-extra-attack",
        name: "Extra Attack",
        description: "Attack twice when you take the Attack action.",
        actionType: "action",
        minLevel: 5,
      },
      {
        id: "ranger-evasion",
        name: "Evasion",
        description:
          "Reaction (passive): on a failed Dex saving throw for half damage, take no damage instead.",
        actionType: "reaction",
        minLevel: 7,
      },
    ],
  },
  {
    id: "rogue",
    name: "Rogue",
    color: "#546e7a",
    icon: rogueIcon,
    spellcastingAbility: null,
    spellcastingType: "none",
    weaponProficiencies: ["simple-melee", "simple-ranged", "martial-melee"],
    subclasses: [
      { id: "thief", name: "Thief" },
      { id: "assassin", name: "Assassin" },
      {
        id: "arcane-trickster",
        name: "Arcane Trickster",
        spellcastingTypeOverride: "third",
      },
      { id: "inquisitive", name: "Inquisitive" },
      { id: "mastermind", name: "Mastermind" },
      { id: "scout", name: "Scout" },
      { id: "swashbuckler", name: "Swashbuckler" },
      { id: "phantom", name: "Phantom" },
      { id: "soulknife", name: "Soulknife" },
    ],
    classActions: [
      {
        id: "rogue-sneak-attack",
        name: "Sneak Attack",
        description:
          "Once per turn: deal +1d6 (scales to +10d6 at level 19) extra damage when you have advantage OR a non-incapacitated ally is adjacent to the target.",
        actionType: "special",
        damageType: "piercing",
        minLevel: 1,
      },
      {
        id: "rogue-cunning-action-dash",
        name: "Cunning Action: Dash",
        description: "Take the Dash action as a bonus action.",
        actionType: "bonus",
        minLevel: 2,
      },
      {
        id: "rogue-cunning-action-disengage",
        name: "Cunning Action: Disengage",
        description: "Take the Disengage action as a bonus action.",
        actionType: "bonus",
        minLevel: 2,
      },
      {
        id: "rogue-cunning-action-hide",
        name: "Cunning Action: Hide",
        description: "Take the Hide action as a bonus action.",
        actionType: "bonus",
        minLevel: 2,
      },
      {
        id: "rogue-uncanny-dodge",
        name: "Uncanny Dodge",
        description:
          "Reaction: when an attacker you can see hits you, halve that attack's damage.",
        actionType: "reaction",
        minLevel: 5,
      },
      {
        id: "rogue-evasion",
        name: "Evasion",
        description:
          "Reaction (passive): on a failed Dex saving throw for half damage, take no damage. Take half on success.",
        actionType: "reaction",
        minLevel: 7,
      },
    ],
  },
  {
    id: "sorcerer",
    name: "Sorcerer",
    color: "#b71c1c",
    icon: sorcererIcon,
    spellcastingAbility: "cha",
    spellcastingType: "full",
    weaponProficiencies: ["simple-melee", "simple-ranged"],
    subclasses: [
      { id: "draconic", name: "Draconic Bloodline" },
      { id: "wild-magic", name: "Wild Magic Surge" },
      { id: "divine-soul", name: "Divine Soul" },
      { id: "shadow", name: "Shadow Magic" },
      { id: "storm", name: "Storm Sorcery" },
      { id: "aberrant-mind", name: "Aberrant Mind" },
      { id: "clockwork-soul", name: "Clockwork Soul" },
      { id: "lunar", name: "Lunar Sorcery" },
    ],
    classActions: [
      {
        id: "sorcerer-flexible-casting",
        name: "Flexible Casting",
        description:
          "Convert spell slots to/from sorcery points. Cost: slot level in sorcery points. Gain: slot costs 2/3/5/6/7 points for levels 1/2/3/4/5.",
        actionType: "bonus",
        minLevel: 2,
      },
      {
        id: "sorcerer-quickened-spell",
        name: "Metamagic: Quickened Spell",
        description:
          "Spend 2 sorcery points: change a spell's casting time from 1 action to 1 bonus action.",
        actionType: "bonus",
        minLevel: 2,
      },
      {
        id: "sorcerer-twinned-spell",
        name: "Metamagic: Twinned Spell",
        description:
          "Spend sorcery points equal to spell level (1 for cantrips): target a second creature with a single-target spell.",
        actionType: "special",
        minLevel: 2,
      },
      {
        id: "sorcerer-subtle-spell",
        name: "Metamagic: Subtle Spell",
        description:
          "Spend 1 sorcery point: cast with no verbal/somatic components (cannot be counterspelled or blocked by silence).",
        actionType: "special",
        minLevel: 2,
      },
      {
        id: "sorcerer-empowered-spell",
        name: "Metamagic: Empowered Spell",
        description:
          "Spend 1 sorcery point: reroll a number of damage dice up to your Charisma modifier (must use new rolls).",
        actionType: "special",
        minLevel: 2,
      },
    ],
  },
  {
    id: "warlock",
    name: "Warlock",
    color: "#4a148c",
    icon: warlockIcon,
    spellcastingAbility: "cha",
    spellcastingType: "warlock",
    weaponProficiencies: ["simple-melee", "simple-ranged"],
    subclasses: [
      { id: "fiend", name: "The Fiend" },
      { id: "great-old-one", name: "The Great Old One" },
      { id: "archfey", name: "The Archfey" },
      { id: "hexblade", name: "The Hexblade" },
      { id: "undead", name: "The Undead" },
      { id: "undying", name: "The Undying" },
      { id: "celestial", name: "The Celestial" },
      { id: "fathomless", name: "The Fathomless" },
      { id: "genie", name: "The Genie" },
    ],
    classActions: [
      {
        id: "warlock-eldritch-blast",
        name: "Eldritch Blast",
        description:
          "Cantrip (Action): 1d10 force damage per beam. Gain a beam at levels 5/11/17 (up to 4 beams). Range 120ft. Invocations can add push, slow, pull, Cha damage, etc.",
        actionType: "action",
        damageType: "force",
        minLevel: 1,
      },
      {
        id: "warlock-hex",
        name: "Hex (Pact Feature)",
        description:
          "Bonus action: curse a creature. +1d6 necrotic per hit, disadvantage on one ability check. Move to new target with bonus action on kill. Concentration.",
        actionType: "bonus",
        damageType: "necrotic",
        minLevel: 1,
      },
      {
        id: "warlock-misty-step",
        name: "Misty Escape (Archfey)",
        description:
          "Reaction when you take damage: turn invisible and teleport up to 60ft. Invisibility lasts until start of next turn.",
        actionType: "reaction",
        minLevel: 6,
      },
    ],
  },
  {
    id: "wizard",
    name: "Wizard",
    color: "#1565c0",
    icon: wizardIcon,
    spellcastingAbility: "int",
    spellcastingType: "full",
    weaponProficiencies: ["simple-melee", "simple-ranged"],
    subclasses: [
      { id: "abjuration", name: "School of Abjuration" },
      { id: "conjuration", name: "School of Conjuration" },
      { id: "divination", name: "School of Divination" },
      { id: "enchantment", name: "School of Enchantment" },
      { id: "evocation", name: "School of Evocation" },
      { id: "illusion", name: "School of Illusion" },
      { id: "necromancy", name: "School of Necromancy" },
      { id: "transmutation", name: "School of Transmutation" },
      { id: "bladesinging", name: "Bladesinging" },
      { id: "chronurgy", name: "Chronurgy Magic" },
      { id: "graviturgy", name: "Graviturgy Magic" },
      { id: "order-of-scribes", name: "Order of Scribes" },
      { id: "war-magic", name: "War Magic" },
    ],
    classActions: [
      {
        id: "wizard-arcane-recovery",
        name: "Arcane Recovery",
        description:
          "Once per day during a short rest: recover spell slots totaling up to half wizard level (rounded up), no slot above 5th.",
        actionType: "special",
        minLevel: 1,
      },
      {
        id: "wizard-arcane-ward",
        name: "Arcane Ward (Abjuration)",
        description:
          "When you cast an abjuration spell of 1st level or higher, create a ward with HP equal to 2 × wizard level + Int modifier. The ward absorbs damage before you.",
        actionType: "special",
        minLevel: 2,
      },
      {
        id: "wizard-portent",
        name: "Portent (Divination)",
        description:
          "After a long rest, roll 2d20. Replace any creature's roll with a Portent roll (before or after). You can use each die once per long rest.",
        actionType: "special",
        minLevel: 2,
      },
    ],
  },
];

const FULL_CASTER_TABLE = [
  0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9,
];
const HALF_CASTER_TABLE = [
  0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5,
];
const THIRD_CASTER_TABLE = [
  0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
];
const WARLOCK_TABLE = [
  0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];

export function getMaxSpellLevel(
  classId: DndClass,
  subclassId: string,
  characterLevel: number
): number {
  const classDef = CLASSES.find((c) => c.id === classId);
  if (!classDef) return 0;

  let type = classDef.spellcastingType;

  // Check if subclass overrides the casting type
  const subclass = classDef.subclasses.find((s) => s.id === subclassId);
  if (subclass?.spellcastingTypeOverride) {
    type = subclass.spellcastingTypeOverride;
  }

  const level = Math.min(Math.max(characterLevel, 0), 20);

  switch (type) {
    case "full":
      return FULL_CASTER_TABLE[level] ?? 0;
    case "half":
      return HALF_CASTER_TABLE[level] ?? 0;
    case "third":
      return THIRD_CASTER_TABLE[level] ?? 0;
    case "warlock":
      return WARLOCK_TABLE[level] ?? 0;
    default:
      return 0;
  }
}

export function getClassDefinition(
  classId: DndClass
): ClassDefinition | undefined {
  return CLASSES.find((c) => c.id === classId);
}

// Full caster slot table indexed by character level (0–20)
const FULL_CASTER_SLOTS: Record<number, number>[] = [
  {},
  { 1: 2 },
  { 1: 3 },
  { 1: 4, 2: 2 },
  { 1: 4, 2: 3 },
  { 1: 4, 2: 3, 3: 2 },
  { 1: 4, 2: 3, 3: 3 },
  { 1: 4, 2: 3, 3: 3, 4: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 2 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
];

// Half caster slot table (paladin, ranger) indexed by character level (0–20)
const HALF_CASTER_SLOTS: Record<number, number>[] = [
  {},
  {},
  { 1: 2 },
  { 1: 3 },
  { 1: 3 },
  { 1: 4, 2: 2 },
  { 1: 4, 2: 2 },
  { 1: 4, 2: 3 },
  { 1: 4, 2: 3 },
  { 1: 4, 2: 3, 3: 2 },
  { 1: 4, 2: 3, 3: 2 },
  { 1: 4, 2: 3, 3: 3 },
  { 1: 4, 2: 3, 3: 3 },
  { 1: 4, 2: 3, 3: 3, 4: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 2 },
  { 1: 4, 2: 3, 3: 3, 4: 2 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
];

// Third caster slot table (EK fighter, AT rogue) indexed by character level (0–20)
const THIRD_CASTER_SLOTS: Record<number, number>[] = [
  {},
  {},
  {},
  { 1: 2 },
  { 1: 3 },
  { 1: 3 },
  { 1: 3 },
  { 1: 4, 2: 2 },
  { 1: 4, 2: 2 },
  { 1: 4, 2: 2 },
  { 1: 4, 2: 3 },
  { 1: 4, 2: 3 },
  { 1: 4, 2: 3 },
  { 1: 4, 2: 3, 3: 2 },
  { 1: 4, 2: 3, 3: 2 },
  { 1: 4, 2: 3, 3: 2 },
  { 1: 4, 2: 3, 3: 3 },
  { 1: 4, 2: 3, 3: 3 },
  { 1: 4, 2: 3, 3: 3 },
  { 1: 4, 2: 3, 3: 3, 4: 1 },
  { 1: 4, 2: 3, 3: 3, 4: 1 },
];

// Warlock Pact Magic indexed by character level (0–20): { pactSlotLevel: slotCount }
const WARLOCK_PACT_SLOTS: Record<number, number>[] = [
  {},
  { 1: 1 },
  { 1: 2 },
  { 2: 2 },
  { 2: 2 },
  { 3: 2 },
  { 3: 2 },
  { 4: 2 },
  { 4: 2 },
  { 5: 2 },
  { 5: 2 },
  { 5: 3 },
  { 5: 3 },
  { 5: 3 },
  { 5: 3 },
  { 5: 3 },
  { 5: 3 },
  { 5: 4 },
  { 5: 4 },
  { 5: 4 },
  { 5: 4 },
];

/**
 * Returns the maximum spell slot counts per level for a character.
 * For warlocks, returns `{ [pactSlotLevel]: pactSlotCount }` (single entry).
 * Returns an empty object for non-casters.
 */
export function getSpellSlots(
  classId: DndClass,
  subclassId: string,
  characterLevel: number
): Record<number, number> {
  const classDef = CLASSES.find((c) => c.id === classId);
  if (!classDef) return {};

  let type = classDef.spellcastingType;
  const subclass = classDef.subclasses.find((s) => s.id === subclassId);
  if (subclass?.spellcastingTypeOverride) {
    type = subclass.spellcastingTypeOverride;
  }

  const level = Math.min(Math.max(characterLevel, 0), 20);

  switch (type) {
    case "full":
      return FULL_CASTER_SLOTS[level] ?? {};
    case "half":
      return HALF_CASTER_SLOTS[level] ?? {};
    case "third":
      return THIRD_CASTER_SLOTS[level] ?? {};
    case "warlock":
      return WARLOCK_PACT_SLOTS[level] ?? {};
    default:
      return {};
  }
}
