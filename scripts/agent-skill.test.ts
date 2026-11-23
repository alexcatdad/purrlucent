import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { DOCS, reference } from "./agent-skill.ts";

test.each(DOCS)("the skill's copy of %s matches the docs", (doc) => {
  const stale =
    readFileSync(reference(doc), "utf8") !== readFileSync(doc, "utf8");
  expect(
    stale,
    `${reference(doc)} differs from ${doc}; run bun scripts/agent-skill.ts`,
  ).toBe(false);
});
