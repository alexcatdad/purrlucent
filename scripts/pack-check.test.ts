// Installs the packed tarball in a throwaway app, the way a consumer gets it,
// and checks what the source tests cannot see: that every export resolves,
// that a TypeScript app type-checks against it, and that every element
// upgrades in a browser from the packed files alone.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { $ } from "bun";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, sep } from "node:path";
import { chromium } from "playwright";
import { DOCS } from "./agent-skill.ts";

type Target = string | { types: string; default: string };

// Inside node_modules, so the app finds the package's own dependencies (lit)
// the way an installed app does, without a network install.
// The process id keeps parallel checkouts that share node_modules apart.
const app = join(
  process.cwd(),
  `node_modules/.cache/pack-check-${process.pid}`,
);
const installed = join(app, "node_modules/purrlucent");
const kits = join(app, "kits");
const kitRoutes = [
  "admin/index.html",
  "billing/index.html",
  "docs/index.html",
  "docs/theming.html",
  "onboarding/index.html",
  "product-site/centered.html",
  "product-site/index.html",
];
const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
  exports: Record<string, Target>;
};
// The React entry is types for React's JSX; this app has no React to check them against.
const modules = Object.keys(manifest.exports)
  .filter((key) => !/\.(css|json)$/.test(key) && key !== "./react")
  .map((key) => join("purrlucent", key));
