import { useEffect, useState } from "react";

/**
 * Returns the current `window.innerWidth` and updates whenever the viewport
 * is resized. Uses a `ResizeObserver` on `document.documentElement` so it
 * responds to both window resize events and dynamic layout shifts.
 */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setWidth(window.innerWidth);
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return width;
}
