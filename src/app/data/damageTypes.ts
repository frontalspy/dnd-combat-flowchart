import acidIcon from "../icons/damage/acid.svg";
import bludgeoningIcon from "../icons/damage/bludgeoning.svg";
import coldIcon from "../icons/damage/cold.svg";
import fireIcon from "../icons/damage/fire.svg";
import forceIcon from "../icons/damage/force.svg";
import lightningIcon from "../icons/damage/lightning.svg";
import necroticIcon from "../icons/damage/necrotic.svg";
import piercingIcon from "../icons/damage/piercing.svg";
import poisonIcon from "../icons/damage/poison.svg";
import psychicIcon from "../icons/damage/psychic.svg";
import radiantIcon from "../icons/damage/radiant.svg";
import slashingIcon from "../icons/damage/slashing.svg";
import thunderIcon from "../icons/damage/thunder.svg";
import healingIcon from "../icons/hp/full.svg";
import type { DamageType } from "../types";

export interface DamageTypeMeta {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  keywords: string[];
}

export const DAMAGE_TYPES: Record<DamageType, DamageTypeMeta> = {
  acid: {
    label: "Acid",
    color: "#a8e063",
    bgColor: "rgba(168,224,99,0.15)",
    icon: acidIcon,
    keywords: ["acid"],
  },
  bludgeoning: {
    label: "Bludgeoning",
    color: "#c8a87a",
    bgColor: "rgba(200,168,122,0.15)",
    icon: bludgeoningIcon,
    keywords: ["bludgeoning"],
  },
  cold: {
    label: "Cold",
    color: "#67d5f5",
    bgColor: "rgba(103,213,245,0.15)",
    icon: coldIcon,
    keywords: ["cold", "ice", "frost", "freezing"],
  },
  fire: {
    label: "Fire",
    color: "#ff7043",
    bgColor: "rgba(255,112,67,0.15)",
    icon: fireIcon,
    keywords: ["fire", "flame", "burning", "burn"],
  },
  force: {
    label: "Force",
    color: "#9fa8da",
    bgColor: "rgba(159,168,218,0.15)",
    icon: forceIcon,
    keywords: ["force damage", "magical force"],
  },
  lightning: {
    label: "Lightning",
    color: "#c8b400",
    bgColor: "rgba(200,180,0,0.18)",
    icon: lightningIcon,
    keywords: ["lightning"],
  },
  necrotic: {
    label: "Necrotic",
    color: "#ba68c8",
    bgColor: "rgba(186,104,200,0.15)",
    icon: necroticIcon,
    keywords: ["necrotic"],
  },
  piercing: {
    label: "Piercing",
    color: "#90a4ae",
    bgColor: "rgba(144,164,174,0.15)",
    icon: piercingIcon,
    keywords: ["piercing"],
  },
  poison: {
    label: "Poison",
    color: "#aed581",
    bgColor: "rgba(174,213,129,0.15)",
    icon: poisonIcon,
    keywords: ["poison", "poisoned", "venomous"],
  },
  psychic: {
    label: "Psychic",
    color: "#f48fb1",
    bgColor: "rgba(244,143,177,0.15)",
    icon: psychicIcon,
    keywords: ["psychic"],
  },
  radiant: {
    label: "Radiant",
    color: "#c49a0a",
    bgColor: "rgba(196,154,10,0.18)",
    icon: radiantIcon,
    keywords: ["radiant"],
  },
  slashing: {
    label: "Slashing",
    color: "#ef9a9a",
    bgColor: "rgba(239,154,154,0.15)",
    icon: slashingIcon,
    keywords: ["slashing"],
  },
  thunder: {
    label: "Thunder",
    color: "#80cbc4",
    bgColor: "rgba(128,203,196,0.15)",
    icon: thunderIcon,
    keywords: ["thunder", "thunderous", "sonic"],
  },
  healing: {
    label: "Healing",
    color: "#66bb6a",
    bgColor: "rgba(102,187,106,0.15)",
    icon: healingIcon,
    keywords: ["heal", "healing", "restore hit", "regain hit"],
  },
};

export interface SchoolMeta {
  label: string;
  color: string;
  abbreviation: string;
}

