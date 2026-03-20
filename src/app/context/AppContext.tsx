import React, { createContext, useContext, useEffect, useReducer } from "react";
import { getSpellSlots } from "../data/classes";
import type { Weapon } from "../data/weapons";
import type {
  AbilityScores,
  ActionItem,
  Character,
  SavedFlowchart,
  WeaponLoadout,
} from "../types";
import { decodeFlowchart, SHARE_PARAM } from "../utils/shareUrl";

type AppView = "setup" | "builder";

interface AppState {
  view: AppView;
  character: Character | null;
  savedFlowcharts: SavedFlowchart[];
  activeFlowchartId: string | null;
  openTabIds: string[];
  activeTabId: string | null;
  spellSlots: Record<number, number>;
  customWeapons: Weapon[];
  customActions: ActionItem[];
}

type AppAction =
  | { type: "SET_CHARACTER"; payload: Character }
  | { type: "SET_VIEW"; payload: AppView }
  | { type: "SAVE_FLOWCHART"; payload: SavedFlowchart }
  | { type: "DELETE_FLOWCHART"; payload: string }
  | { type: "SET_ACTIVE_FLOWCHART"; payload: string | null }
  | { type: "LOAD_STATE"; payload: Partial<AppState> }
  | { type: "OPEN_TAB"; payload: string }
  | { type: "CLOSE_TAB"; payload: string }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_LOADOUT"; payload: WeaponLoadout }
  | { type: "SET_ABILITY_SCORES"; payload: AbilityScores }
  | { type: "SET_CHARACTER_LEVEL"; payload: number }
  | { type: "USE_SLOT"; payload: number }
  | { type: "RESTORE_SLOT"; payload: number }
  | { type: "RESTORE_SLOTS" }
  | { type: "ADD_CUSTOM_WEAPON"; payload: Weapon }
  | { type: "ADD_CUSTOM_ACTION"; payload: ActionItem };

