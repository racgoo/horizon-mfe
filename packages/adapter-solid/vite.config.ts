import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "HorizonSolid",
      fileName: (fmt) => `adapter-solid.${fmt === "es" ? "js" : `${fmt}.js`}`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["solid-js", "solid-js/web"],
      output: {
        globals: {
          "solid-js": "Solid",
          "solid-js/web": "SolidWeb",
        },
      },
    },
    sourcemap: true,
  },
});
