import { Plus, Search, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { STANDARD_ACTIONS } from "../data/actions";
import type { ClassAction } from "../data/classes";
import { getClassDefinition, getMaxSpellLevel } from "../data/classes";
import { SPELL_SCHOOLS } from "../data/damageTypes";
import { resolveGroupTemplates } from "../data/groupTemplates";
import spellsData from "../data/spells.json";
import type { Weapon } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import combatActionIcon from "../icons/combat/action.svg";
import roundIcon from "../icons/combat/round.svg";
import scrollIcon from "../icons/entity/scroll.svg";
import combatIcon from "../icons/game/combat.svg";
import conditionTabIcon from "../icons/game/hazard.svg";
import puzzleIcon from "../icons/game/puzzle.svg";
import spellIcon from "../icons/game/spell.svg";
import buildIcon from "../icons/util/build.svg";
import swordIcon from "../icons/weapon/sword.svg";
import type { ActionItem, Character, DndCondition, Spell } from "../types";
import { CustomActionModal } from "./CustomActionModal";
import { Icon } from "./Icon";
import {
  CONDITION_DISPLAY_NAMES,
  CONDITION_ICONS,
} from "./nodes/ConditionStatusNode";
import { ActionCard, SpellCard } from "./SpellCard";
import styles from "./SpellPanel.module.css";
import { WeaponCard } from "./WeaponCard";

const allSpells = spellsData as Spell[];

const ALL_CONDITIONS: DndCondition[] = [
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
];

type PanelTab = "actions" | "spells" | "conditions";
type SpellLevelFilter =
  | "all"
  | "cantrip"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9";

type SpellSourceFilter = "all" | "SRD" | "XGtE" | "TCoE";

interface DragTemplateProps {
  icon: string;
  label: string;
  description: string;
  onDragStart: (e: React.DragEvent) => void;
}

function DragTemplate({
  icon,
  label,
  description,
  onDragStart,
}: DragTemplateProps) {
  return (
    <div
      className={styles.template}
      draggable
      onDragStart={onDragStart}
      title={description}
    >
      <span className={styles.templateIcon}>
        <Icon src={icon} size={16} />
      </span>
      <span className={styles.templateLabel}>{label}</span>
    </div>
  );
}

interface SpellPanelProps {
  character: Character;
  customWeapons: Weapon[];
  customActions: ActionItem[];
  onAddCustomAction: (action: ActionItem) => void;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

export function SpellPanel({
  character,
  customWeapons,
  customActions,
  onAddCustomAction,
  onDragStart,
}: SpellPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("actions");
  const [search, setSearch] = useState("");
  const [spellLevelFilter, setSpellLevelFilter] =
    useState<SpellLevelFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SpellSourceFilter>("all");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [conditionAffects, setConditionAffects] = useState<
    "self" | "target" | "area"
  >("target");

  const classDef = getClassDefinition(character.class);
  const maxSpellLevel = getMaxSpellLevel(
    character.class,
    character.subclass,
    character.level
  );

  const monkMartialArtsDie = useMemo(() => {
    if (character.class !== "monk") return null;
    const lvl = character.level;
    if (lvl >= 17) return "1d10";
    if (lvl >= 11) return "1d8";
    if (lvl >= 5) return "1d6";
    return "1d4";
  }, [character.class, character.level]);

  const loadoutWeapons = useMemo(() => {
    const result: Array<{ weapon: Weapon; hand: "main" | "off" }> = [];
    const loadout = character.loadout;
    if (!loadout) return result;
    const allWeapons = [...WEAPONS, ...customWeapons];
    if (loadout.mainHand) {
      let w = allWeapons.find((x) => x.id === loadout.mainHand);
      if (w) {
        if (w.id === "unarmed-strike" && monkMartialArtsDie) {
          w = { ...w, damageDice: monkMartialArtsDie };
        }
        result.push({ weapon: w, hand: "main" });
      }
    }
    if (loadout.offHand === "weapon" && loadout.offHandWeaponId) {
      let w = allWeapons.find((x) => x.id === loadout.offHandWeaponId);
      if (w) {
        if (w.id === "unarmed-strike" && monkMartialArtsDie) {
          w = { ...w, damageDice: monkMartialArtsDie };
        }
        result.push({ weapon: w, hand: "off" });
      }
    }
    return result;
  }, [character.loadout, customWeapons, monkMartialArtsDie]);

  const filteredLoadoutWeapons = useMemo(() => {
    if (!search.trim()) return loadoutWeapons;
    const q = search.toLowerCase();
    return loadoutWeapons.filter(
      ({ weapon: w }) =>
        w.name.toLowerCase().includes(q) ||
        w.damageType.toLowerCase().includes(q) ||
        w.properties.some((p) => p.toLowerCase().includes(q))
    );
  }, [loadoutWeapons, search]);

  const classActions: ActionItem[] = useMemo(() => {
    if (!classDef) return [];
    const eligible = classDef.classActions.filter(
      (a: ClassAction) => a.minLevel <= character.level
    );
    // For actions sharing the same name, keep only the highest-minLevel one
    // (e.g. monk Unarmed Strike tiers — show only the current die size)
    const best = new Map<string, ClassAction>();
    for (const a of eligible) {
      const prev = best.get(a.name);
      if (!prev || a.minLevel > prev.minLevel) best.set(a.name, a);
    }
    return Array.from(best.values()).map((a: ClassAction) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      actionType: a.actionType,
      damageType: a.damageType,
      source: "class" as const,
    }));
  }, [classDef, character.level]);

  const filteredActions = useMemo(() => {
    const allActions = [...STANDARD_ACTIONS, ...classActions, ...customActions];
    if (!search.trim()) return allActions;
    const q = search.toLowerCase();
    return allActions.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [classActions, customActions, search]);

  const availableSpells = useMemo(() => {
    if (maxSpellLevel === 0) return [];
    return allSpells.filter((spell) => {
      if (!spell.classes.includes(character.class)) return false;
      if (spell.level === "cantrip") return true;
      const spellLvl = parseInt(spell.level, 10);
      return !isNaN(spellLvl) && spellLvl <= maxSpellLevel;
    });
  }, [character.class, maxSpellLevel]);

  const filteredSpells = useMemo(() => {
    let spells = availableSpells;
    if (spellLevelFilter !== "all") {
      spells = spells.filter((s) => s.level === spellLevelFilter);
    }
    if (sourceFilter !== "all") {
      spells = spells.filter((s) => {
        const src = s.source ?? "SRD";
        return src === sourceFilter;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      spells = spells.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q)
      );
    }
    return spells;
  }, [availableSpells, spellLevelFilter, search, sourceFilter]);

  const suggestedGroups = useMemo(
    () => resolveGroupTemplates(character.class, character.level),
    [character.class, character.level]
  );

  const handleAddCustom = useCallback(
    (action: ActionItem) => {
      onAddCustomAction(action);
    },
    [onAddCustomAction]
  );

  const handleTemplateDrag = useCallback(
    (e: React.DragEvent, nodeType: string, data: unknown) => {
      onDragStart(e, { nodeType, ...((data as object) ?? {}) });
    },
    [onDragStart]
  );

  const spellLevelOptions: SpellLevelFilter[] = [
    "all",
    "cantrip",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ];

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.characterChip}>
          <span className={styles.classIcon}>
            <Icon src={classDef?.icon ?? combatIcon} size={26} />
          </span>
          <div className={styles.characterInfo}>
            <span className={styles.characterClass}>
              {classDef?.name ?? character.class}
            </span>
            <span className={styles.characterLevel}>
              Level {character.level}
            </span>
          </div>
        </div>
      </div>

      {/* Drag Templates */}
      <div className={styles.templates}>
        <div className={styles.templatesLabel}>Drag to Canvas</div>
        <div className={styles.templateGrid}>
          <DragTemplate
            icon={puzzleIcon}
            label="Condition"
            description="Add a decision/condition node"
            onDragStart={(e) =>
              handleTemplateDrag(e, "conditionNode", {
                type: "conditionNode",
                label: "Condition?",
              })
            }
          />
          <DragTemplate
            icon={scrollIcon}
            label="Note"
            description="Add a sticky note"
            onDragStart={(e) =>
              handleTemplateDrag(e, "noteNode", {
                type: "noteNode",
                content: "",
              })
            }
          />
          <DragTemplate
            icon={combatIcon}
            label="Start"
            description="Add a combat start node"
            onDragStart={(e) =>
              handleTemplateDrag(e, "startNode", {
                type: "startNode",
                label: "Combat Start",
              })
            }
          />
          <DragTemplate
            icon={roundIcon}
            label="End"
            description="Add a round end node"
            onDragStart={(e) =>
              handleTemplateDrag(e, "endNode", {
                type: "endNode",
                label: "End of Round",
              })
            }
          />
          <DragTemplate
            icon={buildIcon}
            label="Group"
            description="Add a variant group node (e.g. smite options)"
            onDragStart={(e) =>
              handleTemplateDrag(e, "groupNode", {
                type: "groupNode",
                label: "Action Group",
              })
            }
          />
        </div>
      </div>

      {/* Search — hidden on conditions tab */}
      {activeTab !== "conditions" && (
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={
              activeTab === "spells" ? "Search spells..." : "Search actions..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearch("")}
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "actions" ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab("actions");
          }}
        >
          <Icon src={combatActionIcon} size={14} />
          Actions
        </button>
        {maxSpellLevel > 0 && (
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "spells" ? styles.activeTab : ""}`}
            onClick={() => {
              setActiveTab("spells");
            }}
          >
            <Icon src={spellIcon} size={14} />
            Spells
          </button>
        )}
        <button
          type="button"
          className={`${styles.tab} ${activeTab === "conditions" ? styles.activeTab : ""}`}
          onClick={() => {
            setActiveTab("conditions");
          }}
        >
          <Icon src={conditionTabIcon} size={14} />
          Conditions
        </button>
      </div>

      {/* Spell level filter */}
      {activeTab === "spells" && (
        <div className={styles.levelFilters}>
          {spellLevelOptions
            .filter((l) => {
              if (l === "all") return true;
              if (l === "cantrip") return true;
              return parseInt(l, 10) <= maxSpellLevel;
            })
            .map((level) => (
              <button
                key={level}
                type="button"
                className={`${styles.levelChip} ${level !== "all" ? styles.levelChipCircle : ""} ${spellLevelFilter === level ? styles.activeLevelChip : ""}`}
                onClick={() => setSpellLevelFilter(level)}
              >
                {level === "all" ? "All" : level === "cantrip" ? "✦" : level}
              </button>
            ))}
        </div>
      )}

      {/* Source filter */}
      {activeTab === "spells" && (
        <div className={styles.sourceFilters}>
          {(["all", "SRD", "XGtE", "TCoE"] as SpellSourceFilter[]).map(
            (src) => (
              <button
                key={src}
                type="button"
                className={`${styles.sourceChip} ${sourceFilter === src ? styles.activeSourceChip : ""}`}
                onClick={() => setSourceFilter(src)}
              >
                {src === "all" ? "All Sources" : src}
              </button>
            )
          )}
        </div>
      )}

      {/* Card list */}
      <div className={styles.cardList} key={activeTab}>
        {activeTab === "actions" &&
          suggestedGroups.length > 0 &&
          !search.trim() && (
            <div className={styles.suggestedGroups}>
              <div className={styles.suggestedGroupsLabel}>
                Suggested Groups
              </div>
              <div className={styles.suggestedGroupsList}>
                {suggestedGroups.map((group) => (
                  <div
                    key={group.label}
                    className={styles.groupChip}
                    draggable
                    title={`${group.variants.length} variants — drag to canvas`}
                    onDragStart={(e) =>
                      handleTemplateDrag(e, "groupNode", {
                        label: group.label,
                        variants: group.variants,
                        collapsed: false,
                      })
                    }
                  >
                    <Icon src={buildIcon} size={14} />
                    <span className={styles.groupChipLabel}>{group.label}</span>
                    <span className={styles.groupChipCount}>
                      {group.variants.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Weapons — shown below suggested groups in actions tab */}
        {activeTab === "actions" && (
          <div className={styles.weaponsSection}>
            <div className={styles.weaponsSectionLabel}>Weapons</div>
            {!character.loadout?.mainHand ? (
              <div className={styles.noWeaponCard}>
                <Icon src={swordIcon} size={16} />
                <div className={styles.noWeaponInfo}>
                  <span className={styles.noWeaponLabel}>
                    Main Hand — No weapon equipped
                  </span>
                  <span className={styles.noWeaponHint}>
                    Use the Loadout button to assign weapons
                  </span>
                </div>
              </div>
            ) : (
              filteredLoadoutWeapons
                .filter(({ hand }) => hand === "main")
                .map(({ weapon, hand }) => (
                  <WeaponCard
                    key={`${weapon.id}-${hand}`}
                    weapon={weapon}
                    hand={hand}
                    onDragStart={onDragStart}
                  />
                ))
            )}
            {filteredLoadoutWeapons
              .filter(({ hand }) => hand === "off")
              .map(({ weapon, hand }) => (
                <WeaponCard
                  key={`${weapon.id}-${hand}`}
                  weapon={weapon}
                  hand={hand}
                  onDragStart={onDragStart}
                />
              ))}
            {character.loadout?.offHand === "shield" && (
              <div className={styles.shieldCard}>
                <span className={styles.shieldIcon}>🛡</span>
                <span className={styles.shieldLabel}>Shield</span>
                <span className={styles.shieldAc}>+2 AC</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "conditions" && (
          <div className={styles.conditionsTab}>
            <div className={styles.conditionAffectsRow}>
              <span className={styles.conditionAffectsRowLabel}>Affects:</span>
              <div className={styles.conditionAffectsToggle}>
                {(["target", "self", "area"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`${styles.conditionAffectsBtn} ${conditionAffects === a ? styles.conditionAffectsBtnActive : ""}`}
                    onClick={() => setConditionAffects(a)}
                  >
                    {a === "target" ? "Target" : a === "self" ? "Self" : "Area"}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.conditionChipsFull}>
              {ALL_CONDITIONS.map((cond) => (
                <div
                  key={cond}
                  className={styles.conditionChipFull}
                  draggable
                  title={`Drag to add a "${CONDITION_DISPLAY_NAMES[cond]}" condition node`}
                  onDragStart={(e) =>
                    handleTemplateDrag(e, "conditionStatusNode", {
                      condition: cond,
                      affects: conditionAffects,
                    })
                  }
                >
                  <span className={styles.conditionChipFullIcon}>
                    <Icon src={CONDITION_ICONS[cond]} size={22} />
                  </span>
                  <span className={styles.conditionChipFullLabel}>
                    {CONDITION_DISPLAY_NAMES[cond]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "actions" &&
          filteredActions.filter((a) => a.id !== "std-attack").length === 0 && (
            <div className={styles.emptyState}>
              No actions match your search.
            </div>
          )}

        {activeTab === "actions" &&
          filteredActions
            .filter((a) => a.id !== "std-attack")
            .map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onDragStart={onDragStart}
              />
            ))}

        {activeTab === "spells" && filteredSpells.length === 0 && (
          <div className={styles.emptyState}>
            {maxSpellLevel === 0
              ? "No spells available for this class/level combination."
              : "No spells match your search."}
          </div>
        )}

        {activeTab === "spells" &&
          filteredSpells.map((spell) => (
            <SpellCard
              key={spell.name}
              spell={spell}
              onDragStart={onDragStart}
            />
          ))}
      </div>

      <div className={styles.panelFooter}>
        <button
          type="button"
          className={styles.addCustomBtn}
          onClick={() => setShowCustomModal(true)}
        >
          <Plus size={14} />
          Add Custom Action
        </button>
      </div>

      {showCustomModal && (
        <CustomActionModal
          onClose={() => setShowCustomModal(false)}
          onAdd={handleAddCustom}
        />
      )}
    </aside>
  );
}
