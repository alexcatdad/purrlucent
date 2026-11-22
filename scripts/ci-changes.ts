// Decides whether the browser jobs (e2e and screen readers) must run for a
// change. They skip only when every changed file is one that neither the
// Storybook build nor the browser tests read; anything else, or an empty or
// unreadable diff, runs them. Prints `code=true|false` for $GITHUB_OUTPUT.
//
// Usage: bun scripts/ci-changes.ts <git diff range...>
import { $ } from "bun";

const INERT = [
  /^CHANGELOG\.md$/,
  /^\.changeset\/[^/]+\.md$/,
  /^(README\.md|LICENSE|NOTICE|THIRD_PARTY_NOTICES)$/,
  /^docs\/superpowers\//,
];

/** True when a package.json diff changes the "version" line and nothing else. */
export function versionOnly(diff: string): boolean {
  const changed = diff.split("\n").filter((line) => /^[+-](?![+-])/.test(line));
  return (
    changed.length > 0 &&
    changed.every((line) => /^[+-]\s*"version": "[^"]*",?$/.test(line))
  );
}

/** Whether the browser jobs must run for these changed files. */
export function mustRun(files: string[], packageDiff: string): boolean {
  return (
    files.length === 0 ||
    files.some((file) =>
      file === "package.json"
        ? !versionOnly(packageDiff)
        : !INERT.some((pattern) => pattern.test(file)),
    )
  );
}

if (import.meta.main) {
  const range = Bun.argv.slice(2);
  const files = (await $`git diff --name-only ${range}`.text())
    .split("\n")
    .filter(Boolean);
  const packageDiff = files.includes("package.json")
    ? await $`git diff ${range} -- package.json`.text()
    : "";
  console.log(`code=${mustRun(files, packageDiff)}`);
}
