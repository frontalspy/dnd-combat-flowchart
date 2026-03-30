import React from "react";

/** Context providing the set of ActionNode IDs that are in a concentration conflict. */
export const ConcentrationContext = React.createContext<Set<string>>(new Set());

/** Context providing a map of nodeId → group badge colour for selection groups. */
export const SelectionGroupContext = React.createContext<Map<string, string>>(
  new Map()
);

/** Context providing the set of ActionNode IDs that contribute to an over-budget path. */
export const ActionEconomyContext = React.createContext<Set<string>>(new Set());

/** Context controlling whether critical hit dice badges are shown on attack nodes. */
export const CritDiceContext = React.createContext<boolean>(false);
