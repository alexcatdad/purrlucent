// Copies the agent skill and the docs it reads into dist/skills/purrlucent, so
// the package ships them side by side and their links resolve there.
//
// usage: bun scripts/agent-skill.ts (after vite build)
import { cpSync } from "node:fs";
import { basename } from "node:path";

export const FILES = [
  "skills/purrlucent/SKILL.md",
  "docs/components.md",
  "docs/react.md",
  "docs/install.md",
];

if (import.meta.main)
  for (const file of FILES)
    cpSync(file, `dist/skills/purrlucent/${basename(file)}`);
