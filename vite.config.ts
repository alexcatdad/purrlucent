import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Features, transform, transformStyleAttribute } from "lightningcss";
import { defineConfig, type Plugin } from "vite";

const root = import.meta.dirname;

// Support policy: the last two versions of each evergreen browser (as of
// 2026-11-20). Vite's default target is older and makes Lightning CSS
// rewrite light-dark() into media queries.
const browsers = { chrome: 156, edge: 156, firefox: 159, safari: 26, ios: 26 };

/**
 * Minifies the CSS in each css`` template of the *.css.ts files. An app's
 * minifier leaves template text alone, so without this every component ships
 * its styles with their comments and indentation. An interpolation becomes a
 * placeholder Lightning CSS keeps: a custom property inside a block, a rule
 * outside one; a template with no block is a declaration list.
 */
const minifyTemplateCss = (): Plugin => {
  const targets = Object.fromEntries(
    Object.entries(browsers).map(([name, major]) => [
      name === "ios" ? "ios_saf" : name,
      major << 16,
    ]),
  );
  const minify = (body: string, id: string) => {
    const holes: { expr: string; mark: string }[] = [];
    const source = body.replace(/\$\{([^}]*)\}/g, (_, expr: string, at) => {
      const before = body.slice(0, at);
      const inBlock = before.split("{").length > before.split("}").length;
      const n = holes.length;
      const mark = inBlock ? `--pl-hole-${n}:0` : `.pl-hole-${n}{--pl-hole:0}`;
      holes.push({ expr, mark });
      return inBlock ? `${mark};` : mark;
    });
    // Minify only: the styles keep the vendor prefixes they were written with.
    const options = {
      filename: id,
      minify: true,
      targets,
      exclude: Features.VendorPrefixes,
      errorRecovery: false,
    };
    const result = source.includes("{")
      ? transform({ ...options, code: Buffer.from(source) })
      : transformStyleAttribute({ ...options, code: Buffer.from(source) });
    if (result.warnings.length)
      throw new Error(
        `${id}: ${result.warnings.map((w) => w.message).join("; ")}`,
      );
    let out = result.code.toString().replace(/[\\`]/g, "\\$&");
    for (const { expr, mark } of holes) {
      if (out.split(mark).length !== 2)
        throw new Error(`${id}: lost the placeholder for \${${expr}}`);
      out = out.replace(mark, `\${${expr}}`);
    }
    return out;
  };
  return {
    name: "pl-minify-template-css",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".css.ts")) return;
      return {
        code: code.replace(
          /(?<![.\w])css`([^`]*)`/g,
          (_, body: string) => `css\`${minify(body, id)}\``,
        ),
        map: null,
      };
    },
  };
};
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
    minifyTemplateCss(),
    {
      // Ships the generated tokens as the purrlucent/tokens.css export.
      name: "pl-tokens-css",
      generateBundle() {
        // Storybook reuses this config for its own build; only the library ships tokens.css.
        if (!this.environment.config.build.lib) return;
        this.emitFile({
          type: "asset",
          fileName: "tokens.css",
          source: readFileSync(
            resolve(root, "src/tokens/tokens.css"),
            "utf8",
          ).replace('@import url("./texture-paint.css");', () =>
            readFileSync(resolve(root, "src/tokens/texture-paint.css"), "utf8"),
          ),
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
    target: Object.entries(browsers).map(([name, major]) => name + major),
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
