import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { patchCssModules } from "vite-css-modules";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/dnd-combat-flowchart/" : "/",
  server: {
    port: 3000,
    open: true,
  },
  plugins: [react(), patchCssModules({ generateSourceTypes: true })],
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },
}));
