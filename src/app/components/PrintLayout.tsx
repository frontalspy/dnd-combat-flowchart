/**
 * PrintLayout — off-screen A5-landscape print rendering of the flowchart.
 *
 * Renders every node in a condensed, ink-on-white style and all edges as
 * thin SVG arrows. The outer wrapper is positioned off-screen so it never
 * affects the visible UI; the inner 1748 × 1240 px div (A5 landscape at
 * ~150 dpi) is the target captured by html-to-image.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   <PrintLayout ref={ref} nodes={nodes} edges={edges} chartName="..." />
 *   // then: toPng(ref.current, { width: 1748, height: 1240 })
 */

import type { Edge, Node } from "@xyflow/react";
import React, { forwardRef } from "react";
import { ACTION_TYPE_LABELS, DAMAGE_TYPES } from "../data/damageTypes";
import type {
  ActionNodeData,
  ConditionNodeData,
  ConditionStatusNodeData,
  NoteNodeData,
  StartNodeData,
} from "../types";
import {
  CONDITION_DISPLAY_NAMES,
  CONDITION_ICONS,
} from "./nodes/ConditionStatusNode";

// ─── Canvas dimensions ───────────────────────────────────────────────────────

/** A5 landscape at ~150 dpi */
export const PRINT_W = 1748;
export const PRINT_H = 1240;

const TITLE_H = 52; // reserved for the title strip at top
const PADDING_X = 72;
const PADDING_Y = 56;

// ─── Node dimension estimates (flow coordinates) ─────────────────────────────
// Used only for bounding-box computation; the rendered sizes below are separate.

const FLOW_W: Record<string, number> = {
  actionNode: 176,
  conditionNode: 150,
  startNode: 155,
  noteNode: 160,
  conditionStatusNode: 160,
};
const FLOW_H: Record<string, number> = {
  actionNode: 110,
  conditionNode: 120,
  startNode: 48,
  noteNode: 80,
  conditionStatusNode: 68,
};

// ─── Printed node sizes ───────────────────────────────────────────────────────

const PN = {
  actionW: 148,
  actionH: 62,
  condW: 110,
  condH: 90,
  startW: 124,
  startH: 32,
  noteW: 136,
  noteH: 50,
  statusW: 136,
  statusH: 42,
};

// ─── Coordinate transform ─────────────────────────────────────────────────────

interface Transform {
  scale: number;
  ox: number; // x offset after centering
  oy: number; // y offset after centering (below title)
  minX: number;
  minY: number;
}

function computeTransform(nodes: Node[]): Transform {
  if (nodes.length === 0) {
    return {
      scale: 1,
      ox: PADDING_X,
      oy: TITLE_H + PADDING_Y,
      minX: 0,
      minY: 0,
    };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const n of nodes) {
    const measured = (
      n as unknown as { measured?: { width?: number; height?: number } }
    ).measured;
    const w = measured?.width ?? FLOW_W[n.type ?? ""] ?? 160;
    const h = measured?.height ?? FLOW_H[n.type ?? ""] ?? 80;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }

  const usableW = PRINT_W - PADDING_X * 2;
  const usableH = PRINT_H - TITLE_H - PADDING_Y * 2;
  const bboxW = maxX - minX || 1;
  const bboxH = maxY - minY || 1;

  const scale = Math.min(usableW / bboxW, usableH / bboxH, 1.8);
  const ox = PADDING_X + (usableW - bboxW * scale) / 2;
  const oy = TITLE_H + PADDING_Y + (usableH - bboxH * scale) / 2;

  return { scale, ox, oy, minX, minY };
}

function tx(t: Transform, x: number): number {
  return t.ox + (x - t.minX) * t.scale;
}
function ty(t: Transform, y: number): number {
  return t.oy + (y - t.minY) * t.scale;
}

// ─── Printed node sizes after scaling ─────────────────────────────────────────

function printedSize(
  nodeType: string,
  scale: number
): { w: number; h: number } {
  const cap = (v: number) => Math.max(v * Math.min(scale, 1.25), v * 0.7);
  switch (nodeType) {
    case "actionNode":
      return { w: cap(PN.actionW), h: cap(PN.actionH) };
    case "conditionNode":
      return { w: cap(PN.condW), h: cap(PN.condH) };
    case "startNode":
      return { w: cap(PN.startW), h: cap(PN.startH) };
    case "noteNode":
      return { w: cap(PN.noteW), h: cap(PN.noteH) };
    case "conditionStatusNode":
      return { w: cap(PN.statusW), h: cap(PN.statusH) };
    default:
      return { w: cap(PN.statusW), h: cap(PN.statusH) };
  }
}

