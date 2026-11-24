import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = import.meta.dirname;
const components = readdirSync(resolve(root, "src/components"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/**
 * The purrlucent/tailwind.css export. Tailwind's preflight resets margin,
 * padding and border on every element, and a rule from the page outranks a
 * component's own :host rule. Imported after Tailwind, this reverts the
 * preflight for every element the library defines, in Tailwind's base layer.
 */
const tailwindCss = () => {
  const tags = components
    .flatMap((name) =>
      readdirSync(resolve(root, "src/components", name))
        .filter((file) => /^[a-z-]+\.ts$/.test(file))
        .flatMap((file) => [
          ...readFileSync(
            resolve(root, "src/components", name, file),
            "utf8",
          ).matchAll(/customElements\.define\(\s*"(pl-[a-z-]+)"/g),
        ])
        .map((match) => match[1]),
    )
    .sort();
  return `/* Import after Tailwind: hands margin, padding and border back to purrlucent's elements, which Tailwind's preflight resets. */
@layer base {
  :is(${tags.join(", ")}) {
    margin: revert-layer;
    padding: revert-layer;
    border: revert-layer;
  }
}
`;
};

export default defineConfig({
  plugins: [
    {
      // Ships the generated tokens as the purrlucent/tokens.css export.
      name: "pl-tokens-css",
      generateBundle() {
        // Storybook reuses this config for its own build; only the library ships tokens.css.
        if (!this.environment.config.build.lib) return;
        this.emitFile({
          type: "asset",
          fileName: "tokens.css",
          source: readFileSync(resolve(root, "src/tokens/tokens.css")),
        });
        this.emitFile({
          type: "asset",
          fileName: "tailwind.css",
          source: tailwindCss(),
        });
      },
    },
  ],
  build: {
    // Support policy: the last two versions of each evergreen browser (as of
    // 2026-11-20). Vite's default target is older and makes Lightning CSS
    // rewrite light-dark() into media queries.
    target: ["chrome156", "edge156", "firefox159", "safari26", "ios26"],
    lib: {
      entry: {
        index: resolve(root, "src/index.ts"),
        surfaces: resolve(root, "src/surfaces/surfaces.css.ts"),
        typography: resolve(root, "src/typography/typography.css.ts"),
        locale: resolve(root, "src/behaviors/locale.ts"),
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
      // @tanstack/charts is an optional peer, installed by apps that use the chart.
      external: [/^lit(\/|$)/, /^@tanstack\/charts(\/|$)/],
    },
  },
});
