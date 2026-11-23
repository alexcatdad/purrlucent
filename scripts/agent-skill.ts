// Keeps skills/purrlucent self-contained: the docs it reads are committed as
// copies in references/, and the build copies the whole folder to
// dist/skills/purrlucent. `gh skill install` and `npx skills add` copy only
// that folder.
//
// usage: bun scripts/agent-skill.ts
import { cpSync, copyFileSync } from "node:fs";
import { basename } from "node:path";

export const SKILL = "skills/purrlucent";
export const DOCS = ["docs/components.md", "docs/react.md", "docs/install.md"];
export const reference = (doc: string) =>
  `${SKILL}/references/${basename(doc)}`;

if (import.meta.main) {
  for (const doc of DOCS) copyFileSync(doc, reference(doc));
  cpSync(SKILL, "dist/skills/purrlucent", { recursive: true });
}
