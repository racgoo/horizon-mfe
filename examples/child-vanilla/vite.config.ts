import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "ChildVanilla",
      // Output: dist/child-vanilla.iife.js
      fileName: "child-vanilla",
      formats: ["iife"],
    },
    outDir: "dist",
    // Don't empty dist between watch rebuilds to avoid 404 flicker
    emptyOutDir: false,
  },
  preview: {
    port: 3001,
    cors: true,
  },
});
