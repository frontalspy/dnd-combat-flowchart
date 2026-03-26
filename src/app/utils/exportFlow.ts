/**
 * exportFlow.ts
 *
 * Utilities for exporting the React Flow canvas as JPG or PDF.
 *
 * Dependency note: html-to-image's skipFonts:true is required to avoid the
 * cross-origin CSSStyleSheet error thrown when it tries to read Google Fonts
 * stylesheets. With skipFonts, the browser falls back to whatever font-family
 * is resolved on each element at capture time. We temporarily override the
 * --font-ui and --font-display CSS variables on :root with a system-serif
 * stack so the fallback is consistent and metrics-predictable, then restore
 * the custom values once capture completes (or fails).
 */

import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";

const SYSTEM_SERIF = "Georgia, 'Times New Roman', serif";

export function applyExportFonts(): void {
  document.documentElement.style.setProperty("--font-ui", SYSTEM_SERIF);
  document.documentElement.style.setProperty("--font-display", SYSTEM_SERIF);
}

export function removeExportFonts(): void {
  document.documentElement.style.removeProperty("--font-ui");
  document.documentElement.style.removeProperty("--font-display");
}

interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

function buildCaptureStyle(
  width: number,
  height: number,
  { x, y, zoom }: ViewportTransform
): Partial<CSSStyleDeclaration> {
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    transformOrigin: "0 0",
  };
}

/**
 * Capture the viewport element as a JPEG data URL.
 * Caller is responsible for showing/hiding a loading state and for calling
 * applyExportFonts / removeExportFonts around this function.
 */
export async function captureFlowJpeg(
  viewportEl: HTMLElement,
  width: number,
  height: number,
  transform: ViewportTransform
): Promise<string> {
  return toJpeg(viewportEl, {
    quality: 0.95,
    backgroundColor: "#0d1117",
    skipFonts: true,
    width,
    height,
    style: buildCaptureStyle(width, height, transform),
  });
}

/**
 * Capture the viewport element as a PNG data URL.
 * Caller is responsible for showing/hiding a loading state and for calling
 * applyExportFonts / removeExportFonts around this function.
 */
export async function captureFlowPng(
  viewportEl: HTMLElement,
  width: number,
  height: number,
  transform: ViewportTransform
): Promise<string> {
  return toPng(viewportEl, {
    backgroundColor: "#0d1117",
    skipFonts: true,
    width,
    height,
    style: buildCaptureStyle(width, height, transform),
  });
}

/** Trigger a browser download of a JPEG data URL. */
export function downloadJpeg(dataUrl: string, name: string): void {
  const link = document.createElement("a");
  link.download = `${name}.jpg`;
  link.href = dataUrl;
  link.click();
}

/** Wrap a PNG data URL in an A4/landscape jsPDF and trigger a browser save. */
export async function savePdf(dataUrl: string, name: string): Promise<void> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
  const imgW = img.width * ratio;
  const imgH = img.height * ratio;
  pdf.addImage(
    dataUrl,
    "PNG",
    (pageWidth - imgW) / 2,
    (pageHeight - imgH) / 2,
    imgW,
    imgH
  );
  pdf.save(`${name}.pdf`);
}
