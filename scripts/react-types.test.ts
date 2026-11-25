import { expect, test } from "bun:test";
import { reactTypes } from "./react-types.ts";

const types = reactTypes({
  modules: [
    {
      path: "src/components/select/select.ts",
      declarations: [
        {
          name: "PlSelect",
          tagName: "pl-select",
          attributes: [
            { fieldName: "value" },
            { fieldName: "disabled" },
            { fieldName: "_labelled" },
          ],
          members: [
            { kind: "field", name: "value" },
            { kind: "field", name: "options" },
            { kind: "field", name: "form", readonly: true },
            { kind: "field", name: "formAssociated", static: true },
            { kind: "field", name: "internal", privacy: "private" },
            { kind: "method", name: "show" },
          ],
          events: [
            { name: "pl-change", type: { text: "CustomEvent" } },
            {
              name: "pl-change",
              type: { text: "CustomEvent<{ value: string }>" },
            },
            { name: "pl-input" },
            { name: "name" },
          ],
        },
        { name: "PlOption", tagName: "pl-option" },
        { name: "helper" },
      ],
    },
  ],
});

test("each element imports its class from the emitted declarations", () => {
  expect(types).toContain(
    'import type { PlSelect } from "./types/components/select/select.js";',
  );
  expect(types).toContain(
    'import type { PlOption } from "./types/components/select/select.js";',
  );
  expect(types).not.toContain("helper");
});

test("public attributes and writable property-only fields become props, and typed events become on<event> props", () => {
  expect(types).toContain(
    '"pl-select": PlElement<PlSelect, "value" | "disabled" | "options", { "pl-change": CustomEvent<{ value: string }>; "pl-input": CustomEvent }>;',
  );
  expect(types).not.toContain("_labelled");
  expect(types).toContain(
    "[K in keyof V as `on${K & string}`]?: (event: V[K]) => void;",
  );
});

test("an element with no attributes or events gets none", () => {
  expect(types).toContain('"pl-option": PlElement<PlOption, never, {}>;');
});

test("the types extend React's JSX namespace", () => {
  expect(types).toContain('declare module "react" {');
  expect(types).toContain("interface IntrinsicElements {");
});
