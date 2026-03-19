import LZString from "lz-string";
import type { SavedFlowchart } from "../types";

export const SHARE_PARAM = "chart";

export function encodeFlowchart(chart: SavedFlowchart): string {
  const json = JSON.stringify(chart);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeFlowchart(param: string): SavedFlowchart | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(param);
    if (!json) return null;
    const parsed = JSON.parse(json) as unknown;
    if (!isValidFlowchart(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isValidFlowchart(value: unknown): value is SavedFlowchart {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.character === "object" &&
    v.character !== null &&
    Array.isArray(v.nodes) &&
    Array.isArray(v.edges) &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  );
}
