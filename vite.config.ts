import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = import.meta.dirname;
const components = readdirSync(resolve(root, "src/components"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

export default defineConfig({
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
