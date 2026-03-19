import { X } from "lucide-react";
import React, { useState } from "react";
import type { ActionItem, ActionType, DamageType } from "../types";
import styles from "./SpellPanel.module.css";

interface CustomActionModalProps {
  onClose: () => void;
  onAdd: (action: ActionItem) => void;
}

export function CustomActionModal({ onClose, onAdd }: CustomActionModalProps) {
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
