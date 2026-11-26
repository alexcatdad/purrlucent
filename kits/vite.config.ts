import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { UserConfig } from "vite";

const root = import.meta.dirname;
const input = readdirSync(root, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() && existsSync(join(root, entry.name, "index.html")),
  )
  .flatMap(({ name }) => {
    const directory = join(root, name);
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => join(directory, entry.name));
  });

export default {
  root,
  base: "./",
  appType: "mpa",
  publicDir: false,
  build: { rolldownOptions: { input } },
} satisfies UserConfig;
