interface ExportOverlayProps {
  visible: boolean;
}

export function ExportOverlay({ visible }: ExportOverlayProps) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "absolute",
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
    </div>
  );
}
