import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { STANDARD_ACTIONS } from "../data/actions";
import type { ClassAction } from "../data/classes";
import { CLASSES, getClassDefinition, getMaxSpellLevel } from "../data/classes";
import { SPELL_SCHOOLS } from "../data/damageTypes";
import spellsData from "../data/spells.json";
import type { Weapon } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import { useTouchDragDrop } from "../hooks/useTouchDragDrop";
import combatActionIcon from "../icons/combat/action.svg";
import roundIcon from "../icons/combat/round.svg";
import scrollIcon from "../icons/entity/scroll.svg";
import combatIcon from "../icons/game/combat.svg";
import conditionTabIcon from "../icons/game/hazard.svg";
import puzzleIcon from "../icons/game/puzzle.svg";
import spellIcon from "../icons/game/spell.svg";
import swordIcon from "../icons/weapon/sword.svg";
import type {
  ActionItem,
  Character,
  DndClass,
  DndCondition,
  Spell,
} from "../types";
import { CustomActionModal } from "./CustomActionModal";
import { Icon } from "./Icon";
import { ConditionIcon } from "./nodes/ConditionIcon";
import {
  CONDITION_DISPLAY_NAMES,
  CONDITION_ICONS,
} from "./nodes/ConditionStatusNode";
import { ActionCard, SpellCard } from "./SpellCard";
import styles from "./SpellPanel.module.css";
import { WeaponCard } from "./WeaponCard";

/** 2–3-letter abbreviation for each class, used in multiclass spell source badges. */
const CLASS_ABBR: Record<DndClass, string> = {
  barbarian: "Bar",
  bard: "Brd",
  cleric: "Cle",
  druid: "Dru",
  fighter: "Ftr",
  monk: "Mon",
  paladin: "Pal",
  ranger: "Rng",
  rogue: "Rog",
  sorcerer: "Sor",
  warlock: "War",
  wizard: "Wiz",
};

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
  dragData: unknown;
  accentColor?: string;
  onDragStart: (e: React.DragEvent) => void;
}

function DragTemplate({
  icon,
  label,
  description,
  dragData,
  accentColor = "#8b949e",
  onDragStart,
}: DragTemplateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { handleTouchStart, handleTouchEnd } = useTouchDragDrop(
    dragData,
    label,
    accentColor,
    cardRef
  );
  return (
    <div
      ref={cardRef}
      className={styles.template}
      draggable
      onDragStart={onDragStart}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      title={description}
    >
      <span className={styles.templateIcon}>
        <Icon src={icon} size={16} />
      </span>
      <span className={styles.templateLabel}>{label}</span>
    </div>
  );
}

interface ConditionChipFullProps {
  cond: DndCondition;
  affects: "self" | "target" | "area";
  onTemplateDrag: (e: React.DragEvent, nodeType: string, data: unknown) => void;
}

function ConditionChipFull({
  cond,
  affects,
  onTemplateDrag,
}: ConditionChipFullProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragData = {
    nodeType: "conditionStatusNode",
    condition: cond,
    affects,
  };
  const { handleTouchStart, handleTouchEnd } = useTouchDragDrop(
    dragData,
    CONDITION_DISPLAY_NAMES[cond],
    "#a05050",
    cardRef
  );
  return (
    <div
      ref={cardRef}
      className={styles.conditionChipFull}
      draggable
      title={`Drag to add a "${CONDITION_DISPLAY_NAMES[cond]}" condition node`}
      onDragStart={(e) =>
        onTemplateDrag(e, "conditionStatusNode", {
          condition: cond,
          affects,
        })
      }
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className={styles.conditionChipFullIcon}>
        <ConditionIcon
          svg={CONDITION_ICONS[cond]}
          size={22}
          alt={CONDITION_DISPLAY_NAMES[cond]}
        />
      </span>
      <span className={styles.conditionChipFullLabel}>
        {CONDITION_DISPLAY_NAMES[cond]}
      </span>
    </div>
  );
}

interface SpellPanelProps {
  character: Character;
  customWeapons: Weapon[];
  customActions: ActionItem[];
  onAddCustomAction: (action: ActionItem) => void;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
  /** Whether the panel is open (used on mobile/tablet drawer layouts). Ignored on desktop. */
  isOpen?: boolean;
  /** Called when the user dismisses the panel (mobile close button / drag handle tap). */
  onClose?: () => void;
  /** Whether the panel is collapsed to a narrow sliver (desktop only, ≥ 900 px). */
  collapsed?: boolean;
  /** Called when the collapse/expand toggle is clicked (desktop only). */
  onToggleCollapse?: () => void;
}

