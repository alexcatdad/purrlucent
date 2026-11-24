// Installs the packed tarball in a throwaway app, the way a consumer gets it,
// and checks what the source tests cannot see: that every export resolves,
// that a TypeScript app type-checks against it, and that every element
// upgrades in a browser from the packed files alone.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { $ } from "bun";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
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
}, 120_000);

afterAll(() => rmSync(app, { recursive: true, force: true }));

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

test("a TypeScript app type-checks against the package", async () => {
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
        types: [],
      },
      files: ["consumer.ts"],
    }),
  );
  const result = await $`bunx tsc -p ${app}`.nothrow().quiet();
  expect(result.stdout.toString()).toBe("");
  expect(result.exitCode).toBe(0);
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
      <pl-dialog ref={dialog} variant="alert" className="x" />
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
    const built = await Bun.build({
      entrypoints: [join(app, "main.ts")],
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
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
      await server.stop();
    }
  },
  60_000,
);
