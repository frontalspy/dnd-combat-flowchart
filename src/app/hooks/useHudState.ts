import { useCallback, useMemo, useState } from "react";
import type { PathBudget } from "../types";

/**
 * Owns all HUD popover visibility flags plus the live data fed into each HUD:
 * - Action Economy (budgets + over-budget node IDs, worst-case derived value)
 * - Concentration (active spells + conflict IDs)
 * - Spell Slots, Selection Groups, and Economy hidden state
 */
export function useHudState() {
  const [showSlotsPopover, setShowSlotsPopover] = useState(false);
  const [showEconomyPopover, setShowEconomyPopover] = useState(false);
  const [economyHudHidden, setEconomyHudHidden] = useState(false);
  const [showGroupsPopover, setShowGroupsPopover] = useState(false);
  const [showConcentrationPopover, setShowConcentrationPopover] =
    useState(false);

  const [concentrationInfo, setConcentrationInfo] = useState<{
    spells: Array<{ id: string; label: string }>;
    conflictIds: string[];
  }>({ spells: [], conflictIds: [] });

  const [actionEconomyInfo, setActionEconomyInfo] = useState<{
    budgets: PathBudget[];
    overBudgetNodeIds: string[];
  }>({ budgets: [], overBudgetNodeIds: [] });

  const worstCase = useMemo(() => {
    if (actionEconomyInfo.budgets.length === 0) return null;
    return {
      actions: Math.max(...actionEconomyInfo.budgets.map((p) => p.actions)),
      bonusActions: Math.max(
        ...actionEconomyInfo.budgets.map((p) => p.bonusActions)
      ),
      reactions: Math.max(...actionEconomyInfo.budgets.map((p) => p.reactions)),
    };
  }, [actionEconomyInfo.budgets]);

  const handleConcentrationChange = useCallback(
    (spells: Array<{ id: string; label: string }>, conflictIds: string[]) => {
      setConcentrationInfo({ spells, conflictIds });
    },
    []
  );

  const handleActionEconomyChange = useCallback(
    (budgets: PathBudget[], overBudgetNodeIds: string[]) => {
      setActionEconomyInfo({ budgets, overBudgetNodeIds });
    },
    []
  );

  return {
    showSlotsPopover,
    setShowSlotsPopover,
    showEconomyPopover,
    setShowEconomyPopover,
    economyHudHidden,
    setEconomyHudHidden,
    showGroupsPopover,
    setShowGroupsPopover,
    showConcentrationPopover,
    setShowConcentrationPopover,
    concentrationInfo,
    handleConcentrationChange,
    actionEconomyInfo,
    handleActionEconomyChange,
    worstCase,
  };
}