export function SpellPanel({
  character,
  customWeapons,
  customActions,
  onAddCustomAction,
  onDragStart,
  isOpen = true,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SpellPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  const handleDragTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    if (panelRef.current) panelRef.current.style.transition = "none";
  }, []);

  const handleDragTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const dy = touchCurrentY.current - touchStartY.current;
    if (dy > 0 && panelRef.current)
      panelRef.current.style.transform = `translateY(${dy}px)`;
  }, []);

  const handleDragTouchEnd = useCallback(() => {
    const dy = touchCurrentY.current - touchStartY.current;
    const el = panelRef.current;
    if (!el) return;
    if (dy > 80) {
      el.style.transition = "transform 0.22s ease";
      el.style.transform = "translateY(100%)";
      setTimeout(() => {
        el.style.transition = "";
        el.style.transform = "";
        onClose?.();
      }, 220);
    } else {
      el.style.transition = "transform 0.22s ease";
      el.style.transform = "";
      setTimeout(() => {
        el.style.transition = "";
      }, 220);
    }
  }, [onClose]);
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
  const isMulticlass = (character.secondaryClasses?.length ?? 0) > 0;

  // All class entries (primary + secondary) as a flat array
  const allCharClasses = useMemo(
    () => [
      {
        classId: character.class,
        subclassId: character.subclass,
        level: character.level,
      },
      ...(character.secondaryClasses ?? []).map((sc) => ({
        classId: sc.class,
        subclassId: sc.subclass,
        level: sc.level,
      })),
    ],
    [
      character.class,
      character.subclass,
      character.level,
      character.secondaryClasses,
    ]
  );

  const maxSpellLevel = useMemo(
    () =>
      Math.max(
        0,
        ...allCharClasses.map(({ classId, subclassId, level }) =>
          getMaxSpellLevel(classId, subclassId, level)
        )
      ),
    [allCharClasses]
  );

  const monkMartialArtsDie = useMemo(() => {
    let monkLevel = 0;
    if (character.class === "monk") monkLevel = character.level;
    else {
      const monkSec = character.secondaryClasses?.find(
        (sc) => sc.class === "monk"
      );
      if (monkSec) monkLevel = monkSec.level;
    }
    if (!monkLevel) return null;
    if (monkLevel >= 17) return "1d10";
    if (monkLevel >= 11) return "1d8";
    if (monkLevel >= 5) return "1d6";
    return "1d4";
  }, [character.class, character.level, character.secondaryClasses]);

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
    const resultMap = new Map<string, ActionItem>();
    for (const { classId, level } of allCharClasses) {
      const cd = getClassDefinition(classId);
      if (!cd) continue;
      const eligible = cd.classActions.filter(
        (a: ClassAction) => a.minLevel <= level
      );
      // For same-name actions from the same class keep the highest-minLevel one
      const best = new Map<string, ClassAction>();
      for (const a of eligible) {
        const prev = best.get(a.name);
        if (!prev || a.minLevel > prev.minLevel) best.set(a.name, a);
      }
      for (const a of best.values()) {
        if (!resultMap.has(a.id)) {
          resultMap.set(a.id, {
            id: a.id,
            name: a.name,
            description: a.description,
            actionType: a.actionType,
            damageType: a.damageType,
            source: "class" as const,
          });
        }
      }
    }
    return [...resultMap.values()];
  }, [allCharClasses]);

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

  const { availableSpells, spellClassSources } = useMemo(() => {
    // Build a map from spell name → { spell, sources[] }
    const spellByName = new Map<
      string,
      { spell: Spell; sources: Set<DndClass> }
    >();
    for (const { classId, subclassId, level } of allCharClasses) {
      const maxLvl = getMaxSpellLevel(classId, subclassId, level);
      if (maxLvl === 0) continue;
      for (const spell of allSpells) {
        if (!spell.classes.includes(classId)) continue;
        if (spell.level !== "cantrip") {
          const sl = parseInt(spell.level, 10);
          if (isNaN(sl) || sl > maxLvl) continue;
        }
        if (!spellByName.has(spell.name)) {
          spellByName.set(spell.name, { spell, sources: new Set() });
        }
        spellByName.get(spell.name)!.sources.add(classId);
      }
    }

    const spells: Spell[] = [];
    const sourcesMap = new Map<string, DndClass[]>();
    for (const { spell, sources } of spellByName.values()) {
      spells.push(spell);
      if (isMulticlass) sourcesMap.set(spell.name, [...sources]);
    }
    return { availableSpells: spells, spellClassSources: sourcesMap };
  }, [allCharClasses, isMulticlass]);

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
    <aside
      ref={panelRef}
      data-spell-panel=""
      className={`${styles.panel}${isOpen ? ` ${styles.panelOpen}` : ""}${collapsed ? ` ${styles.panelCollapsed}` : ""}`}
    >
      {/* Sliver tab — visible only when desktop panel is collapsed */}
      {onToggleCollapse && (
        <div className={styles.panelSliver} aria-hidden={!collapsed}>
          <button
            type="button"
            className={styles.sliverArrow}
            onClick={onToggleCollapse}
            title="Expand library panel"
            aria-label="Expand library panel"
            tabIndex={collapsed ? 0 : -1}
          >
            <ChevronRight size={12} />
          </button>
          <span className={styles.sliverLabel}>Library</span>
        </div>
      )}
      {/* Mobile drag handle — tap to close on phone/tablet */}
      <div
        className={styles.dragHandle}
        onClick={onClose}
        onTouchStart={handleDragTouchStart}
        onTouchMove={handleDragTouchMove}
        onTouchEnd={handleDragTouchEnd}
        role="button"
        aria-label="Close library"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose?.();
        }}
      >
        <span className={styles.dragHandleBar} />
      </div>

      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.characterChip} style={{ flex: 1, minWidth: 0 }}>
          <span className={styles.classIcon}>
            <Icon src={classDef?.icon ?? combatIcon} size={26} />
          </span>
          <div className={styles.characterInfo}>
            {isMulticlass ? (
              <>
                <span className={styles.characterClass}>
                  {allCharClasses
                    .map(({ classId, level }) => {
                      const cd = CLASSES.find((c) => c.id === classId);
                      return `${cd?.name ?? classId} ${level}`;
                    })
                    .join(" / ")}
                </span>
                <span className={styles.characterLevel}>
                  Lv {allCharClasses.reduce((s, c) => s + c.level, 0)} total
                </span>
              </>
            ) : (
              <>
                <span className={styles.characterClass}>
                  {classDef?.name ?? character.class}
                </span>
                <span className={styles.characterLevel}>
                  Level {character.level}
                </span>
              </>
            )}
          </div>
        </div>
        {/* Desktop collapse button — only rendered when collapse is available */}
        {onToggleCollapse && (
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            title="Collapse library panel  [ [ ]"
            aria-label="Collapse library panel"
          >
            <ChevronLeft size={12} />
          </button>
        )}
      </div>

      {/* Drag Templates */}
      <div className={styles.templates}>
        <div className={styles.templatesLabel}>Drag to Canvas</div>
        <div className={styles.templateGrid}>
          <DragTemplate
            icon={puzzleIcon}
            label="Condition"
            description="Add a decision/condition node"
            dragData={{
              nodeType: "conditionNode",
              type: "conditionNode",
              label: "Condition?",
            }}
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
            dragData={{ nodeType: "noteNode", type: "noteNode", content: "" }}
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
            dragData={{
              nodeType: "startNode",
              type: "startNode",
              label: "Combat Start",
            }}
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
            dragData={{
              nodeType: "endNode",
              type: "endNode",
              label: "End of Round",
            }}
            onDragStart={(e) =>
              handleTemplateDrag(e, "endNode", {
                type: "endNode",
                label: "End of Round",
              })
            }
          />
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={
            activeTab === "spells"
              ? "Search spells..."
              : activeTab === "conditions"
                ? "Search conditions..."
                : "Search actions..."
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
              {ALL_CONDITIONS.filter((cond) =>
                search
                  ? CONDITION_DISPLAY_NAMES[cond]
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  : true
              ).map((cond) => (
                <ConditionChipFull
                  key={cond}
                  cond={cond}
                  affects={conditionAffects}
                  onTemplateDrag={handleTemplateDrag}
                />
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
          filteredSpells.map((spell) => {
            const sources = spellClassSources.get(spell.name);
            const classBadges =
              isMulticlass && sources && sources.length > 1
                ? sources.map((classId) => ({
                    label: CLASS_ABBR[classId],
                    color:
                      CLASSES.find((c) => c.id === classId)?.color ?? "#888",
                  }))
                : undefined;
            return (
              <SpellCard
                key={spell.name}
                spell={spell}
                onDragStart={onDragStart}
                classBadges={classBadges}
              />
            );
          })}
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
