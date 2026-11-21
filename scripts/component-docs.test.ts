import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { componentDocs, currentDocs, PAGE } from "./component-docs.ts";

test("one section per component folder, one entry per element", () => {
  const page = componentDocs({
    modules: [
      {
        path: "src/components/toggle-group/toggle-group.ts",
        declarations: [
          {
            name: "PurrToggleGroup",
            tagName: "purr-toggle-group",
            description: "A row of\nitems.",
            attributes: [
              { name: "size", type: { text: '"md" | "lg"' }, default: '"md"' },
            ],
            slots: [{ name: "", description: "The items." }],
            events: [{ name: "purr-change", description: "Changed." }],
          },
          { name: "helper" },
        ],
      },
      { path: "src/behaviors/pressable.ts", declarations: [{ name: "x" }] },
    ],
  });
  expect(page).toContain(
    '## Toggle group\n\n```ts\nimport "purrlucent/toggle-group";',
  );
  expect(page).toContain("### `<purr-toggle-group>`\n\nA row of items.");
  expect(page).toContain('| `size` | `"md" \\| "lg"` | `"md"` |  |');
  expect(page).toContain("- default: The items.");
  expect(page).toContain("- `purr-change`: Changed.");
  expect(page).not.toContain("pressable");
});

test("the committed docs/components.md is up to date", async () => {
  expect(readFileSync(PAGE, "utf8")).toBe(await currentDocs());
}, 60_000);
