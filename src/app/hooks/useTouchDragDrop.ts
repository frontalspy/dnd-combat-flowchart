import React, { useCallback, useContext, useEffect, useRef } from "react";
import { TouchDropContext } from "../context/TouchDropContext";

/** Hold a card for 200 ms then drag it to the canvas on touch devices. */
export function useTouchDragDrop(
  data: unknown,
  label: string,
  accentColor: string,
  cardRef: React.RefObject<HTMLDivElement | null>
) {
  const { dropAtPosition, closeLibrary } = useContext(TouchDropContext);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const libraryClosedRef = useRef(false);

  // Non-passive native listener so we can call preventDefault during drag
  // biome-ignore lint/correctness/useExhaustiveDependencies: cardRef.current is stable after mount
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (isDraggingRef.current) {
        e.preventDefault();
        if (ghostRef.current) {
          ghostRef.current.style.left = `${touch.clientX - 50}px`;
          ghostRef.current.style.top = `${touch.clientY - 20}px`;
          const overCanvas = !!document
            .elementFromPoint(touch.clientX, touch.clientY)
            ?.closest("[data-canvas-drop]");
          ghostRef.current.style.borderColor = overCanvas
            ? "#d4a017"
            : "rgba(139,148,158,0.5)";
          if (!libraryClosedRef.current) {
            const stillInPanel = !!document
              .elementFromPoint(touch.clientX, touch.clientY)
              ?.closest("[data-spell-panel]");
            if (!stillInPanel) {
              libraryClosedRef.current = true;
              closeLibrary();
            }
          }
        }
      } else {
        const dx = touch.clientX - startXRef.current;
        const dy = touch.clientY - startYRef.current;
        if ((Math.abs(dx) > 10 || Math.abs(dy) > 10) && holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        isDraggingRef.current = true;
        libraryClosedRef.current = false;
        const ghost = document.createElement("div");
        ghost.textContent = label;
        ghost.style.cssText = [
          "position:fixed",
          `left:${startXRef.current - 50}px`,
          `top:${startYRef.current - 22}px`,
          "background:#1c2026",
          "border:1.5px solid rgba(139,148,158,0.5)",
          `border-left:3px solid ${accentColor}`,
          "border-radius:6px",
          "padding:6px 12px",
          "font-size:13px",
          "font-weight:600",
          "color:#cdd9e5",
          "pointer-events:none",
          "z-index:9999",
          "opacity:0.92",
          "white-space:nowrap",
          "box-shadow:0 4px 20px rgba(0,0,0,0.5)",
          "font-family:system-ui,sans-serif",
        ].join(";");
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
      }, 200);
    },
    [label, accentColor]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      const wasDragging = isDraggingRef.current;
      isDraggingRef.current = false;
      if (ghostRef.current) {
        document.body.removeChild(ghostRef.current);
        ghostRef.current = null;
      }
      if (wasDragging) {
        const touch = e.changedTouches[0];
        const overCanvas = !!document
          .elementFromPoint(touch.clientX, touch.clientY)
          ?.closest("[data-canvas-drop]");
        if (overCanvas) {
          dropAtPosition(touch.clientX, touch.clientY, data);
        }
      }
    },
    [dropAtPosition, data]
  );

  return { handleTouchStart, handleTouchEnd };
}
