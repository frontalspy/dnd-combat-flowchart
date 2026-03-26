import React from "react";

interface ConditionIconProps {
  /** Raw SVG string from a `?raw` import. */
  svg: string;
  size?: number;
  alt?: string;
}

/**
 * Tints a condition SVG icon to `currentColor` via CSS mask-image.
 * Embeds the SVG as an inline data URI so no external URL load is needed.
 */
export function ConditionIcon({
  svg,
  size = 16,
  alt = "",
}: ConditionIconProps) {
  const dataUri = React.useMemo(() => {
    // Ensure paths render opaque (needed for alpha-mode masking)
    const withFill = svg.replace("<svg", '<svg fill="black"');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withFill)}`;
  }, [svg]);

  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt === "" ? true : undefined}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: "currentColor",
        maskImage: `url("${dataUri}")`,
        WebkitMaskImage: `url("${dataUri}")`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskMode: "alpha",
        // @ts-expect-error vendor prefix not in CSSProperties types
        WebkitMaskMode: "alpha",
      }}
    />
  );
}
