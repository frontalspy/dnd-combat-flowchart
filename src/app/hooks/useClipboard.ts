import type { Node } from "@xyflow/react";
import { useCallback, useRef } from "react";

export function useClipboard() {
  const clipboard = useRef<Node[]>([]);

  const copy = useCallback((nodes: Node[]) => {
    clipboard.current = nodes;
  }, []);

  const paste = useCallback(
    (addNodes: (nodes: Node[]) => void, offset = { x: 20, y: 20 }) => {
      if (!clipboard.current.length) return;
      const now = Date.now();
      const pasted = clipboard.current.map((n, i) => ({
        ...n,
        id: `node-${now}-${i}`,
        position: {
          x: n.position.x + offset.x,
          y: n.position.y + offset.y,
        },
        selected: true,
      }));
      addNodes(pasted);
    },
    []
  );

  return { copy, paste };
}
