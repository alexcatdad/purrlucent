import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  componentDocs,
  currentDocs,
  PAGE,
  type Manifest,
} from "./component-docs.ts";

test("one section per component folder, one entry per element", () => {
  const page = componentDocs({
    modules: [
      {
        path: "src/components/toggle-group/toggle-group.ts",
        declarations: [
          {
            name: "PlToggleGroup",
            tagName: "pl-toggle-group",
            description: "A row of\nitems.",
            attributes: [
              { name: "size", type: { text: '"md" | "lg"' }, default: '"md"' },
            ],
            slots: [{ name: "", description: "The items." }],
            cssProperties: [{ name: "--pl-gap", description: "The gap." }],
            events: [{ name: "pl-change", description: "Changed." }],
            members: [
              {
                kind: "field",
                name: "selection",
                type: { text: "readonly string[]" },
                description: "The selected options.",
              },
              {
                kind: "field",
                name: "_pending",
                description: "Pending selection.",
              },
              { kind: "field", name: "pressable" },
              { kind: "method", name: "click" },
              {
                kind: "method",
                name: "setSelected",
                parameters: [
                  { name: "item", type: { text: "string" } },
                  { name: "notify", optional: true, type: { text: "boolean" } },
                ],
                return: { type: { text: "void" } },
                description: "Selects an item.",
              },
              { kind: "method", name: "#setState", privacy: "private" },
              { kind: "method", name: "updated", privacy: "protected" },
              { kind: "method", name: "formResetCallback" },
            ],
          },
          { name: "helper" },
        ],
      },
      { path: "src/behaviors/pressable.ts", declarations: [{ name: "x" }] },
    ],
  });
  expect(page).toContain(
    "## Contents\n\n- [Toggle group](#toggle-group): `pl-toggle-group`\n\n",
  );
  expect(page).toContain(
    '## Toggle group\n\n```ts\nimport "purrlucent/toggle-group";',
  );
  expect(page).toContain("### `<pl-toggle-group>`\n\nA row of items.");
  expect(page).toContain('| `size` | `"md" \\| "lg"` | `"md"` |  |');
  expect(page).toContain("- default: The items.");
  expect(page).toContain("**CSS properties**\n\n- `--pl-gap`: The gap.");
  expect(page).toContain("- `pl-change`: Changed.");
  expect(page).toContain(
    "**Properties**\n\n- `selection: readonly string[]` The selected options.",
  );
  expect(page).not.toContain("_pending");
  expect(page).toContain("**Methods**\n\n- `click()`");
  expect(page).toContain(
    "- `setSelected(item: string, notify?: boolean): void` Selects an item.",
  );
  expect(page).not.toContain("#setState");
  expect(page).not.toContain("updated");
  expect(page).not.toContain("formResetCallback");
  expect(page).not.toContain("pressable");
});

test("the generated manifest and committed docs reflect the public component API", async () => {
  const page = await currentDocs();
  const manifest = JSON.parse(
    readFileSync("dist/custom-elements.json", "utf8"),
  ) as Manifest;
  const elements = manifest.modules.flatMap(
    (module) => module.declarations ?? [],
  );
  const carousel = elements.find(
    (element) => element.tagName === "pl-carousel",
  )!;
  expect(carousel.attributes?.map((attribute) => attribute.name)).not.toContain(
    "index",
  );
  const index = carousel.members?.find((member) => member.name === "index");
  expect(index?.kind).toBe("field");
  expect(index?.attribute).toBeUndefined();
  expect(page).toContain("- `index: number` The current page");
  expect(page).toContain("- `rows: PlDataTableRow[]` Data rows");
  const chart = elements.find((element) => element.tagName === "pl-chart")!;
  expect(chart.members?.find((member) => member.name === "data")?.kind).toBe(
    "field",
  );
  expect(chart.attributes?.map((attribute) => attribute.name)).not.toContain(
    "data",
  );
  expect(page).toContain(
    '`import "purrlucent"` loads every component except the chart.',
  );
  expect(page).toContain("- `show()` Opens the drawer modally.");
  expect(page).toContain('- `close(returnValue = "")` Closes the drawer.');
  expect(page).toContain("`PlToaster.show(options: PlToastOptions): PlToast`");
  expect(readFileSync(PAGE, "utf8")).toBe(page);
}, 60_000);