// ─── Edge point helpers ───────────────────────────────────────────────────────

function getSourcePt(
  node: Node,
  sourceHandle: string | null | undefined,
  px: number,
  py: number,
  pw: number,
  ph: number
): { x: number; y: number } {
  const handle = sourceHandle ?? "";
  if (handle === "yes" || handle === "source-right") {
    return { x: px + pw, y: py + ph / 2 };
  }
  // Default: bottom-center
  return { x: px + pw / 2, y: py + ph };
}

function getTargetPt(
  _node: Node,
  targetHandle: string | null | undefined,
  px: number,
  py: number,
  pw: number,
  ph: number
): { x: number; y: number } {
  if (targetHandle === "target-left") {
    return { x: px, y: py + ph / 2 };
  }
  return { x: px + pw / 2, y: py };
}

// ─── Per-node renderers ───────────────────────────────────────────────────────

function RenderActionNode({
  node,
  x,
  y,
  w,
  h,
}: {
  node: Node;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const data = node.data as ActionNodeData;
  const atInfo = ACTION_TYPE_LABELS[data.actionType];
  const dtMeta = data.damageType ? DAMAGE_TYPES[data.damageType] : undefined;
  const fontSize = Math.max(9, Math.min(12, w / 13));
  const badgeFs = Math.max(7, Math.min(10, w / 17));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "#fff",
        border: "1.5px solid #222",
        borderRadius: 4,
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header strip */}
      <div
        style={{
          background: "#ebebeb",
          borderBottom: "1px solid #ccc",
          padding: "2px 5px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: badgeFs,
            fontWeight: 800,
            background: atInfo?.color ?? "#888",
            color: "#fff",
            padding: "1px 4px",
            borderRadius: 3,
            lineHeight: 1,
            letterSpacing: 0.5,
          }}
        >
          {atInfo?.short ?? "?"}
        </span>
        {dtMeta && (
          <img
            src={dtMeta.icon}
            alt={dtMeta.label}
            width={badgeFs + 2}
            height={badgeFs + 2}
            style={{ filter: "brightness(0)", flexShrink: 0 }}
          />
        )}
      </div>
      {/* Label */}
      <div
        style={{
          padding: "3px 5px",
          fontSize: fontSize,
          fontWeight: 700,
          color: "#111",
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1.25,
          overflow: "hidden",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        {data.label as string}
      </div>
    </div>
  );
}

function RenderConditionNode({
  node,
  x,
  y,
  w,
  h,
}: {
  node: Node;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const data = node.data as ConditionNodeData;
  const fontSize = Math.max(8, Math.min(11, w / 12));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Diamond by rotating a square */}
      <div
        style={{
          position: "absolute",
          width: w * 0.78,
          height: h * 0.78,
          background: "#fff",
          border: "1.5px solid #222",
          transform: "rotate(45deg)",
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: fontSize,
          fontWeight: 700,
          color: "#111",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "0 18px",
          lineHeight: 1.2,
          maxWidth: w * 0.88,
          wordBreak: "break-word",
        }}
      >
        {data.label as string}
      </span>
    </div>
  );
}

function RenderStartNode({
  node,
  x,
  y,
  w,
  h,
}: {
  node: Node;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const data = node.data as StartNodeData;
  const fontSize = Math.max(9, Math.min(12, w / 11));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "#222",
        border: "1.5px solid #222",
        borderRadius: h / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: fontSize,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "Georgia, 'Times New Roman', serif",
          letterSpacing: 0.6,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          padding: "0 10px",
        }}
      >
        {data.label as string}
      </span>
    </div>
  );
}

function RenderNoteNode({
  node,
  x,
  y,
  w,
  h,
}: {
  node: Node;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const data = node.data as NoteNodeData;
  const fontSize = Math.max(8, Math.min(10, w / 14));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "#fafafa",
        border: "1px dashed #999",
        borderRadius: 3,
        boxSizing: "border-box",
        padding: "4px 6px",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: fontSize,
          fontStyle: "italic",
          color: "#444",
          fontFamily: "Georgia, 'Times New Roman', serif",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {data.content as string}
      </span>
    </div>
  );
}