const components = readdirSync("src/components", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const tags = (): string[] =>
  (
    JSON.parse(
      readFileSync(join(installed, "dist/custom-elements.json"), "utf8"),
    ) as { modules: { exports?: { kind: string; name: string }[] }[] }
  ).modules.flatMap((m) =>
    (m.exports ?? [])
      .filter((e) => e.kind === "custom-element-definition")
      .map((e) => e.name),
  );

beforeAll(async () => {
  rmSync(app, { recursive: true, force: true });
  mkdirSync(installed, { recursive: true });
  await $`bun run build`.quiet();
  await $`bun pm pack --ignore-scripts --destination ${app}`.quiet();
  await $`tar -xzf ${join(app, `purrlucent-${manifest.version}.tgz`)} --strip-components=1 -C ${installed}`.quiet();
  cpSync(join(installed, "kits"), kits, { recursive: true });
}, 120_000);

afterAll(() => rmSync(app, { recursive: true, force: true }));

test("the package runs no install scripts in an app", () => {
  const { scripts = {} } = JSON.parse(
    readFileSync(join(installed, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
  const lifecycle = ["preinstall", "install", "postinstall", "prepare"];
  expect(
    Object.keys(scripts).filter((name) => lifecycle.includes(name)),
  ).toEqual([]);
});

test("every export points at a file in the package", () => {
  const missing = Object.values(manifest.exports)
    .flatMap((target) =>
      typeof target === "string" ? [target] : Object.values(target),
    )
    .filter((file) => !existsSync(join(installed, file)));
  expect(missing).toEqual([]);
});

test("purrlucent/locale loads without defining any element", async () => {
  // No DOM here: an entry that defined an element would throw on customElements.
  const locale = (await import(join(installed, "dist/locale.js"))) as {
    setMessages?: unknown;
  };
  expect(typeof locale.setMessages).toBe("function");
});

test("the agent skill ships with the docs it reads", () => {
  const missing = [
    "SKILL.md",
    ...DOCS.map((doc) => `references/${basename(doc)}`),
  ]
    .map((file) => `dist/skills/purrlucent/${file}`)
    .filter((file) => !existsSync(join(installed, file)));
  expect(missing).toEqual([]);
});

test("the README links to this release and each guide ships in the package", () => {
  const readme = readFileSync(join(installed, "README.md"), "utf8");
  for (const path of [...DOCS, "SECURITY.md"]) {
    expect(existsSync(join(installed, path)), path).toBe(true);
    expect(readme).toContain(`/blob/v${manifest.version}/${path})`);
  }
});

test("every component has an export with types", () => {
  const untyped = components.filter(
    (name) => typeof manifest.exports[`./${name}`] !== "object",
  );
  expect(untyped).toEqual([]);
});

test("the element manifest lists an element for every component", () => {
  const listed = readFileSync(
    join(installed, "dist/custom-elements.json"),
    "utf8",
  );
  const unlisted = components.filter(
    (name) => !listed.includes(`src/components/${name}/`),
  );
  expect(unlisted).toEqual([]);
  expect(tags().length).toBeGreaterThanOrEqual(components.length);
});

test("a TypeScript app and the copied starters type-check against the package", async () => {
  const kitScripts = readdirSync(kits, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts") && file !== "vite.config.ts")
    .map((file) => join("kits", file));
  expect(kitScripts.length).toBeGreaterThan(0);
  writeFileSync(
    join(app, "consumer.ts"),
    `${modules.map((m) => `import "${m}";`).join("\n")}
import type { PlButton } from "purrlucent/button";
const button: PlButton = document.createElement("pl-button");
button.variant = "primary";
`,
  );
  writeFileSync(
    join(app, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        allowImportingTsExtensions: true,
        noUncheckedSideEffectImports: true,
        types: [],
      },
      files: ["consumer.ts", ...kitScripts],
    }),
  );
  const result = await $`bunx tsc -p ${app}`.nothrow().quiet();
  expect(result.stdout.toString()).toBe("");
  expect(result.exitCode).toBe(0);
}, 60_000);

test("the copied starter kits build standalone pages with their linked assets", async () => {
  await $`bunx --no-install vite build --config ${join(kits, "vite.config.ts")}`.quiet();
  const output = join(kits, "dist");
  const routes = readdirSync(output, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.split(sep).join("/"))
    .sort();
  expect(routes).toEqual(kitRoutes);
  for (const route of routes) {
    const page = join(output, route);
    const html = readFileSync(page, "utf8");
    const assets = [
      ...html.matchAll(/\b(?:href|src)="([^"]+\.(?:css|js|png))"/g),
    ].map((match) => match[1]!);
    const styles = assets.filter((asset) => asset.endsWith(".css"));
    expect(styles.length, route).toBeGreaterThan(0);
    expect(
      assets.some((asset) => asset.endsWith(".js")),
      route,
    ).toBe(true);
    if (route === "product-site/index.html") {
      expect(
        assets.some((asset) => asset.endsWith(".png")),
        route,
      ).toBe(true);
    }
    for (const asset of assets) {
      expect(asset, route).toStartWith("../assets/");
      expect(existsSync(join(dirname(page), asset)), asset).toBe(true);
    }
    expect(
      styles.some((asset) =>
        readFileSync(join(dirname(page), asset), "utf8").includes(
          "--pl-spacing:",
        ),
      ),
      route,
    ).toBe(true);
  }
}, 60_000);

test("the starter config builds a single copied kit twice", async () => {
  const single = join(app, "single-kit");
  cpSync(join(kits, "admin"), join(single, "admin"), { recursive: true });
  for (const file of ["shared.css", "vite.config.ts"]) {
    cpSync(join(kits, file), join(single, file));
  }
  const config = join(single, "vite.config.ts");
  await $`bunx --no-install vite build --config ${config}`.quiet();
  await $`bunx --no-install vite build --config ${config}`.quiet();
  const routes = readdirSync(join(single, "dist"), {
    recursive: true,
    encoding: "utf8",
  }).filter((file) => file.endsWith(".html"));
  expect(routes).toEqual([join("admin", "index.html")]);
}, 60_000);

// React's types come from this repository's node_modules, above the app.
test("a React 19 app type-checks against purrlucent/react", async () => {
  const dir = join(app, "react-app");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "app.tsx"),
    `import type {} from "purrlucent/react";
import type { PlDialog } from "purrlucent/dialog";
import { useRef } from "react";

export function App() {
  const dialog = useRef<PlDialog>(null);
  return (
    <>
      <pl-button variant="primary" disabled={false} onpl-press={() => dialog.current?.show()}>
        Save
      </pl-button>
      <pl-select value="a" onpl-change={(e) => e.detail.value satisfies string}>
        <span slot="label">Fruit</span>
        <pl-option value="a">A</pl-option>
      </pl-select>
      <pl-combobox multiple values={["a"]} onpl-change={(e) => {
        e.detail.value satisfies string;
        e.detail.values satisfies string[] | undefined;
      }} />
      <pl-date-range>
        <pl-date-picker slot="start" name="start" />
        <pl-date-picker slot="end" name="end" />
      </pl-date-range>
      <pl-dialog ref={dialog} variant="alert" className="x" />
      <pl-month-range-picker presets={[{ label: "Q1", start: "2026-01", end: "2026-03" }]} />
      {/* @ts-expect-error not a prop of pl-button */}
      <pl-button notAProp />
      {/* @ts-expect-error the detail of a select's pl-change has no text */}
      <pl-select onpl-change={(e) => e.detail.text} />
    </>
  );
}
`,
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2023", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        types: [],
      },
      files: ["app.tsx"],
    }),
  );
  const result = await $`bunx tsc -p ${dir}`.nothrow().quiet();
  expect(result.stdout.toString()).toBe("");
  expect(result.exitCode).toBe(0);
}, 60_000);

