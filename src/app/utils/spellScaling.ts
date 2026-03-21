/**
 * Utility functions for computing upcast damage dice scaling.
 */

/**
 * Converts an integer to its English ordinal string.
 * e.g. 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", 11 → "11th"
 */
export function toOrdinal(n: number): string {
  const mod100 = Math.abs(n) % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = Math.abs(n) % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

const ORDINAL_MAP: Record<string, number> = {
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  "4th": 4,
  "5th": 5,
  "6th": 6,
  "7th": 7,
  "8th": 8,
  "9th": 9,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
};

function ordinalToNumber(word: string): number | null {
  const n = ORDINAL_MAP[word.toLowerCase()] ?? parseInt(word, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Extracts per-level dice scaling from a `higherLevels` text.
 *
 * Handles the following patterns (all case-insensitive):
 *   - "increases [optional qualifier words] by Xd Y for each (slot) level above Nth"
 *     e.g. "increases by 1d6 for each slot level above 1st"
 *          "increases for each of its effects by 1d6 for each slot level above 4th"
 *   - "roll an additional Xd Y for each (slot) level above Nth"
 *     e.g. "roll an additional 2d10 for each slot level above 1st"
 *   - "increases by Xd Y for every two (slot) levels above Nth"  → stepSize: 2
 *     e.g. "increases by 1d6 for every two slot levels above 2nd"
 *
 * Returns null when no recognized pattern is found.
 */
export function parseHigherLevelDiceBonus(
  text: string
): { scalingDice: string; aboveLevel: number; stepSize: number } | null {
  // "every two slot levels above" variant (must be checked before the standard
  // pattern because both start with "increases by")
  const everyTwoMatch =
    /increases?(?:\s+\w+)*?\s+by\s+(\d+d\d+).*?for every two (?:slot )?levels? above (\w+)/i.exec(
      text
    );
  if (everyTwoMatch) {
    const aboveLevel = ordinalToNumber(everyTwoMatch[2]);
    if (aboveLevel !== null) {
      return { scalingDice: everyTwoMatch[1], aboveLevel, stepSize: 2 };
    }
  }

  // Standard "increases [...] by Xd Y for each (slot) level above Nth"
  // The non-greedy `(?:\s+\w+)*?` allows qualifying words between "increases" and "by"
  // e.g. "increases for each of its effects by 1d6 for each slot level above 4th"
  const increasesMatch =
    /increases?(?:\s+\w+)*?\s+by\s+(\d+d\d+).*?for each (?:slot )?level above (\w+)/i.exec(
      text
    );
  if (increasesMatch) {
    const aboveLevel = ordinalToNumber(increasesMatch[2]);
    if (aboveLevel !== null) {
      return { scalingDice: increasesMatch[1], aboveLevel, stepSize: 1 };
    }
  }

  // "roll an additional Xd Y for each (slot) level above Nth"
  const rollMatch =
    /roll\s+an?\s+additional\s+(\d+d\d+).*?for each (?:slot )?level above (\w+)/i.exec(
      text
    );
  if (rollMatch) {
    const aboveLevel = ordinalToNumber(rollMatch[2]);
    if (aboveLevel !== null) {
      return { scalingDice: rollMatch[1], aboveLevel, stepSize: 1 };
    }
  }

  return null;
}

/**
 * Parses compact tiered higher-level dice descriptions such as:
 *   "3rd–4th level slot: 3d8 damage. 5th–6th level slot: 4d8 damage. 7th level or higher: 5d8 damage."
 *
 * Returns the correct dice string for `castAtLevel`, or null if the text does
 * not use this format.
 */
export function parseTieredDice(
  text: string,
  castAtLevel: number
): string | null {
  const tierPattern =
    /(\w+)(?:[–\-](\w+))?\s+level(?:\s+slot)?(?:\s+or\s+\w+)?\s*:\s*(\d+d\d+)/gi;

  let bestDice: string | null = null;
  let bestMin = 0;
  let match = tierPattern.exec(text);

  while (match !== null) {
    const minLevel = ordinalToNumber(match[1]);
    const maxLevel = match[2] ? ordinalToNumber(match[2]) : null;
    const dice = match[3];
    if (minLevel === null) continue;

    // castAtLevel falls in [minLevel, maxLevel] or minLevel <= castAtLevel when
    // there is no upper bound (e.g. "7th level or higher")
    const inRange =
      castAtLevel >= minLevel && (maxLevel === null || castAtLevel <= maxLevel);
    if (inRange && minLevel > bestMin) {
      bestMin = minLevel;
      bestDice = dice;
    }
    match = tierPattern.exec(text);
  }

  return bestDice;
}

/**
 * Adds scaling dice to a base dice expression when the die types match.
 * e.g. combineDice("3d6", "1d6", 2) → "5d6"
 * Falls back to baseDice for mismatched die types or unparseable expressions.
 */
export function combineDice(
  baseDice: string,
  scalingDice: string,
  levelsAbove: number
): string {
  const baseMatch = /^(\d+)d(\d+)$/.exec(baseDice.trim());
  const scaleMatch = /^(\d+)d(\d+)$/.exec(scalingDice.trim());
  if (!baseMatch || !scaleMatch) return baseDice;

  const baseDieType = parseInt(baseMatch[2], 10);
  const scaleDieType = parseInt(scaleMatch[2], 10);
  if (baseDieType !== scaleDieType) return baseDice;

  const baseCount = parseInt(baseMatch[1], 10);
  const scaleCount = parseInt(scaleMatch[1], 10);
  return `${baseCount + scaleCount * levelsAbove}d${baseDieType}`;
}

/**
 * Returns the upcast duration string for a spell cast at a given level.
 *
 * Handles four patterns in `higherLevels` text (case-insensitive):
 *
 * 1. Additive — "increases by N hours/minutes for each slot level above Mth"
 *    e.g. Animal Messenger, Magic Circle
 * 2. Ranged threshold — "a spell slot of Nth or Mth level" → duration
 *    e.g. Hex, Hunter's Mark
 * 3. Lower-bounded threshold — "a spell slot of Nth level or higher" → duration
 *    e.g. Bestow Curse, Dominate Beast/Person
 * 4. Single-level threshold — "a Nth-level spell slot" → duration
 *    e.g. Dominate Monster
 *
 * Returns `baseDuration` when no pattern matches or `castAtLevel` is below
 * every threshold.
 */
export function getScaledDuration(
  baseDuration: string | undefined,
  higherLevels: string | undefined,
  castAtLevel: number
): string | undefined {
  if (!baseDuration || !higherLevels) return baseDuration;

  // --- 1. Additive per-level ---
  const additiveMatch =
    /duration.*?increases?\s+by\s+(\d+)\s*(hours?|minutes?)\s+for each (?:slot )?level above (\w+)/i.exec(
      higherLevels
    );
  if (additiveMatch) {
    const addAmount = parseInt(additiveMatch[1], 10);
    const unitRaw = additiveMatch[2].toLowerCase();
    const aboveLevel = ordinalToNumber(additiveMatch[3]);
    if (aboveLevel !== null && castAtLevel > aboveLevel) {
      const levelsAbove = castAtLevel - aboveLevel;
      const totalAdd = addAmount * levelsAbove;
      const baseDurMatch = /(\d+)\s*(hours?|minutes?)/i.exec(baseDuration);
      if (baseDurMatch) {
        const baseAmount = parseInt(baseDurMatch[1], 10);
        const baseUnitStem = baseDurMatch[2].toLowerCase().replace(/s$/, "");
        const unitStem = unitRaw.replace(/s$/, "");
        if (unitStem === baseUnitStem) {
          const newTotal = baseAmount + totalAdd;
          const newUnit = newTotal === 1 ? unitStem : `${unitStem}s`;
          const prefix = /^concentration/i.test(baseDuration)
            ? "Concentration, up to "
            : "";
          return `${prefix}${newTotal} ${newUnit}`;
        }
      }
    }
    return baseDuration;
  }

  // --- 2-4. Tiered threshold patterns ---
  const sentences = higherLevels.split(/\.\s*/);
  const clauses: Array<{
    minLevel: number;
    maxLevel: number | null;
    duration: string;
  }> = [];

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    let minLevel: number | null = null;
    let maxLevel: number | null = null;

    // "spell slot of Nth or Mth level"
    const rangeMatch = /spell slot of (\w+) or (\w+) level/i.exec(sentence);
    if (rangeMatch) {
      minLevel = ordinalToNumber(rangeMatch[1]);
      maxLevel = ordinalToNumber(rangeMatch[2]);
    }

    // "spell slot of Nth level or higher/above"
    if (minLevel === null) {
      const hMatch = /spell slot of (\w+) level or (?:higher|above)/i.exec(
        sentence
      );
      if (hMatch) {
        minLevel = ordinalToNumber(hMatch[1]);
        maxLevel = null;
      }
    }

    // "a Nth-level spell slot" or "a Nth level spell slot"
    if (minLevel === null) {
      const nthMatch = /a (\w+)[-\s]level spell slot/i.exec(sentence);
      if (nthMatch) {
        minLevel = ordinalToNumber(nthMatch[1]);
        maxLevel = null;
      }
    }

    if (minLevel === null) continue;

    let newDuration: string | null = null;

    // "the duration is concentration, up to X"
    const durConcMatch =
      /the duration is concentration,?\s+up to ([^.]+)/i.exec(sentence);
    if (durConcMatch) {
      newDuration = `Concentration, up to ${durConcMatch[1].trim()}`;
    }

    // "the duration is X" (non-concentration)
    if (!newDuration) {
      const durIsMatch = /the duration is (?!concentration)([^.]+)/i.exec(
        sentence
      );
      if (durIsMatch) {
        newDuration = durIsMatch[1].trim();
      }
    }

    // "maintain...concentration...for up to X"
    if (!newDuration) {
      const maintainMatch =
        /maintain.+?concentration.+?for up to ([^.]+)/i.exec(sentence);
      if (maintainMatch) {
        newDuration = `Concentration, up to ${maintainMatch[1].trim()}`;
      }
    }

    // "the spell lasts until it is dispelled"
    if (!newDuration && /lasts until it is dispelled/i.test(sentence)) {
      newDuration = "Until dispelled";
    }

    if (newDuration === null) continue;
    clauses.push({ minLevel, maxLevel, duration: newDuration });
  }

  // Pick the highest-threshold clause that still applies to castAtLevel
  clauses.sort((a, b) => b.minLevel - a.minLevel);
  for (const clause of clauses) {
    if (
      castAtLevel >= clause.minLevel &&
      (clause.maxLevel === null || castAtLevel <= clause.maxLevel)
    ) {
      return clause.duration;
    }
  }

  return baseDuration;
}

/**
 * Returns the scaled damage dice expression for a spell cast at a given level.
 *
 * First checks for a tiered format (e.g. Shadow Blade), then falls back to the
 * per-level additive formula. Returns `baseDamageDice` unchanged when no
 * scaling pattern is found or `castAtLevel <= spellLevel`.
 */
export function getScaledDamageDice(
  baseDamageDice: string,
  higherLevels: string | undefined,
  spellLevel: number,
  castAtLevel: number
): string {
  if (castAtLevel <= spellLevel) return baseDamageDice;
  if (!higherLevels) return baseDamageDice;

  // Try tiered format first (e.g. "3rd–4th level slot: 3d8 damage.")
  const tiered = parseTieredDice(higherLevels, castAtLevel);
  if (tiered !== null) return tiered;

  // Standard additive per-level formula
  const parsed = parseHigherLevelDiceBonus(higherLevels);
  if (!parsed) return baseDamageDice;

  const rawLevelsAbove = castAtLevel - parsed.aboveLevel;
  if (rawLevelsAbove <= 0) return baseDamageDice;

  const levelsAbove = Math.floor(rawLevelsAbove / parsed.stepSize);
  if (levelsAbove <= 0) return baseDamageDice;

  return combineDice(baseDamageDice, parsed.scalingDice, levelsAbove);
}