function RenderConditionStatusNode({
  node,
  x,
  y,
  w,
  h,
}: {
  node: Node;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const data = node.data as ConditionStatusNodeData;
  const displayName = data.label ?? CONDITION_DISPLAY_NAMES[data.condition];
  const icon = CONDITION_ICONS[data.condition];
  const fontSize = Math.max(8, Math.min(11, w / 13));

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "#fff",
        border: "1.5px solid #444",
        borderRadius: h / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        boxSizing: "border-box",
        padding: "0 10px",
        overflow: "hidden",
      }}
    >
      {icon && (
        <img
          src={icon}
          alt={displayName}
          width={fontSize + 4}
          height={fontSize + 4}
          style={{ filter: "brightness(0)", flexShrink: 0 }}
        />
      )}
      <span
        style={{
          fontSize: fontSize,
          fontWeight: 700,
          color: "#111",
          fontFamily: "Georgia, 'Times New Roman', serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {displayName}
      </span>
    </div>
  );
}

// ─── Edge SVG ─────────────────────────────────────────────────────────────────

interface EdgePoint {
  x: number;
  y: number;
}

function EdgeLine({
  sx,
  sy,
  tx: targetX,
  ty: targetY,
  label,
  color,
}: {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  label: string;
  color: string;
}) {
  const isHoriz = Math.abs(targetX - sx) > Math.abs(targetY - sy) * 1.4;

  let d: string;
  if (isHoriz) {
    // Horizontal-dominant: S-curve in horizontal direction
    const mx = (sx + targetX) / 2;
    d = `M ${sx},${sy} C ${mx},${sy} ${mx},${targetY} ${targetX},${targetY}`;
  } else {
    // Vertical-dominant (most common): S-curve in vertical direction
    const cy = (sy + targetY) / 2;
    d = `M ${sx},${sy} C ${sx},${cy} ${targetX},${cy} ${targetX},${targetY}`;
  }

  // Label position: 28% along the path from source
  const lx = sx + (targetX - sx) * 0.28;
  const ly = sy + (targetY - sy) * 0.28;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        markerEnd="url(#print-arrow)"
      />
      {label && (
        <text
          x={lx}
          y={ly - 4}
          fontSize={9}
          fill={color}
          fontFamily="Georgia, serif"
          textAnchor="middle"
          fontWeight="700"
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface PrintLayoutProps {
  nodes: Node[];
  edges: unknown[];
  chartName?: string;
  characterLabel?: string;
}

export const PrintLayout = forwardRef<HTMLDivElement, PrintLayoutProps>(
  (
    { nodes, edges, chartName = "Combat Flowchart", characterLabel = "" },
    ref
  ) => {
    const t = computeTransform(nodes);

    // Build a lookup: nodeId → { px, py, pw, ph } in print space
    const nodePrintPos = new Map<
      string,
      { px: number; py: number; pw: number; ph: number }
    >();
    for (const n of nodes) {
      const { w, h } = printedSize(n.type ?? "", t.scale);
      const px = tx(t, n.position.x);
      const py = ty(t, n.position.y);
      nodePrintPos.set(n.id, { px, py, pw: w, ph: h });
    }

    // Typed edges
    const typedEdges = edges as Edge[];

    // Compute edge draw data
    interface EdgeDrawEntry {
      key: string;
      sp: EdgePoint;
      tp: EdgePoint;
      label: string;
      color: string;
    }
    const edgeDrawData: EdgeDrawEntry[] = [];
    for (const edge of typedEdges) {
      const srcPos = nodePrintPos.get(edge.source);
      const tgtPos = nodePrintPos.get(edge.target);
      if (!srcPos || !tgtPos) continue;

      const srcNode = nodes.find((n) => n.id === edge.source);
      const tgtNode = nodes.find((n) => n.id === edge.target);
      if (!srcNode || !tgtNode) continue;

      const sp = getSourcePt(
        srcNode,
        edge.sourceHandle,
        srcPos.px,
        srcPos.py,
        srcPos.pw,
        srcPos.ph
      );
      const tp = getTargetPt(
        tgtNode,
        edge.targetHandle,
        tgtPos.px,
        tgtPos.py,
        tgtPos.pw,
        tgtPos.ph
      );

      const label = (edge.data as { label?: string } | undefined)?.label ?? "";
      const isYes = edge.sourceHandle === "yes";
      const isNo = edge.sourceHandle === "no";
      const strokeColor = isYes ? "#1a7a1a" : isNo ? "#8a0000" : "#333";

      edgeDrawData.push({ key: edge.id, sp, tp, label, color: strokeColor });
    }

    return (
      /* Off-screen wrapper — never visible to user */
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {/* Capture target: 1748×1240 A5-landscape card */}
        <div
          ref={ref}
          style={{
            width: PRINT_W,
            height: PRINT_H,
            background: "#ffffff",
            position: "relative",
            overflow: "hidden",
            fontFamily: "Georgia, 'Times New Roman', serif",
            boxSizing: "border-box",
          }}
        >
          {/* Title strip */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: TITLE_H,
              borderBottom: "2px solid #222",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              gap: 16,
              background: "#f5f5f5",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111",
                fontFamily: "Georgia, serif",
                letterSpacing: 0.8,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {chartName}
            </span>
            {characterLabel && (
              <span
                style={{
                  fontSize: 13,
                  color: "#555",
                  fontFamily: "Georgia, serif",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {characterLabel}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                color: "#aaa",
                fontFamily: "Georgia, serif",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              D&amp;D Combat Reference
            </span>
          </div>

          {/* Edge SVG (drawn behind nodes) */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: PRINT_W,
              height: PRINT_H,
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <defs>
              <marker
                id="print-arrow"
                markerWidth="7"
                markerHeight="5"
                refX="6"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L7,2.5 L0,5 Z" fill="#333" />
              </marker>
              <marker
                id="print-arrow-yes"
                markerWidth="7"
                markerHeight="5"
                refX="6"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L7,2.5 L0,5 Z" fill="#1a7a1a" />
              </marker>
              <marker
                id="print-arrow-no"
                markerWidth="7"
                markerHeight="5"
                refX="6"
                refY="2.5"
                orient="auto"
              >
                <path d="M0,0 L7,2.5 L0,5 Z" fill="#8a0000" />
              </marker>
            </defs>
            {edgeDrawData.map(
              ({
                key,
                sp,
                tp,
                label,
                color,
              }: {
                key: string;
                sp: EdgePoint;
                tp: EdgePoint;
                label: string;
                color: string;
              }) => (
                <EdgeLine
                  key={key}
                  sx={sp.x}
                  sy={sp.y}
                  tx={tp.x}
                  ty={tp.y}
                  label={label}
                  color={color}
                />
              )
            )}
          </svg>

          {/* Nodes (above edges) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: PRINT_W,
              height: PRINT_H,
              zIndex: 1,
            }}
          >
            {nodes.map((node) => {
              const pos = nodePrintPos.get(node.id);
              if (!pos) return null;
              const { px, py, pw, ph } = pos;

              switch (node.type) {
                case "actionNode":
                  return (
                    <RenderActionNode
                      key={node.id}
                      node={node}
                      x={px}
                      y={py}
                      w={pw}
                      h={ph}
                    />
                  );
                case "conditionNode":
                  return (
                    <RenderConditionNode
                      key={node.id}
                      node={node}
                      x={px}
                      y={py}
                      w={pw}
                      h={ph}
                    />
                  );
                case "startNode":
                  return (
                    <RenderStartNode
                      key={node.id}
                      node={node}
                      x={px}
                      y={py}
                      w={pw}
                      h={ph}
                    />
                  );
                case "noteNode":
                  return (
                    <RenderNoteNode
                      key={node.id}
                      node={node}
                      x={px}
                      y={py}
                      w={pw}
                      h={ph}
                    />
                  );
                case "conditionStatusNode":
                  return (
                    <RenderConditionStatusNode
                      key={node.id}
                      node={node}
                      x={px}
                      y={py}
                      w={pw}
                      h={ph}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Footer rule */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 24,
              borderTop: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "0 24px",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "#bbb",
                fontFamily: "Georgia, serif",
              }}
            >
              Generated by D&amp;D Combat Flowchart Builder
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PrintLayout.displayName = "PrintLayout";
