import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "astro/config";
import solid from "@astrojs/solid-js";
import tailwind from "@astrojs/tailwind";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://astro.build/config
export default defineConfig({
  outDir: "dev/dist",
  srcDir: "dev",
  vite: {
    resolve: {
      alias: {
        "solid-transition-group": path.resolve(__dirname, "./src/index.ts"),
      },
    },
  },
  integrations: [solid(), tailwind()],
});
