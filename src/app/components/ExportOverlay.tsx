import React from "react";
import { createPortal } from "react-dom";

interface ExportOverlayProps {
  visible: boolean;
}

export function ExportOverlay({ visible }: ExportOverlayProps) {
  if (!visible) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#d4aa30",
        fontSize: "18px",
        fontFamily: "Georgia, serif",
        letterSpacing: "0.05em",
        pointerEvents: "all",
      }}
    >
      Exporting…
    </div>,
    document.body
  );
}
