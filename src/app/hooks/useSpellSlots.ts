import { useMemo } from "react";
import { getMulticlassSpellSlots } from "../data/classes";
import type { Character } from "../types";

/**
 * Derives all spell-slot display values from the current character and the
 * live per-level slot counts from app state.
 */
export function useSpellSlots(
  character: Character | null | undefined,
  spellSlots: Record<number, number>
) {
  const maxSlots = useMemo(
    () => (character ? getMulticlassSpellSlots(character) : {}),
    [character]
  );

  const slotLevels = useMemo(
    () =>
      Object.keys(maxSlots)
        .map(Number)
        .sort((a, b) => a - b),
    [maxSlots]
  );

  const hasSlotsToTrack = slotLevels.length > 0;

  const isWarlock =
    !!character &&
    (character.class === "warlock" ||
      (character.secondaryClasses ?? []).some((sc) => sc.class === "warlock"));

  const totalSlotsSpent = slotLevels.reduce((sum, lvl) => {
    const max = maxSlots[lvl] ?? 0;
    const remaining = spellSlots[lvl] ?? max;
    return sum + (max - remaining);
  }, 0);

  return { maxSlots, slotLevels, hasSlotsToTrack, isWarlock, totalSlotsSpent };
}
