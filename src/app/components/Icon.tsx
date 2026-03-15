import React from "react";

interface IconProps {
  src: string;
  size?: number;
  alt?: string;
  className?: string;
}

export function Icon({ src, size = 16, alt = "", className }: IconProps) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}
