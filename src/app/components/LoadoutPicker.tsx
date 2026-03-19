import { Plus, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { getClassDefinition } from "../data/classes";
import type { Weapon } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import type { Character, WeaponLoadout } from "../types";
import { CustomWeaponModal } from "./CustomWeaponModal";
import styles from "./LoadoutPicker.module.css";

interface LoadoutPickerProps {
  character: Character;
  customWeapons: Weapon[];
  onAddCustomWeapon: (weapon: Weapon) => void;
  onSave: (loadout: WeaponLoadout) => void;
  onClose: () => void;
}

function emptyLoadout(): WeaponLoadout {
  return {
    mainHand: null,
    offHand: null,
    offHandWeaponId: null,
    twoHanded: false,
  };
}

export function LoadoutPicker({
  character,
  customWeapons,
  onAddCustomWeapon,
  onSave,
  onClose,
}: LoadoutPickerProps) {
  const initial = character.loadout ?? emptyLoadout();
  const [mainHand, setMainHand] = useState<string | null>(initial.mainHand);
  const [offHand, setOffHand] = useState<"weapon" | "shield" | null>(
    initial.offHand
  );
  const [offHandWeaponId, setOffHandWeaponId] = useState<string | null>(
    initial.offHandWeaponId
  );
  const [twoHanded, setTwoHanded] = useState(initial.twoHanded);
  const [showCustomWeaponModal, setShowCustomWeaponModal] = useState(false);

  const classDef = getClassDefinition(character.class);
  const proficientWeapons = useMemo(() => {
    const srdProficient = !classDef
      ? WEAPONS
      : WEAPONS.filter((w) =>
          classDef.weaponProficiencies.includes(w.category)
        );
    return [...srdProficient, ...customWeapons];
  }, [classDef, customWeapons]);

  const lightWeapons = useMemo(
    () => proficientWeapons.filter((w) => w.properties.includes("light")),
    [proficientWeapons]
  );

  const mainWeapon = useMemo(
    () => proficientWeapons.find((w) => w.id === mainHand) ?? null,
    [proficientWeapons, mainHand]
  );

  const offHandWeapon = useMemo(
    () => proficientWeapons.find((w) => w.id === offHandWeaponId) ?? null,
    [proficientWeapons, offHandWeaponId]
  );

  // Warn if main-hand weapon is two-handed and user hasn't checked the flag
  const mainIsTwoHanded =
    mainWeapon?.properties.includes("two-handed") ?? false;

  // Constraint warnings
  const offHandNotLight =
    offHand === "weapon" &&
    offHandWeapon !== null &&
    !offHandWeapon.properties.includes("light");

  const versatileWarning =
    mainWeapon?.properties.includes("versatile") && !twoHanded && !offHand;

  const handleTwoHandedToggle = useCallback((checked: boolean) => {
    setTwoHanded(checked);
    if (checked) {
      setOffHand(null);
      setOffHandWeaponId(null);
    }
  }, []);

  const handleOffHandMode = useCallback((mode: "weapon" | "shield" | null) => {
    setOffHand(mode);
    if (mode !== "weapon") setOffHandWeaponId(null);
    if (mode !== null) setTwoHanded(false);
  }, []);

  const handleMainHandChange = useCallback(
    (id: string) => {
      const w = proficientWeapons.find((x) => x.id === id) ?? null;
      setMainHand(id || null);
      // Auto-enable two-handed for two-handed weapons
      if (w?.properties.includes("two-handed")) {
        setTwoHanded(true);
        setOffHand(null);
        setOffHandWeaponId(null);
      }
    },
    [proficientWeapons]
  );

  const handleSave = useCallback(() => {
    onSave({
      mainHand,
      offHand: twoHanded ? null : offHand,
      offHandWeaponId:
        twoHanded || offHand !== "weapon" ? null : offHandWeaponId,
      twoHanded,
    });
    onClose();
  }, [mainHand, offHand, offHandWeaponId, twoHanded, onSave, onClose]);

  const handleClear = useCallback(() => {
    onSave(emptyLoadout());
    onClose();
  }, [onSave, onClose]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.panel}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Weapon loadout picker"
        >
          <div className={styles.header}>
            <span className={styles.title}>Arms &amp; Armaments</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close loadout picker"
            >
              <X size={14} />
            </button>
          </div>

          <div className={styles.body}>
            {/* Main hand */}
            <div className={styles.row}>
              <label className={styles.rowLabel} htmlFor="lp-main">
                Main Hand
              </label>
              <select
                id="lp-main"
                className={styles.select}
                value={mainHand ?? ""}
                onChange={(e) => handleMainHandChange(e.target.value)}
              >
                <option value="">— none —</option>
                {proficientWeapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.damageDice} {w.damageType})
                  </option>
                ))}
              </select>
            </div>

            {/* Two-handed toggle */}
            <div className={styles.checkRow}>
              <input
                id="lp-twohanded"
                type="checkbox"
                className={styles.checkbox}
                checked={twoHanded || mainIsTwoHanded}
                disabled={mainIsTwoHanded}
                onChange={(e) => handleTwoHandedToggle(e.target.checked)}
              />
              <label htmlFor="lp-twohanded" className={styles.checkLabel}>
                Two-handed
              </label>
              {mainIsTwoHanded && <span className={styles.autoTag}>auto</span>}
            </div>

            {/* Off-hand — hidden when two-handed */}
            {!twoHanded && !mainIsTwoHanded && (
              <div className={styles.row}>
                <label className={styles.rowLabel}>Off Hand</label>
                <div className={styles.offHandGroup}>
                  <button
                    type="button"
                    className={`${styles.offHandBtn} ${offHand === null ? styles.offHandBtnActive : ""}`}
                    onClick={() => handleOffHandMode(null)}
                  >
                    Empty
                  </button>
                  <button
                    type="button"
                    className={`${styles.offHandBtn} ${offHand === "weapon" ? styles.offHandBtnActive : ""}`}
                    onClick={() => handleOffHandMode("weapon")}
                  >
                    Weapon
                  </button>
                  <button
                    type="button"
                    className={`${styles.offHandBtn} ${offHand === "shield" ? styles.offHandBtnActive : ""}`}
                    onClick={() => handleOffHandMode("shield")}
                  >
                    Shield (+2 AC)
                  </button>
                </div>
              </div>
            )}

            {/* Off-hand weapon selector */}
            {!twoHanded && offHand === "weapon" && (
              <div className={styles.row}>
                <label className={styles.rowLabel} htmlFor="lp-offhand">
                  Off-Hand Weapon
                </label>
                <select
                  id="lp-offhand"
                  className={styles.select}
                  value={offHandWeaponId ?? ""}
                  onChange={(e) => setOffHandWeaponId(e.target.value || null)}
                >
                  <option value="">— choose weapon —</option>
                  {lightWeapons.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.damageDice} {w.damageType})
                    </option>
                  ))}
                  {/* Allow selecting non-light but warn */}
                  {proficientWeapons
                    .filter((w) => !w.properties.includes("light"))
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.damageDice} {w.damageType}) ⚠
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Warnings */}
            {offHandNotLight && (
              <p className={styles.warning}>
                ⚠ Two-weapon fighting requires the off-hand weapon to have the{" "}
                <strong>Light</strong> property, unless you have the Two-Weapon
                Fighting style.
              </p>
            )}
            {versatileWarning && (
              <p className={styles.hint}>
                💡 {mainWeapon?.name} is versatile — check Two-handed to use the
                larger damage die ({mainWeapon?.versatileDice}).
              </p>
            )}

            {/* Add custom weapon */}
            <div className={styles.addWeaponRow}>
              <button
                type="button"
                className={styles.addWeaponBtn}
                onClick={() => setShowCustomWeaponModal(true)}
              >
                <Plus size={12} />
                Add Custom Weapon
              </button>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
            >
              Clear Loadout
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {showCustomWeaponModal && (
        <CustomWeaponModal
          onClose={() => setShowCustomWeaponModal(false)}
          onAdd={(weapon) => {
            onAddCustomWeapon(weapon);
            setShowCustomWeaponModal(false);
          }}
        />
      )}
    </>
  );
}
