import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { Character, SavedFlowchart } from "../types";

type AppView = "setup" | "builder";

interface AppState {
  view: AppView;
  character: Character | null;
  savedFlowcharts: SavedFlowchart[];
  activeFlowchartId: string | null;
}

type AppAction =
  | { type: "SET_CHARACTER"; payload: Character }
  | { type: "SET_VIEW"; payload: AppView }
  | { type: "SAVE_FLOWCHART"; payload: SavedFlowchart }
  | { type: "DELETE_FLOWCHART"; payload: string }
  | { type: "SET_ACTIVE_FLOWCHART"; payload: string | null }
  | { type: "LOAD_STATE"; payload: Partial<AppState> };

const STORAGE_KEY = "dnd-flowchart-app-state";

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CHARACTER":
      return { ...state, character: action.payload };
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
      return {
        ...state,
        savedFlowcharts: filtered,
        activeFlowchartId:
          state.activeFlowchartId === action.payload
            ? null
            : state.activeFlowchartId,
      };
    }
    case "SET_ACTIVE_FLOWCHART":
      return { ...state, activeFlowchartId: action.payload };
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
        dispatch({ type: "LOAD_STATE", payload: { ...parsed, view: "setup" } });
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
