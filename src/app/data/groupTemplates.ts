import type { DndClass, GroupVariant } from "../types";
import type { ClassAction } from "./classes";
import { getClassDefinition } from "./classes";
import { detectDamageType } from "./damageTypes";

interface GroupTemplate {
  label: string;
  keywordMatch: string[];
  minLevel?: number;
}

const GROUP_TEMPLATES: Partial<Record<DndClass, GroupTemplate[]>> = {
  paladin: [
    // "divine" → matches "Divine Smite" + "Divine Sense" (2+)
    { label: "Divine Actions", keywordMatch: ["divine"], minLevel: 1 },
  ],
  warlock: [
    // "eldritch" → Eldritch Blast; "hex" → Hex (Pact Feature)
    {
      label: "Eldritch Arsenal",
      keywordMatch: ["eldritch", "hex"],
      minLevel: 1,
    },
  ],
  sorcerer: [
    // All four Metamagic: Quickened/Twinned/Subtle/Empowered have "metamagic" in name
    { label: "Metamagic", keywordMatch: ["metamagic"], minLevel: 2 },
  ],
  monk: [
    // Flurry, Patient Defense, Step of Wind descriptions all say "Spend 1 ki"
    { label: "Ki Abilities", keywordMatch: ["ki"], minLevel: 2 },
  ],
  barbarian: [
    // "rage" → Rage; "reckless" → Reckless Attack (both available at level 2)
    { label: "Combat Stance", keywordMatch: ["rage", "reckless"], minLevel: 2 },
  ],
  druid: [
    // Wild Shape + Wild Shape (Bonus Action) both in one group
    { label: "Wild Shape", keywordMatch: ["wild shape"], minLevel: 2 },
  ],
  fighter: [
    // Second Wind + Action Surge — two classic recovery/burst actions
    {
      label: "Combat Recovery",
      keywordMatch: ["action surge", "second wind"],
      minLevel: 2,
    },
  ],
  rogue: [
    // Cunning Action: Dash / Disengage / Hide all have "cunning action" in name
    { label: "Cunning Actions", keywordMatch: ["cunning action"], minLevel: 2 },
  ],
};

export interface ResolvedGroup {
  label: string;
  variants: GroupVariant[];
}

function actionToVariant(a: ClassAction): GroupVariant {
  return {
    id: a.id,
    label: a.name,
    actionType: a.actionType,
    damageType: a.damageType ?? detectDamageType(a.description, a.name),
  };
}

export function resolveGroupTemplates(
  classId: DndClass,
  level: number
): ResolvedGroup[] {
  const classDef = getClassDefinition(classId);
  if (!classDef) return [];

  const templates = GROUP_TEMPLATES[classId] ?? [];
  return templates
    .filter((t) => !t.minLevel || level >= t.minLevel)
    .map((t) => {
      const variants: GroupVariant[] = classDef.classActions
        .filter((a) => a.minLevel <= level)
        .filter((a) =>
          t.keywordMatch.some(
            (kw) =>
              a.name.toLowerCase().includes(kw) ||
              a.description.toLowerCase().includes(kw)
          )
        )
        .map(actionToVariant);
      return { label: t.label, variants };
    })
    .filter((g) => g.variants.length > 1);
}
