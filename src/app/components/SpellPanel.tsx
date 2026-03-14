import { Plus, Search, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { STANDARD_ACTIONS } from "../data/actions";
import type { ClassAction } from "../data/classes";
import { getClassDefinition, getMaxSpellLevel } from "../data/classes";
import { SPELL_SCHOOLS } from "../data/damageTypes";
import spellsData from "../data/spells.json";
import type {
  ActionItem,
  ActionType,
  Character,
  DamageType,
  Spell,
} from "../types";
import { ActionCard, SpellCard } from "./SpellCard";
import styles from "./SpellPanel.module.css";

const allSpells = spellsData as Spell[];

type PanelTab = "actions" | "spells";
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
      <span className={styles.templateIcon}>{icon}</span>
      <span className={styles.templateLabel}>{label}</span>
    </div>
  );
}

interface CustomActionModalProps {
  onClose: () => void;
  onAdd: (action: ActionItem) => void;
}

function CustomActionModal({ onClose, onAdd }: CustomActionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState<ActionType>("action");
  const [damageType, setDamageType] = useState<DamageType | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      actionType,
      damageType: damageType || undefined,
      source: "custom",
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Custom Action</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.formLabel}>
            Name *
            <input
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sneak Attack"
              required
            />
          </label>
          <label className={styles.formLabel}>
            Action Type
            <select
              className={styles.formSelect}
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
            >
              <option value="action">Action</option>
              <option value="bonus">Bonus Action</option>
              <option value="reaction">Reaction</option>
              <option value="free">Free</option>
              <option value="special">Special</option>
            </select>
          </label>
          <label className={styles.formLabel}>
            Damage Type (optional)
            <select
              className={styles.formSelect}
              value={damageType}
              onChange={(e) => setDamageType(e.target.value as DamageType | "")}
            >
              <option value="">— None —</option>
              <option value="acid">Acid</option>
              <option value="bludgeoning">Bludgeoning</option>
              <option value="cold">Cold</option>
              <option value="fire">Fire</option>
              <option value="force">Force</option>
              <option value="healing">Healing</option>
              <option value="lightning">Lightning</option>
              <option value="necrotic">Necrotic</option>
              <option value="piercing">Piercing</option>
              <option value="poison">Poison</option>
              <option value="psychic">Psychic</option>
              <option value="radiant">Radiant</option>
              <option value="slashing">Slashing</option>
              <option value="thunder">Thunder</option>
            </select>
          </label>
          <label className={styles.formLabel}>
            Description
            <textarea
              className={styles.formTextarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the action..."
              rows={3}
            />
          </label>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Add to Sidebar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SpellPanelProps {
  character: Character;
  onDragStart: (e: React.DragEvent, data: unknown) => void;
}

export function SpellPanel({ character, onDragStart }: SpellPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("actions");
  const [search, setSearch] = useState("");
  const [spellLevelFilter, setSpellLevelFilter] =
    useState<SpellLevelFilter>("all");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customActions, setCustomActions] = useState<ActionItem[]>([]);

  const classDef = getClassDefinition(character.class);
  const maxSpellLevel = getMaxSpellLevel(
    character.class,
    character.subclass,
    character.level
  );

  const classActions: ActionItem[] = useMemo(() => {
    if (!classDef) return [];
    return classDef.classActions
      .filter((a: ClassAction) => a.minLevel <= character.level)
      .map((a: ClassAction) => ({
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
  }, [availableSpells, spellLevelFilter, search]);

  const handleAddCustom = useCallback((action: ActionItem) => {
    setCustomActions((prev) => [...prev, action]);
  }, []);

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
          <span className={styles.classIcon}>{classDef?.icon ?? "⚔️"}</span>
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
            icon="❓"
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
            icon="📝"
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
            icon="⚔️"
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
            icon="🏁"
            label="End"
            description="Add a round end node"
            onDragStart={(e) =>
              handleTemplateDrag(e, "startNode", {
                type: "startNode",
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
          placeholder="Search actions & spells..."
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
          onClick={() => setActiveTab("actions")}
        >
          ⚔️ Actions
        </button>
        {maxSpellLevel > 0 && (
          <button
            type="button"
            className={`${styles.tab} ${activeTab === "spells" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("spells")}
          >
            ✨ Spells
          </button>
        )}
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
                className={`${styles.levelChip} ${spellLevelFilter === level ? styles.activeLevelChip : ""}`}
                onClick={() => setSpellLevelFilter(level)}
              >
                {level === "all" ? "All" : level === "cantrip" ? "✦" : level}
              </button>
            ))}
        </div>
      )}

      {/* Card list */}
      <div className={styles.cardList}>
        {activeTab === "actions" &&
          filteredActions.map((action) => (
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

      {/* Add custom action */}
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
