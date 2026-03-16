import { Plus, X } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { getClassDefinition } from "../data/classes";
import type { Weapon, WeaponCategory } from "../data/weapons";
import { WEAPONS } from "../data/weapons";
import arrowWIcon from "../icons/weapon/arrow.svg";
import battleaxeWIcon from "../icons/weapon/battleaxe.svg";
import bowWIcon from "../icons/weapon/bow.svg";
import clubWIcon from "../icons/weapon/club.svg";
import crossbowWIcon from "../icons/weapon/crossbow.svg";
import daggerWIcon from "../icons/weapon/dagger.svg";
import flailWIcon from "../icons/weapon/flail.svg";
import glaiveWIcon from "../icons/weapon/glaive.svg";
import halberdWIcon from "../icons/weapon/halberd.svg";
import hammerWIcon from "../icons/weapon/hammer.svg";
import handaxeWIcon from "../icons/weapon/handaxe.svg";
import lanceWIcon from "../icons/weapon/lance.svg";
import maceWIcon from "../icons/weapon/mace.svg";
import morningstarlWIcon from "../icons/weapon/morningstar.svg";
import musketWIcon from "../icons/weapon/musket.svg";
import pikeWIcon from "../icons/weapon/pike.svg";
import pistolWIcon from "../icons/weapon/pistol.svg";
import rapierWIcon from "../icons/weapon/rapier.svg";
import scimitarWIcon from "../icons/weapon/scimitar.svg";
import sickleWIcon from "../icons/weapon/sickle.svg";
import slingWIcon from "../icons/weapon/sling.svg";
import spearWIcon from "../icons/weapon/spear.svg";
import staffWIcon from "../icons/weapon/staff.svg";
import strikeWIcon from "../icons/weapon/strike.svg";
import swordIcon from "../icons/weapon/sword.svg";
import tridentWIcon from "../icons/weapon/trident.svg";
import whipWIcon from "../icons/weapon/whip.svg";
import type { Character, DamageType, WeaponLoadout } from "../types";
import styles from "./LoadoutPicker.module.css";

const WEAPON_ICONS = [
  { id: "arrow", src: arrowWIcon, label: "Arrow" },
  { id: "battleaxe", src: battleaxeWIcon, label: "Battleaxe" },
  { id: "bow", src: bowWIcon, label: "Bow" },
  { id: "club", src: clubWIcon, label: "Club" },
  { id: "crossbow", src: crossbowWIcon, label: "Crossbow" },
  { id: "dagger", src: daggerWIcon, label: "Dagger" },
  { id: "flail", src: flailWIcon, label: "Flail" },
  { id: "glaive", src: glaiveWIcon, label: "Glaive" },
  { id: "halberd", src: halberdWIcon, label: "Halberd" },
  { id: "hammer", src: hammerWIcon, label: "Hammer" },
  { id: "handaxe", src: handaxeWIcon, label: "Handaxe" },
  { id: "lance", src: lanceWIcon, label: "Lance" },
  { id: "mace", src: maceWIcon, label: "Mace" },
  { id: "morningstar", src: morningstarlWIcon, label: "Morningstar" },
  { id: "musket", src: musketWIcon, label: "Musket" },
  { id: "pike", src: pikeWIcon, label: "Pike" },
  { id: "pistol", src: pistolWIcon, label: "Pistol" },
  { id: "rapier", src: rapierWIcon, label: "Rapier" },
  { id: "scimitar", src: scimitarWIcon, label: "Scimitar" },
  { id: "sickle", src: sickleWIcon, label: "Sickle" },
  { id: "sling", src: slingWIcon, label: "Sling" },
  { id: "spear", src: spearWIcon, label: "Spear" },
  { id: "staff", src: staffWIcon, label: "Staff" },
  { id: "strike", src: strikeWIcon, label: "Strike" },
  { id: "sword", src: swordIcon, label: "Sword" },
  { id: "trident", src: tridentWIcon, label: "Trident" },
  { id: "whip", src: whipWIcon, label: "Whip" },
];