export const SPELL_SCHOOLS: Record<string, SchoolMeta> = {
  abjuration: { label: "Abjuration", color: "#42a5f5", abbreviation: "ABJ" },
  conjuration: { label: "Conjuration", color: "#ab47bc", abbreviation: "CON" },
  divination: { label: "Divination", color: "#ffa726", abbreviation: "DIV" },
  enchantment: { label: "Enchantment", color: "#ec407a", abbreviation: "ENC" },
  evocation: { label: "Evocation", color: "#ef5350", abbreviation: "EVO" },
  illusion: { label: "Illusion", color: "#26c6da", abbreviation: "ILL" },
  necromancy: { label: "Necromancy", color: "#7986cb", abbreviation: "NEC" },
  transmutation: {
    label: "Transmutation",
    color: "#ff8a65",
    abbreviation: "TRN",
  },
  universal: { label: "Universal", color: "#78909c", abbreviation: "UNI" },
};

export const ACTION_TYPE_LABELS: Record<
  string,
  { label: string; short: string; color: string }
> = {
  action: { label: "Action", short: "A", color: "#42a5f5" },
  bonus: { label: "Bonus Action", short: "B", color: "#ffa726" },
  reaction: { label: "Reaction", short: "R", color: "#ef5350" },
  free: { label: "Free", short: "F", color: "#66bb6a" },
  special: { label: "Special", short: "S", color: "#ab47bc" },
  movement: { label: "Movement", short: "M", color: "#78909c" },
};

export function detectDamageType(
  description: string,
  name = ""
): DamageType | undefined {
  const text = `${description} ${name}`.toLowerCase();

  if (
    (text.includes("regain") && text.includes("hit point")) ||
    (text.includes("restore") && text.includes("hit point")) ||
    text.includes("hit points equal to") ||
    text.includes("regain hit")
  ) {
    return "healing";
  }

  const checks: [DamageType, string[]][] = [
    ["acid", ["acid damage", "acid splash"]],
    ["cold", ["cold damage", "cold", "ice damage"]],
    ["fire", ["fire damage", "fire", "flame strike"]],
    ["force", ["force damage"]],
    ["lightning", ["lightning damage", "lightning"]],
    ["necrotic", ["necrotic damage", "necrotic"]],
    ["poison", ["poison damage", "poisoned", "poison"]],
    ["psychic", ["psychic damage", "psychic"]],
    ["radiant", ["radiant damage", "radiant"]],
    ["thunder", ["thunder damage", "thunder"]],
    ["bludgeoning", ["bludgeoning damage", "bludgeoning"]],
    ["piercing", ["piercing damage", "piercing"]],
    ["slashing", ["slashing damage", "slashing"]],
  ];

  for (const [type, keywords] of checks) {
    if (keywords.some((k) => text.includes(k))) return type;
  }
  return undefined;
}

export function getActionTypeFromCastingTime(
  castingTime: string
): "action" | "bonus" | "reaction" | "special" {
  const lower = castingTime.toLowerCase();
  if (lower.includes("bonus action")) return "bonus";
  if (lower.includes("reaction")) return "reaction";
  if (lower === "1 action") return "action";
  return "special";
}

export function extractDamageDice(description: string): string | null {
  const match = description.match(/\b(\d+d\d+(?:\s*[+\-]\s*\d+)?)\b/i);
  return match ? match[1].trim() : null;
}

export function extractSaveDC(description: string): string | null {
  const match = description.match(
    /DC\s*(\d+)\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)/i
  );
  if (match) return `DC ${match[1]} ${match[2].substring(0, 3)}`;
  return null;
}

export function extractRollType(
  description: string
): "attack" | "save" | "auto" {
  const lower = description.toLowerCase();
  if (/saving throw|must succeed/.test(lower)) return "save";
  if (/make a.*attack|attack roll|ranged.*attack/.test(lower)) return "attack";
  return "auto";
}

const ABILITY_ABBR: Record<string, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export function extractSaveAbility(description: string): string | null {
  const match = description.match(
    /\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+saving throw/i
  );
  if (match) return ABILITY_ABBR[match[1].toLowerCase()] ?? null;
  const dcMatch = description.match(
    /DC\s*\d+\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)/i
  );
  if (dcMatch) return ABILITY_ABBR[dcMatch[1].toLowerCase()] ?? null;
  return null;
}
