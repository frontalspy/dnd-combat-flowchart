import React from "react";
import "./styles/normalize.css";
import { AppProvider, useApp } from "./context/AppContext";
import { CharacterSetup } from "./pages/CharacterSetup";
import { FlowchartBuilder } from "./pages/FlowchartBuilder";

function AppInner() {
  const { state } = useApp();
  return state.view === "builder" ? <FlowchartBuilder /> : <CharacterSetup />;
}

export const App = () => (
  <AppProvider>
    <AppInner />
  </AppProvider>
);
