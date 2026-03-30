import type { CompanionAction, CompanionType, DndClass } from "../types";

export interface CompanionDefinition {
  id: string;
  name: string;
  companionType: CompanionType;
  classId: DndClass;
  /** Restrict to a specific subclass ID (optional). */
  subclassId?: string;
  minLevel: number;
  hp: string;
  ac: string;
  speed?: string;
  description: string;
  actions: CompanionAction[];
}

export const COMPANIONS: CompanionDefinition[] = [
  // ─── Druid — Wild Shape beasts ───────────────────────────────────────────
  {
    id: "druid-wildshape-wolf",
    name: "Wolf (Wild Shape)",
    companionType: "beast",
    classId: "druid",
    minLevel: 2,
    hp: "11 (2d8+2)",
    ac: "13",
    speed: "40 ft.",
    description:
      "CR 1/4. Pack Tactics: advantage on attack rolls when an ally is adjacent to the target. Knocked-prone bite.",
    actions: [
      {
        id: "wolf-bite",
        name: "Bite",
        description:
          "Melee attack: +4 to hit, reach 5 ft. On hit: 2d6+2 piercing damage. The target must succeed on a DC 11 Strength saving throw or be knocked prone.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "2d6+2",
      },
    ],
  },
  {
    id: "druid-wildshape-black-bear",
    name: "Black Bear (Wild Shape)",
    companionType: "beast",
    classId: "druid",
    minLevel: 4,
    hp: "19 (3d8+6)",
    ac: "11",
    speed: "40 ft., climb 30 ft.",
    description:
      "CR 1/2. Keen Smell: advantage on Perception (smell). Multiattack (Bite + Claws).",
    actions: [
      {
        id: "black-bear-bite",
        name: "Bite",
        description: "Melee attack: +3 to hit, reach 5 ft. Hit: 1d6+3 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d6+3",
      },
      {
        id: "black-bear-claws",
        name: "Claws",
        description:
          "Melee attack: +3 to hit, reach 5 ft. Hit: 2×1d6+3 slashing (rolled separately).",
        actionType: "action",
        damageType: "slashing",
        damageDice: "2d6+3",
      },
    ],
  },
  {
    id: "druid-wildshape-brown-bear",
    name: "Brown Bear (Wild Shape)",
    companionType: "beast",
    classId: "druid",
    minLevel: 6,
    hp: "34 (4d10+12)",
    ac: "11",
    speed: "40 ft., climb 30 ft.",
    description:
      "CR 1. Keen Smell. Multiattack (Bite + Claws). Brutally powerful melee form.",
    actions: [
      {
        id: "brown-bear-bite",
        name: "Bite",
        description: "Melee attack: +5 to hit, reach 5 ft. Hit: 2d6+5 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "2d6+5",
      },
      {
        id: "brown-bear-claws",
        name: "Claws",
        description:
          "Melee attack: +5 to hit, reach 5 ft. Hit: 2×1d6+5 slashing.",
        actionType: "action",
        damageType: "slashing",
        damageDice: "2d6+5",
      },
    ],
  },
  {
    id: "druid-wildshape-dire-wolf",
    name: "Dire Wolf (Wild Shape)",
    companionType: "beast",
    classId: "druid",
    minLevel: 6,
    hp: "37 (5d10+10)",
    ac: "14",
    speed: "50 ft.",
    description:
      "CR 1. Pack Tactics. Knocked-prone bite. Fast, high-AC ground form.",
    actions: [
      {
        id: "dire-wolf-bite",
        name: "Bite",
        description:
          "Melee attack: +5 to hit, reach 5 ft. Hit: 2d6+3 piercing. DC 13 Strength save or knocked prone.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "2d6+3",
      },
    ],
  },
  {
    id: "druid-wildshape-giant-eagle",
    name: "Giant Eagle (Wild Shape)",
    companionType: "beast",
    classId: "druid",
    minLevel: 8,
    hp: "26 (4d10+4)",
    ac: "13",
    speed: "10 ft., fly 80 ft.",
    description:
      "CR 1. Keen Sight. Multiattack (Beak + Talons). Primary aerial combat form.",
    actions: [
      {
        id: "giant-eagle-beak",
        name: "Beak",
        description: "Melee attack: +5 to hit, reach 5 ft. Hit: 1d6+4 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d6+4",
      },
      {
        id: "giant-eagle-talons",
        name: "Talons",
        description:
          "Melee attack: +5 to hit, reach 5 ft. Hit: 2×1d6+4 slashing.",
        actionType: "action",
        damageType: "slashing",
        damageDice: "2d6+4",
      },
    ],
  },
  {
    id: "druid-wildshape-polar-bear",
    name: "Polar Bear (Wild Shape)",
    companionType: "beast",
    classId: "druid",
    minLevel: 9,
    hp: "42 (5d10+15)",
    ac: "12",
    speed: "40 ft., swim 30 ft.",
    description:
      "CR 2. Keen Smell. Multiattack (Bite + Claws). Top-tier beast form for mid-levels.",
    actions: [
      {
        id: "polar-bear-bite",
        name: "Bite",
        description: "Melee attack: +7 to hit, reach 5 ft. Hit: 2d6+5 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "2d6+5",
      },
      {
        id: "polar-bear-claws",
        name: "Claws",
        description:
          "Melee attack: +7 to hit, reach 5 ft. Hit: 2×1d6+5 slashing.",
        actionType: "action",
        damageType: "slashing",
        damageDice: "2d6+5",
      },
    ],
  },
  // ─── Druid (Moon) — Elemental forms ──────────────────────────────────────
  {
    id: "druid-wildshape-air-elemental",
    name: "Air Elemental (Wild Shape)",
    companionType: "elemental",
    classId: "druid",
    subclassId: "moon",
    minLevel: 10,
    hp: "90 (12d10+24)",
    ac: "15",
    speed: "0 ft., fly 90 ft. (hover)",
    description:
      "CR 5. Immune to lightning, thunder, poison; resistant to nonmagical B/P/S. Multiattack (2 Slams). Whirlwind (recharge 4–6).",
    actions: [
      {
        id: "air-elem-slam",
        name: "Slam",
        description:
          "Melee attack: +8 to hit, reach 5 ft. Hit: 2d8+6 bludgeoning.",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "2d8+6",
      },
      {
        id: "air-elem-whirlwind",
        name: "Whirlwind (Recharge 4–6)",
        description:
          "Each creature in a 5-ft.-radius, 30-ft.-tall cylinder must succeed on a DC 13 Strength save or take 3d8+6 bludgeoning and be flung up to 20 ft. (half damage & no fling on success).",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "3d8+6",
      },
    ],
  },
  {
    id: "druid-wildshape-earth-elemental",
    name: "Earth Elemental (Wild Shape)",
    companionType: "elemental",
    classId: "druid",
    subclassId: "moon",
    minLevel: 10,
    hp: "126 (12d10+60)",
    ac: "17",
    speed: "30 ft., burrow 30 ft.",
    description:
      "CR 5. Immune to poison; resistant to nonmagical B/P/S; Earth Glide. Multiattack (2 Slams).",
    actions: [
      {
        id: "earth-elem-slam",
        name: "Slam",
        description:
          "Melee attack: +8 to hit, reach 10 ft. Hit: 2d8+8 bludgeoning.",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "2d8+8",
      },
    ],
  },
  {
    id: "druid-wildshape-fire-elemental",
    name: "Fire Elemental (Wild Shape)",
    companionType: "elemental",
    classId: "druid",
    subclassId: "moon",
    minLevel: 10,
    hp: "102 (12d10+36)",
    ac: "13",
    speed: "50 ft.",
    description:
      "CR 5. Immune to fire and poison; resistant to nonmagical B/P/S. Fire Form (5 fire damage on contact). Multiattack (2 Touches with Illumination).",
    actions: [
      {
        id: "fire-elem-touch",
        name: "Touch",
        description:
          "Melee attack: +6 to hit, reach 5 ft. Hit: 2d6+4 fire damage. Flammable targets catch fire (1d10 fire at start of their turn until extinguished).",
        actionType: "action",
        damageType: "fire",
        damageDice: "2d6+4",
      },
    ],
  },
  {
    id: "druid-wildshape-water-elemental",
    name: "Water Elemental (Wild Shape)",
    companionType: "elemental",
    classId: "druid",
    subclassId: "moon",
    minLevel: 10,
    hp: "114 (12d10+36)",
    ac: "14",
    speed: "30 ft., swim 90 ft.",
    description:
      "CR 5. Resistant to acid, fire; immune to poison. Freeze (slows creatures). Whelm (recharge 2–3) can restrain/suffocate.",
    actions: [
      {
        id: "water-elem-slam",
        name: "Slam",
        description:
          "Melee attack: +7 to hit, reach 5 ft. Hit: 2d8+6 bludgeoning.",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "2d8+6",
      },
      {
        id: "water-elem-whelm",
        name: "Whelm (Recharge 2–3)",
        description:
          "Each creature in the elemental's space: DC 15 Strength save or 2d8+4 bludgeoning, restrained, and 0 ft. speed until escaped (DC 15 Athletics/Acrobatics). Restrained creatures begin suffocating.",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "2d8+4",
      },
    ],
  },
  // ─── Artificer (Battle Smith) — Steel Defender ───────────────────────────
  {
    id: "artificer-steel-defender",
    name: "Steel Defender",
    companionType: "construct",
    classId: "artificer",
    subclassId: "battle-smith",
    minLevel: 3,
    hp: "2 + Int mod + 5 × Artificer level",
    ac: "15",
    speed: "40 ft.",
    description:
      "Loyal iron construct. Acts on your initiative. Immune to poison and psychic damage; immune to many conditions. Can use Deflect Attack reaction.",
    actions: [
      {
        id: "steel-defender-rend",
        name: "Force-Empowered Rend",
        description:
          "Melee attack: +your spell attack bonus to hit, reach 5 ft. Hit: 1d8 + PB force damage.",
        actionType: "action",
        damageType: "force",
        damageDice: "1d8",
      },
      {
        id: "steel-defender-repair",
        name: "Repair (3/Day)",
        description:
          "The magical mechanisms inside the defender restore 2d8 + PB hit points to itself or to one construct or object within 5 feet of it.",
        actionType: "action",
        damageDice: "2d8",
        damageType: "healing",
      },
      {
        id: "steel-defender-deflect",
        name: "Deflect Attack",
        description:
          "Reaction: impose disadvantage on one attack roll targeting a creature other than the defender within 5 feet of it.",
        actionType: "reaction",
      },
    ],
  },
  // ─── Artificer (Artillerist) — Homunculus Servant ────────────────────────
  {
    id: "artificer-homunculus",
    name: "Homunculus Servant",
    companionType: "construct",
    classId: "artificer",
    subclassId: "alchemist",
    minLevel: 2,
    hp: "1 + Int mod + Artificer level",
    ac: "13",
    speed: "20 ft., fly 30 ft.",
    description:
      "Infusion-created tiny construct. Delivers touch spells for you. Immune to poison and psychic; immune to many conditions.",
    actions: [
      {
        id: "homunculus-force-strike",
        name: "Force Strike",
        description:
          "Ranged attack (bonus action you expend): +your spell attack bonus, range 30 ft. Hit: 1d4 + PB force damage.",
        actionType: "bonus",
        damageType: "force",
        damageDice: "1d4",
      },
    ],
  },
  // ─── Ranger (Beastmaster) — Primal Companion ─────────────────────────────
  {
    id: "ranger-beast-of-the-land",
    name: "Beast of the Land",
    companionType: "beast",
    classId: "ranger",
    subclassId: "beast-master",
    minLevel: 3,
    hp: "5 × Ranger level + Wis mod",
    ac: "13 + PB",
    speed: "40 ft., climb 40 ft.",
    description:
      "Primal Companion (TCoE). Acts on your initiative. Charge: if it moves 20+ ft. in a line, the target makes DC 13 Str save or is knocked prone. Primal Bond: immune to frightened and charmed.",
    actions: [
      {
        id: "beast-land-maul",
        name: "Maul",
        description:
          "Melee attack: +your spell attack bonus to hit, reach 5 ft. Hit: 1d8+3+PB of your chosen damage type. Two additional attacks when you take the Attack action (uses your bonus action command).",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d8",
      },
    ],
  },
  {
    id: "ranger-beast-of-the-sky",
    name: "Beast of the Sky",
    companionType: "beast",
    classId: "ranger",
    subclassId: "beast-master",
    minLevel: 3,
    hp: "4 × Ranger level + Wis mod",
    ac: "13 + PB",
    speed: "10 ft., fly 60 ft.",
    description:
      "Primal Companion (TCoE). Flyby: no opportunity attacks on withdrawal. Acts on your initiative.",
    actions: [
      {
        id: "beast-sky-shred",
        name: "Shred",
        description:
          "Melee attack: +your spell attack bonus to hit, reach 5 ft. Hit: 1d4+3+PB slashing damage.",
        actionType: "action",
        damageType: "slashing",
        damageDice: "1d4",
      },
    ],
  },
  {
    id: "ranger-beast-of-the-sea",
    name: "Beast of the Sea",
    companionType: "beast",
    classId: "ranger",
    subclassId: "beast-master",
    minLevel: 3,
    hp: "5 × Ranger level + Wis mod",
    ac: "13 + PB",
    speed: "5 ft., swim 60 ft.",
    description:
      "Primal Companion (TCoE). Amphibious. Binding Strike: grapples the target on a hit (DC 8+PB+Str/Dex).",
    actions: [
      {
        id: "beast-sea-strike",
        name: "Binding Strike",
        description:
          "Melee attack: +your spell attack bonus to hit, reach 5 ft. Hit: 1d6+3+PB bludgeoning or piercing (your choice). On hit the target is grappled (DC 8+PB+Str/Dex to escape).",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "1d6",
      },
    ],
  },
  // ─── Warlock (Pact of the Chain) — Familiars ─────────────────────────────
  {
    id: "warlock-familiar-imp",
    name: "Imp (Familiar)",
    companionType: "fiend",
    classId: "warlock",
    subclassId: "fiend",
    minLevel: 3,
    hp: "10 (4d4)",
    ac: "13",
    speed: "20 ft., fly 40 ft.",
    description:
      "Pact of the Chain familiar. Devil's Sight: see 120 ft. in magical darkness. Magic Resistance. Shapechanger. Can attack unlike a normal familiar.",
    actions: [
      {
        id: "imp-sting",
        name: "Sting (Wasp Form)",
        description:
          "Melee attack: +5 to hit, reach 5 ft. Hit: 1d4+3 piercing + 3d6 poison. DC 11 Con save or poisoned for 1 minute.",
        actionType: "action",
        damageType: "poison",
        damageDice: "1d4+3",
      },
      {
        id: "imp-invisibility",
        name: "Invisibility",
        description:
          "The imp magically turns invisible until it attacks or until its concentration ends. Equipment worn/carried is also invisible.",
        actionType: "action",
      },
    ],
  },
  {
    id: "warlock-familiar-quasit",
    name: "Quasit (Familiar)",
    companionType: "fiend",
    classId: "warlock",
    subclassId: "fiend",
    minLevel: 3,
    hp: "7 (3d4)",
    ac: "13",
    speed: "40 ft.",
    description:
      "Pact of the Chain familiar. Magic Resistance. Shapechanger. Can frighten enemies. Can attack unlike a normal familiar.",
    actions: [
      {
        id: "quasit-claws",
        name: "Claws (Quasit Form)",
        description:
          "Melee attack: +4 to hit, reach 5 ft. Hit: 1d4+3 piercing. DC 10 Con save or 2d4 poison damage and poisoned for 1 minute.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d4+3",
      },
      {
        id: "quasit-scare",
        name: "Scare (1/Day)",
        description:
          "One creature within 20 ft. must succeed on a DC 10 Wisdom save or be frightened for 1 minute. Repeats save at end of each turn.",
        actionType: "action",
      },
    ],
  },
  {
    id: "warlock-familiar-pseudodragon",
    name: "Pseudodragon (Familiar)",
    companionType: "dragon",
    classId: "warlock",
    minLevel: 3,
    hp: "7 (2d4+2)",
    ac: "13",
    speed: "15 ft., fly 60 ft.",
    description:
      "Pact of the Chain familiar. Magic Resistance. Shares senses with master. Sting may impose unconsciousness.",
    actions: [
      {
        id: "pseudodragon-bite",
        name: "Bite",
        description: "Melee attack: +4 to hit, reach 5 ft. Hit: 1d4+2 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d4+2",
      },
      {
        id: "pseudodragon-sting",
        name: "Sting",
        description:
          "Melee attack: +4 to hit, reach 5 ft. Hit: 1d4+2 piercing. DC 11 Con save or poisoned for 1 hour; on a fail of 5+ the target falls unconscious for the same duration.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d4+2",
      },
    ],
  },
  {
    id: "warlock-familiar-sprite",
    name: "Sprite (Familiar)",
    companionType: "fey",
    classId: "warlock",
    minLevel: 3,
    hp: "2 (1d4)",
    ac: "15",
    speed: "10 ft., fly 40 ft.",
    description:
      "Pact of the Chain familiar. Heart Sight: learn creature's current emotional state and alignment. Invisibility. Shortbow may inflict sleep.",
    actions: [
      {
        id: "sprite-shortbow",
        name: "Shortbow",
        description:
          "Ranged attack: +6 to hit, range 40/160 ft. Hit: 1 piercing + DC 10 Con save or poisoned for 1 minute; on fail of 5+ the creature falls unconscious until damage or shaken awake.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1",
      },
      {
        id: "sprite-invisibility",
        name: "Invisibility",
        description:
          "The sprite magically turns invisible until it attacks or until its concentration ends.",
        actionType: "action",
      },
    ],
  },
  // ─── Wizard — Find Familiar ───────────────────────────────────────────────
  {
    id: "wizard-familiar-owl",
    name: "Owl (Familiar)",
    companionType: "beast",
    classId: "wizard",
    minLevel: 1,
    hp: "1",
    ac: "11",
    speed: "5 ft., fly 60 ft.",
    description:
      "Flyby: no opportunity attacks. Deliver touch spells through the familiar. Keen Hearing and Sight.",
    actions: [
      {
        id: "owl-talons",
        name: "Talons",
        description: "Melee attack: +3 to hit, reach 5 ft. Hit: 1 slashing.",
        actionType: "action",
        damageType: "slashing",
        damageDice: "1",
      },
    ],
  },
  {
    id: "wizard-familiar-cat",
    name: "Cat (Familiar)",
    companionType: "beast",
    classId: "wizard",
    minLevel: 1,
    hp: "2 (1d4)",
    ac: "12",
    speed: "40 ft., climb 30 ft.",
    description:
      "Keen Smell and Hearing. Share senses to scout. Delivers touch spells.",
    actions: [
      {
        id: "cat-claws",
        name: "Claws",
        description: "Melee attack: +0 to hit, reach 5 ft. Hit: 1 slashing.",
        actionType: "action",
        damageType: "slashing",
        damageDice: "1",
      },
    ],
  },
  {
    id: "wizard-familiar-raven",
    name: "Raven (Familiar)",
    companionType: "beast",
    classId: "wizard",
    minLevel: 1,
    hp: "1",
    ac: "12",
    speed: "10 ft., fly 50 ft.",
    description:
      "Mimicry: can mimic simple sounds and voices. Scout and messenger role. Delivers touch spells.",
    actions: [
      {
        id: "raven-beak",
        name: "Beak",
        description: "Melee attack: +4 to hit, reach 5 ft. Hit: 1 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1",
      },
    ],
  },
  // ─── Paladin — Find Steed ─────────────────────────────────────────────────
  {
    id: "paladin-steed",
    name: "Steed (Find Steed)",
    companionType: "celestial",
    classId: "paladin",
    minLevel: 5,
    hp: "Based on form chosen (typically 32)",
    ac: "Based on form (typically 10–11)",
    speed: "Based on form (typically 60 ft.)",
    description:
      "Celestial spirit in animal form (Warhorse, Pony, Mastiff, etc.). Gains Intelligence 6. Shares your spell save DC. You can cast paladin spells through the steed. Dismissed to pocket plane.",
    actions: [
      {
        id: "steed-hooves",
        name: "Hooves (Warhorse form)",
        description: "Melee attack: +6 to hit, reach 5 ft. Hit: 2d4+4 bludgeoning.",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "2d4+4",
      },
    ],
  },
  {
    id: "paladin-greater-steed",
    name: "Greater Steed (Find Greater Steed)",
    companionType: "celestial",
    classId: "paladin",
    minLevel: 13,
    hp: "Based on form (typically 60–80)",
    ac: "Based on form (typically 12–15)",
    speed: "Based on form (typically 50–60 ft., fly for pegasus/griffon)",
    description:
      "Griffon, Pegasus, Peryton, Dire Wolf, Rhinoceros, or Saber-Toothed Tiger. Retains original stats + Intelligence 6 minimum, shares your spell save DC, and you can cast through it.",
    actions: [
      {
        id: "greater-steed-attack",
        name: "Attack (form-dependent)",
        description:
          "Melee attack using the steed's natural attacks (e.g. Griffon: Beak 2d6+4 piercing + Talons 2d6+4 slashing; Pegasus: Hooves 2d6+5 bludgeoning).",
        actionType: "action",
        damageType: "piercing",
        damageDice: "2d6+4",
      },
    ],
  },
  // ─── Cleric — Animate Dead ────────────────────────────────────────────────
  {
    id: "cleric-skeleton",
    name: "Skeleton (Animate Dead)",
    companionType: "undead",
    classId: "cleric",
    minLevel: 5,
    hp: "13 (2d8+4)",
    ac: "13 (armor scraps)",
    speed: "30 ft.",
    description:
      "Obeys simple commands. Vulnerable to bludgeoning; immune to poison and exhaustion. Maintains control for 24 hours (re-cast to extend).",
    actions: [
      {
        id: "skeleton-shortsword",
        name: "Shortsword",
        description: "Melee attack: +4 to hit, reach 5 ft. Hit: 1d6+2 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d6+2",
      },
      {
        id: "skeleton-shortbow",
        name: "Shortbow",
        description:
          "Ranged attack: +4 to hit, range 80/320 ft. Hit: 1d6+2 piercing.",
        actionType: "action",
        damageType: "piercing",
        damageDice: "1d6+2",
      },
    ],
  },
  {
    id: "cleric-zombie",
    name: "Zombie (Animate Dead)",
    companionType: "undead",
    classId: "cleric",
    minLevel: 5,
    hp: "22 (3d8+9)",
    ac: "8",
    speed: "20 ft.",
    description:
      "Obeys commands. Undead Fortitude: on HP drop to 0, DC 5+damage Con save to drop to 1 HP instead (doesn't apply to radiant or critical hits).",
    actions: [
      {
        id: "zombie-slam",
        name: "Slam",
        description: "Melee attack: +3 to hit, reach 5 ft. Hit: 1d6+1 bludgeoning.",
        actionType: "action",
        damageType: "bludgeoning",
        damageDice: "1d6+1",
      },
      {
        id: "zombie-fortitude",
        name: "Undead Fortitude",
        description:
          "Reaction: when reduced to 0 HP (not by radiant damage or a critical hit), make a DC 5+damage Con save. On success, drop to 1 HP instead.",
        actionType: "reaction",
      },
    ],
  },
];

/** Look up companions available to a class (and optionally a subclass) at a given level. */
export function getCompanionsForClass(
  classId: DndClass,
  subclassId: string,
  level: number
): CompanionDefinition[] {
  return COMPANIONS.filter(
    (c) =>
      c.classId === classId &&
      c.minLevel <= level &&
      (!c.subclassId || c.subclassId === subclassId)
  );
}
