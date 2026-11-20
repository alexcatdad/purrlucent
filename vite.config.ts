import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = import.meta.dirname;
const components = readdirSync(resolve(root, "src/components"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

export default defineConfig({
  plugins: [
    {
      // Ships the generated tokens as the purrlucent/tokens.css export.
      name: "purr-tokens-css",
      generateBundle() {
        // Storybook reuses this config for its own build; only the library ships tokens.css.
        if (!this.environment.config.build.lib) return;
        this.emitFile({
          type: "asset",
          fileName: "tokens.css",
          source: readFileSync(resolve(root, "src/tokens/tokens.css")),
        });
      },
    },
  ],
  build: {
    lib: {
      entry: {
        index: resolve(root, "src/index.ts"),
        ...Object.fromEntries(
          components.map((name) => [
            name,
            resolve(root, `src/components/${name}/${name}.ts`),
          ]),
        ),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: [/^lit(\/|$)/],
    },
  },
});
