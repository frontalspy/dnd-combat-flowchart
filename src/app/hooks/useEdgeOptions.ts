import { useState } from "react";
import type { EdgeStyleType } from "../types";

/**
 * Owns the canvas edge rendering options: style, animation, and bundling.
 */
export function useEdgeOptions() {
  const [edgeStyle] = useState<EdgeStyleType>("step");
  const [animatedEdges, setAnimatedEdges] = useState(false);
  const [bundleEdges, setBundleEdges] = useState(false);

  return {
    edgeStyle,
    animatedEdges,
    setAnimatedEdges,
    bundleEdges,
    setBundleEdges,
  };
}
