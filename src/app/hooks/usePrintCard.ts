import type { Node } from "@xyflow/react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PRINT_H, PRINT_W } from "../components/PrintLayout";

/**
 * Manages the reference-card PDF export:
 * - `printData` drives rendering of the off-screen `PrintLayout` component.
 * - When `printData` is set, a 150 ms timer fires after the layout renders,
 *   captures it with html-to-image, and saves the PDF.
 * - `triggerPrint` is the stable callback to kick off the flow.
 */
export function usePrintCard(chartName: string) {
  const printLayoutRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<{
    nodes: Node[];
    edges: unknown[];
  } | null>(null);

  useEffect(() => {
    if (!printData) return;
    // Snapshot name at the moment the export was triggered so a mid-export
    // rename doesn't affect the file name.
    const name = chartName;
    const timer = setTimeout(async () => {
      const el = printLayoutRef.current;
      if (!el) return;
      try {
        const dataUrl = await toPng(el, {
          backgroundColor: "#ffffff",
          width: PRINT_W,
          height: PRINT_H,
          pixelRatio: 1,
          skipFonts: true,
        });
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [148, 210],
        });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        pdf.addImage(dataUrl, "PNG", 0, 0, pw, ph);
        pdf.save(`${name}-reference-card.pdf`);
      } finally {
        setPrintData(null);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [printData, chartName]);

  const triggerPrint = useCallback((nodes: Node[], edges: unknown[]) => {
    setPrintData({ nodes, edges });
  }, []);

  return {
    printData,
    printLayoutRef: printLayoutRef as MutableRefObject<HTMLDivElement>,
    triggerPrint,
  };
}