const STORAGE_KEY = "dnd-flowchart-app-state";

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CHARACTER": {
      const fullSlots = getSpellSlots(
        action.payload.class,
        action.payload.subclass,
        action.payload.level
      );
      return { ...state, character: action.payload, spellSlots: fullSlots };
    }
    case "SET_LOADOUT":
      return {
        ...state,
        character: state.character
          ? { ...state.character, loadout: action.payload }
          : state.character,
      };
    case "SET_ABILITY_SCORES":
      return {
        ...state,
        character: state.character
          ? { ...state.character, abilityScores: action.payload }
          : state.character,
      };
    case "SET_CHARACTER_LEVEL": {
      if (!state.character) return state;
      const newCharacter = { ...state.character, level: action.payload };
      return {
        ...state,
        character: newCharacter,
        spellSlots: getSpellSlots(
          newCharacter.class,
          newCharacter.subclass,
          newCharacter.level
        ),
      };
    }
    case "USE_SLOT":
      return {
        ...state,
        spellSlots: {
          ...state.spellSlots,
          [action.payload]: Math.max(
            0,
            (state.spellSlots[action.payload] ?? 0) - 1
          ),
        },
      };
    case "RESTORE_SLOT": {
      if (!state.character) return state;
      const maxForLevel =
        getSpellSlots(
          state.character.class,
          state.character.subclass,
          state.character.level
        )[action.payload] ?? 0;
      return {
        ...state,
        spellSlots: {
          ...state.spellSlots,
          [action.payload]: Math.min(
            maxForLevel,
            (state.spellSlots[action.payload] ?? 0) + 1
          ),
        },
      };
    }
    case "RESTORE_SLOTS": {
      if (!state.character) return state;
      return {
        ...state,
        spellSlots: getSpellSlots(
          state.character.class,
          state.character.subclass,
          state.character.level
        ),
      };
    }
    case "ADD_CUSTOM_WEAPON":
      return {
        ...state,
        customWeapons: [...state.customWeapons, action.payload],
      };
    case "ADD_CUSTOM_ACTION":
      return {
        ...state,
        customActions: [...state.customActions, action.payload],
      };
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SAVE_FLOWCHART": {
      const existing = state.savedFlowcharts.findIndex(
        (f) => f.id === action.payload.id
      );
      const updated =
        existing >= 0
          ? state.savedFlowcharts.map((f) =>
              f.id === action.payload.id ? action.payload : f
            )
          : [...state.savedFlowcharts, action.payload];
      return {
        ...state,
        savedFlowcharts: updated,
        activeFlowchartId: action.payload.id,
      };
    }
    case "DELETE_FLOWCHART": {
      const filtered = state.savedFlowcharts.filter(
        (f) => f.id !== action.payload
      );
      const newOpenTabs = state.openTabIds.filter(
        (id) => id !== action.payload
      );
      const newActiveTab =
        state.activeTabId === action.payload
          ? (newOpenTabs[newOpenTabs.length - 1] ?? null)
          : state.activeTabId;
      return {
        ...state,
        savedFlowcharts: filtered,
        activeFlowchartId:
          state.activeFlowchartId === action.payload
            ? null
            : state.activeFlowchartId,
        openTabIds: newOpenTabs,
        activeTabId: newActiveTab,
      };
    }
    case "SET_ACTIVE_FLOWCHART":
      return { ...state, activeFlowchartId: action.payload };
    case "OPEN_TAB": {
      const alreadyOpen = state.openTabIds.includes(action.payload);
      return {
        ...state,
        openTabIds: alreadyOpen
          ? state.openTabIds
          : [...state.openTabIds, action.payload],
        activeTabId: action.payload,
        activeFlowchartId: action.payload,
      };
    }
    case "CLOSE_TAB": {
      const idx = state.openTabIds.indexOf(action.payload);
      const remaining = state.openTabIds.filter((id) => id !== action.payload);
      let nextActive = state.activeTabId;
      if (state.activeTabId === action.payload) {
        // Pick adjacent tab: prefer the one before, fall back to after
        nextActive = remaining[Math.min(idx, remaining.length - 1)] ?? null;
      }
      return {
        ...state,
        openTabIds: remaining,
        activeTabId: nextActive,
        activeFlowchartId: nextActive,
        view: remaining.length === 0 ? "setup" : state.view,
      };
    }
    case "SET_ACTIVE_TAB":
      return {
        ...state,
        activeTabId: action.payload,
        activeFlowchartId: action.payload,
      };
    case "LOAD_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const initialState: AppState = {
  view: "setup",
  character: null,
  savedFlowcharts: [],
  activeFlowchartId: null,
  openTabIds: [],
  activeTabId: null,
  spellSlots: {},
  customWeapons: [],
  customActions: [],
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setCharacter: (char: Character) => void;
  goToBuilder: () => void;
  goToSetup: () => void;
  saveFlowchart: (chart: SavedFlowchart) => void;
  deleteFlowchart: (id: string) => void;
  setActiveFlowchart: (id: string | null) => void;
  getActiveFlowchart: () => SavedFlowchart | undefined;
  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setLoadout: (loadout: WeaponLoadout) => void;
  setAbilityScores: (scores: AbilityScores) => void;
  setCharacterLevel: (level: number) => void;
  useSpellSlot: (level: number) => void;
  spendSlot: (level: number) => void;
  restoreSlot: (level: number) => void;
  restoreSpellSlots: () => void;
  addCustomWeapon: (weapon: Weapon) => void;
  addCustomAction: (action: ActionItem) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount, then honour any ?chart= share URL
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppState>;
        // Strip openTabIds that no longer exist in savedFlowcharts
        const validIds = (parsed.savedFlowcharts ?? []).map((f) => f.id);
        const safeOpenTabs = (parsed.openTabIds ?? []).filter((id) =>
          validIds.includes(id)
        );
        const safeActiveTab = safeOpenTabs.includes(parsed.activeTabId ?? "")
          ? parsed.activeTabId
          : (safeOpenTabs[safeOpenTabs.length - 1] ?? null);
        dispatch({
          type: "LOAD_STATE",
          payload: {
            ...parsed,
            view: "setup",
            openTabIds: safeOpenTabs,
            activeTabId: safeActiveTab,
          },
        });
      }
    } catch {
      // Ignore parse errors
    }

    // Handle shared ?chart= URL — must come after LOAD_STATE so it wins
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(SHARE_PARAM);
    if (encoded) {
      const chart = decodeFlowchart(encoded);
      if (chart) {
        const importedChart = { ...chart, id: `shared-${Date.now()}` };
        dispatch({ type: "SAVE_FLOWCHART", payload: importedChart });
        dispatch({ type: "OPEN_TAB", payload: importedChart.id });
        dispatch({ type: "SET_VIEW", payload: "builder" });
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  // Persist on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  const setCharacter = (char: Character) =>
    dispatch({ type: "SET_CHARACTER", payload: char });
  const goToBuilder = () => dispatch({ type: "SET_VIEW", payload: "builder" });
  const goToSetup = () => dispatch({ type: "SET_VIEW", payload: "setup" });
  const saveFlowchart = (chart: SavedFlowchart) =>
    dispatch({ type: "SAVE_FLOWCHART", payload: chart });
  const deleteFlowchart = (id: string) =>
    dispatch({ type: "DELETE_FLOWCHART", payload: id });
  const setActiveFlowchart = (id: string | null) =>
    dispatch({ type: "SET_ACTIVE_FLOWCHART", payload: id });
  const getActiveFlowchart = () =>
    state.savedFlowcharts.find((f) => f.id === state.activeFlowchartId);
  const openTab = (id: string) => dispatch({ type: "OPEN_TAB", payload: id });
  const closeTab = (id: string) => dispatch({ type: "CLOSE_TAB", payload: id });
  const setActiveTab = (id: string) =>
    dispatch({ type: "SET_ACTIVE_TAB", payload: id });
  const setLoadout = (loadout: WeaponLoadout) =>
    dispatch({ type: "SET_LOADOUT", payload: loadout });
  const setAbilityScores = (scores: AbilityScores) =>
    dispatch({ type: "SET_ABILITY_SCORES", payload: scores });
  const setCharacterLevel = (level: number) =>
    dispatch({ type: "SET_CHARACTER_LEVEL", payload: level });
  const useSpellSlot = (level: number) =>
    dispatch({ type: "USE_SLOT", payload: level });
  const spendSlot = useSpellSlot;
  const restoreSlot = (level: number) =>
    dispatch({ type: "RESTORE_SLOT", payload: level });
  const restoreSpellSlots = () => dispatch({ type: "RESTORE_SLOTS" });
  const addCustomWeapon = (weapon: Weapon) =>
    dispatch({ type: "ADD_CUSTOM_WEAPON", payload: weapon });
  const addCustomAction = (action: ActionItem) =>
    dispatch({ type: "ADD_CUSTOM_ACTION", payload: action });

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setCharacter,
        goToBuilder,
        goToSetup,
        saveFlowchart,
        deleteFlowchart,
        setActiveFlowchart,
        getActiveFlowchart,
        openTab,
        closeTab,
        setActiveTab,
        setLoadout,
        setAbilityScores,
        setCharacterLevel,
        useSpellSlot,
        spendSlot,
        restoreSlot,
        restoreSpellSlots,
        addCustomWeapon,
        addCustomAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
