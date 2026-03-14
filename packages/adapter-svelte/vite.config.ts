import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "HorizonSvelte",
      fileName: (fmt) => `adapter-svelte.${fmt === "es" ? "js" : `${fmt}.js`}`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["svelte", "svelte/store"],
      output: {
        globals: {
          svelte: "Svelte",
          "svelte/store": "SvelteStore",
        },
      },
    },
    sourcemap: true,
  },
});
