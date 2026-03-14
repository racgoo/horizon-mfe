import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "HorizonEmber",
      fileName: (fmt) => `adapter-ember.${fmt === "es" ? "js" : `${fmt}.js`}`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["horizon-mfe"],
      output: {
        globals: {
          "horizon-mfe": "HorizonMfe",
        },
      },
    },
    sourcemap: true,
  },
});
