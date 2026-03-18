import type { AbilityScores } from "../types";

export type SpellcastingAbility = keyof AbilityScores;

export const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export const ABILITY_FULL_NAMES: Record<keyof AbilityScores, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export const DEFAULT_SCORES: AbilityScores = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function spellSaveDC(level: number, spellcastingScore: number): number {
  return 8 + proficiencyBonus(level) + abilityModifier(spellcastingScore);
}

export function spellAttackBonus(
  level: number,
  spellcastingScore: number
): number {
  return proficiencyBonus(level) + abilityModifier(spellcastingScore);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
