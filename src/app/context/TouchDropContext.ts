import { createContext } from "react";

export interface TouchDropContextValue {
  dropAtPosition: (clientX: number, clientY: number, data: unknown) => void;
  /** Called once when a touch drag first crosses into the canvas area. */
  closeLibrary: () => void;
}

export const TouchDropContext = createContext<TouchDropContextValue>({
  dropAtPosition: () => {},
  closeLibrary: () => {},
});
