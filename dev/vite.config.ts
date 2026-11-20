import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";

const root = new URL(".", import.meta.url).pathname;

export default defineConfig({
  root,
  plugins: [solid()],
  css: {
    postcss: { plugins: [(await import("tailwindcss")).default(root + "tailwind.config.cjs")] },
  },
  resolve: { alias: { "solid-transition-group": root + "../src/index.ts" } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: [root + "index.html", root + "group/index.html"] },
  },
});
