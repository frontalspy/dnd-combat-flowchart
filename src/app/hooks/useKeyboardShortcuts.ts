import type { Node } from "@xyflow/react";
import type { MutableRefObject } from "react";
import { useEffect } from "react";
import type { FlowCanvasExports } from "../types";

interface UseKeyboardShortcutsOptions {
  exportFnsRef: MutableRefObject<FlowCanvasExports | null>;
  selectedNodesRef: MutableRefObject<Node[]>;
  handleSave: () => void;
  setSelectedNodes: (nodes: Node[]) => void;
  setSpellPanelCollapsed: (updater: (v: boolean) => boolean) => void;
}

/**
 * Attaches the global keyboard shortcuts for the builder:
 * Ctrl+C/V (copy/paste), Ctrl+Z/Y (undo/redo), Ctrl+S (save),
 * Ctrl+A (select all), Escape (deselect), [ (toggle library panel).
 */
export function useKeyboardShortcuts({
  exportFnsRef,
  selectedNodesRef,
  handleSave,
  setSelectedNodes,
  setSpellPanelCollapsed,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+S / Cmd+S saves even when focus is inside a text field
      if (mod && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (mod && e.key === "c") {
        exportFnsRef.current?.copy(selectedNodesRef.current);
      } else if (mod && e.key === "v") {
        exportFnsRef.current?.paste();
      } else if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        exportFnsRef.current?.undo();
      } else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        exportFnsRef.current?.redo();
      } else if (mod && e.key === "a") {
        e.preventDefault();
        exportFnsRef.current?.selectAll();
      } else if (e.key === "Escape") {
        setSelectedNodes([]);
      } else if (e.key === "[" && !mod) {
        setSpellPanelCollapsed((v) => !v);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    exportFnsRef,
    handleSave,
    selectedNodesRef,
    setSelectedNodes,
    setSpellPanelCollapsed,
  ]);
}
