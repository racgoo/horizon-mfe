import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    svelte({
      preprocess: sveltePreprocess({
        typescript: {
          tsconfigFile: path.join(__dirname, "tsconfig.json"),
        },
      }),
    }),
  ],
  server: {
    port: 3000,
  },
});
