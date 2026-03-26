import { useEffect, useState } from "react";

/**
 * Manages the spell/ability library panel's open and collapsed state.
 * Collapses the panel whenever the active tab changes.
 */
export function useSpellPanel(activeTabId: string | null) {
  const [spellPanelOpen, setSpellPanelOpen] = useState(false);
  const [spellPanelCollapsed, setSpellPanelCollapsed] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally sync on tab switch only
  useEffect(() => {
    setSpellPanelCollapsed(false);
  }, [activeTabId]);

  return {
    spellPanelOpen,
    setSpellPanelOpen,
    spellPanelCollapsed,
    setSpellPanelCollapsed,
  };
}