const ALL_WEAPON_PROPERTIES = [
  "light",
  "finesse",
  "versatile",
  "thrown",
  "reach",
  "heavy",
  "two-handed",
  "loading",
  "ammunition",
] as const;

interface CustomWeaponModalProps {
  onClose: () => void;
  onAdd: (weapon: Weapon) => void;
}

function CustomWeaponModal({ onClose, onAdd }: CustomWeaponModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WeaponCategory>("simple-melee");
  const [damageDice, setDamageDice] = useState("1d6");
  const [damageType, setDamageType] = useState<DamageType>("slashing");
  const [range, setRange] = useState("");
  const [weaponProps, setWeaponProps] = useState<string[]>([]);
  const [versatileDice, setVersatileDice] = useState("");
  const [icon, setIcon] = useState(swordIcon);

  const toggleProp = useCallback((prop: string) => {
    setWeaponProps((prev) =>
      prev.includes(prop) ? prev.filter((p) => p !== prop) : [...prev, prop]
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalProps = [...weaponProps];
    onAdd({
      id: `custom-weapon-${Date.now()}`,
      name: name.trim(),
      category,
      damageDice: damageDice.trim() || "1d6",
      damageType,
      range: range.trim() || undefined,
      properties: finalProps,
      versatileDice:
        finalProps.includes("versatile") && versatileDice.trim()
          ? versatileDice.trim()
          : undefined,
      icon,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.panel} ${styles.widerPanel}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add custom weapon"
      >
        <div className={styles.header}>
          <span className={styles.title}>Custom Weapon</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formBody}>
            <label className={styles.formLabel}>
              Name *
              <input
                className={styles.formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elven Blade"
                required
              />
            </label>
            <label className={styles.formLabel}>
              Category
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as WeaponCategory)}
              >
                <option value="simple-melee">Simple Melee</option>
                <option value="simple-ranged">Simple Ranged</option>
                <option value="martial-melee">Martial Melee</option>
                <option value="martial-ranged">Martial Ranged</option>
              </select>
            </label>
            <div className={styles.formRow}>
              <label className={`${styles.formLabel} ${styles.formLabelFlex}`}>
                Damage Dice
                <input
                  className={styles.formInput}
                  value={damageDice}
                  onChange={(e) => setDamageDice(e.target.value)}
                  placeholder="1d8"
                />
              </label>
              <label className={`${styles.formLabel} ${styles.formLabelFlex2}`}>
                Damage Type
                <select
                  className={styles.select}
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value as DamageType)}
                >
                  <option value="acid">Acid</option>
                  <option value="bludgeoning">Bludgeoning</option>
                  <option value="cold">Cold</option>
                  <option value="fire">Fire</option>
                  <option value="force">Force</option>
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
            </div>
            <label className={styles.formLabel}>
              Range (optional)
              <input
                className={styles.formInput}
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="5 ft"
              />
            </label>
            <div className={styles.formLabel}>
              Properties
              <div className={styles.propertiesGrid}>
                {ALL_WEAPON_PROPERTIES.map((prop) => (
                  <label key={prop} className={styles.propCheckLabel}>
                    <input
                      type="checkbox"
                      checked={weaponProps.includes(prop)}
                      onChange={() => toggleProp(prop)}
                      className={styles.checkbox}
                    />
                    {prop}
                  </label>
                ))}
              </div>
            </div>
            {weaponProps.includes("versatile") && (
              <label className={styles.formLabel}>
                Versatile Dice
                <input
                  className={styles.formInput}
                  value={versatileDice}
                  onChange={(e) => setVersatileDice(e.target.value)}
                  placeholder="1d10"
                />
              </label>
            )}
            <div className={styles.formLabel}>
              Icon
              <div className={styles.iconPickerGrid}>
                {WEAPON_ICONS.map(({ id: iconId, src, label }) => (
                  <button
                    key={iconId}
                    type="button"
                    className={`${styles.iconPickerBtn} ${icon === src ? styles.iconPickerBtnSelected : ""}`}
                    onClick={() => setIcon(src)}
                    title={label}
                  >
                    <img src={src} width={22} height={22} alt={label} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.clearBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              Add Weapon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
