import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    emptyOutDir: false, // keep tsc-generated .d.ts when vite overwrites JS (e.g. pnpm run example)
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Horizon",
      fileName: (format) => `horizon.${format === "es" ? "js" : `${format}.js`}`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // No external deps — zero dependencies
    },
    sourcemap: true,
    target: "es2020",
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
