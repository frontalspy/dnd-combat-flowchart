import React, { createContext, useContext, useEffect, useReducer } from "react";
import type {
  AbilityScores,
  Character,
  SavedFlowchart,
  WeaponLoadout,
} from "../types";

type AppView = "setup" | "builder";

interface AppState {
  view: AppView;
  character: Character | null;
  savedFlowcharts: SavedFlowchart[];
  activeFlowchartId: string | null;
  openTabIds: string[];
  activeTabId: string | null;
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
  | { type: "SET_ABILITY_SCORES"; payload: AbilityScores };

const STORAGE_KEY = "dnd-flowchart-app-state";

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CHARACTER":
      return { ...state, character: action.payload };
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
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
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
