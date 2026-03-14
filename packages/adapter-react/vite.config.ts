import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "HorizonReact",
      fileName: (fmt) => `adapter-react.${fmt === "es" ? "js" : `${fmt}.js`}`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      // React is a peer dep — don't bundle it into the adapter
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "ReactJSXRuntime",
        },
      },
    },
    sourcemap: true,
  },
});
