import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// The browser tests run against the prebuilt storybook-static. A build older
// than the source tests old code and fails for reasons that are not in the
// change, so stop before any test runs.
const newest = (dir: string): number =>
  readdirSync(dir).reduce((latest, name) => {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory())
      return name.endsWith("-snapshots")
        ? latest
        : Math.max(latest, newest(path));
    return /\.(ts|css|mdx?)$/.test(name) && !/\.(e2e|test)\.ts$/.test(name)
      ? Math.max(latest, stat.mtimeMs)
      : latest;
  }, 0);

export default function freshStorybook() {
  const built = "storybook-static/index.json";
  if (!existsSync(built))
    throw new Error(
      "storybook-static is missing. Run: bun run build-storybook",
    );
  if (Math.max(newest("src"), newest(".storybook")) > statSync(built).mtimeMs)
    throw new Error(
      "storybook-static is older than the source. Run: bun run build-storybook",
    );
}
