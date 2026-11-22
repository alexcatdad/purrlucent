import { expect, test } from "bun:test";
import { mustRun, versionOnly } from "./ci-changes.ts";

const bump = `--- a/package.json
+++ b/package.json
@@ -1,4 +1,4 @@
-  "version": "0.2.0",
+  "version": "0.2.1",`;

test("a version pull request skips the browser jobs", () => {
  const files = [
    "CHANGELOG.md",
    ".changeset/checkbox-sizes.md",
    "package.json",
  ];
  expect(mustRun(files, bump)).toBe(false);
});

test("root notices and planning docs skip the browser jobs", () => {
  expect(mustRun(["README.md", "docs/superpowers/plans/x.md"], "")).toBe(false);
});

test("anything the build or the tests read runs the browser jobs", () => {
  for (const file of [
    "src/components/button/button.ts",
    "docs/components.md",
    ".github/workflows/ci.yml",
    "playwright.config.ts",
    "bun.lock",
    ".changeset/config.json",
    "e2e/helpers/a11y.ts",
  ])
    expect(mustRun(["CHANGELOG.md", file], bump)).toBe(true);
});

test("an empty diff runs the browser jobs", () => {
  expect(mustRun([], "")).toBe(true);
});

test("a package.json change beyond the version runs the browser jobs", () => {
  expect(versionOnly(`${bump}\n+    "lit": "3.3.4",`)).toBe(false);
  expect(versionOnly("")).toBe(false);
  expect(mustRun(["package.json"], `${bump}\n-    "lit": "3.3.3",`)).toBe(true);
});
