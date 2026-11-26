import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { count, cssOf } from "./style-check.ts";

const files = (pattern: string) => [...new Bun.Glob(pattern).scanSync()].sort();
const read = (file: string) => readFileSync(file, "utf8");

test("inline glyphs use scalable SVG view boxes and no embedded images", () => {
  let glyphs = 0;
  for (const file of files("src/{behaviors,components}/**/*.ts")) {
    if (/\.(?:e2e|stories|test)\.ts$/.test(file)) continue;
    const svgs = [
      ...read(file).matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg\s*>/g),
    ];
    for (const [, attrs, contents] of svgs) {
      expect(attrs, file).toMatch(/\bviewBox="/);
      expect(contents, file).not.toMatch(/<image\b/);
    }
    glyphs += svgs.length;
  }
  expect(glyphs).toBeGreaterThan(0);
});

test("component CSS has no hard-coded color literals", () => {
  const styles = files("src/components/**/*.css.ts");
  expect(styles.length).toBeGreaterThan(0);
  for (const file of styles)
    expect(count(cssOf(file, read(file))).colors, file).toBe(0);
});

test("library CSS has no explicit font weights below regular", () => {
  for (const file of files("src/**/*.{css,css.ts}")) {
    const css = cssOf(file, read(file));
    expect(css, file).not.toMatch(
      /(?:^|[;{])\s*font(?:-weight)?:[^;/{}]*?(?<=[\s:])(?:lighter|(?:[1-9]\d?|[1-3]\d{2})(?:\.\d+)?)(?=[\s!;/}]|$)/i,
    );
  }
});

test("type tokens use system fallbacks and the library ships no font assets", () => {
  const tokens = read("src/tokens/tokens.css");
  expect(tokens).toMatch(/--pl-font-sans:[^;]*\bsystem-ui\b/);
  expect(tokens).toMatch(/--pl-font-mono:\s*monospace;/);
  expect(files("src/**/*.{woff,woff2,otf,ttf}")).toEqual([]);
  for (const file of files("src/**/*.{css,css.ts}"))
    expect(cssOf(file, read(file)), file).not.toContain("@font-face");
});