// Launches a browser, so it runs in CI only.
test.skipIf(!process.env.CI)(
  "every element upgrades in a browser from the packed files",
  async () => {
    writeFileSync(
      join(app, "main.ts"),
      modules.map((m) => `import "${m}";`).join("\n"),
    );
    writeFileSync(join(app, "glass.ts"), 'import "purrlucent/toolbar";');
    const built = await Bun.build({
      entrypoints: [join(app, "main.ts"), join(app, "glass.ts")],
      outdir: join(app, "out"),
      target: "browser",
    });
    expect(built.logs).toEqual([]);
    const all = tags();
    writeFileSync(
      join(app, "out/index.html"),
      `<!doctype html><link rel="stylesheet" href="tokens.css">
${all.map((tag) => `<${tag}>${tag}</${tag}>`).join("\n")}
<script type="module" src="main.js"></script>`,
    );
    writeFileSync(
      join(app, "out/tokens.css"),
      readFileSync(join(installed, "dist/tokens.css")),
    );
    writeFileSync(
      join(app, "out/glass.html"),
      `<!doctype html><html pl-material="glass">
<meta http-equiv="Content-Security-Policy" content="require-trusted-types-for 'script'">
<link rel="stylesheet" href="tokens.css">
<pl-toolbar label="Actions">Actions</pl-toolbar>
<script type="module" src="glass.js"></script></html>`,
    );
    const server = Bun.serve({
      port: 0,
      fetch: (req) =>
        new Response(
          Bun.file(join(app, "out", new URL(req.url).pathname.slice(1))),
        ),
    });
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(`http://localhost:${server.port}/index.html`);
      const state = await page.evaluate(
        (names) => ({
          notUpgraded: names.filter(
            (tag) =>
              !customElements.get(tag) ||
              !document.querySelector(tag)?.shadowRoot,
          ),
          spacing: getComputedStyle(document.documentElement).getPropertyValue(
            "--pl-spacing",
          ),
        }),
        all,
      );
      expect(state.notUpgraded).toEqual([]);
      expect(state.spacing).not.toBe("");
      await page.goto(`http://localhost:${server.port}/glass.html`);
      const displacement = page.locator("feDisplacementMap").first();
      await displacement.waitFor({ state: "attached", timeout: 10_000 });
      expect(await displacement.getAttribute("in2")).toBe("map");
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
      await server.stop();
    }
  },
  60_000,
);
