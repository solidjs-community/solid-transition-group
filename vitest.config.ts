import { defineConfig } from "vitest/config";
import solidPlugin from "@solidjs/vite-plugin";

export default defineConfig(({ mode }) => {
  // to test in server environment, run with "--mode ssr" or "--mode test:ssr" flag
  // loads only server.test.ts file
  const testSSR = mode === "test:ssr" || mode === "ssr";
  const conditions = testSSR ? ["node"] : ["browser", "development"];

  return {
    plugins: [
      solidPlugin({
        refresh: false,
        // For testing SSR we need to do a SSR JSX transform
        solid: { generate: testSSR ? "ssr" : "dom", moduleName: "@solidjs/web" },
      }),
    ],
    test: {
      watch: false,
      isolate: !testSSR,
      environment: testSSR ? "node" : "jsdom",
      // Solid ships separate dev/browser/server builds selected by resolve conditions;
      // inline it so vitest resolves through vite (and those conditions) instead of node.
      server: { deps: { inline: [/solid-js/, /@solidjs\//, /@solid-primitives\//] } },
      ...(testSSR
        ? { include: ["test/server.test.{ts,tsx}"] }
        : { include: ["test/*.test.{ts,tsx}"], exclude: ["test/server.test.{ts,tsx}"] }),
    },
    resolve: { conditions },
    ssr: { resolve: { conditions } },
  };
});
