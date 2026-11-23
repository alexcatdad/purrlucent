import { expect, test } from "bun:test";
import { reactTypes } from "./react-types.ts";

const types = reactTypes({
  modules: [
    {
      path: "src/components/select/select.ts",
      declarations: [
        {
          name: "PurrSelect",
          tagName: "purr-select",
          attributes: [
            { fieldName: "value" },
            { fieldName: "disabled" },
            { fieldName: "_labelled" },
          ],
          events: [
            { name: "purr-change", type: { text: "CustomEvent" } },
            {
              name: "purr-change",
              type: { text: "CustomEvent<{ value: string }>" },
            },
            { name: "purr-input" },
            { name: "name" },
          ],
        },
        { name: "PurrOption", tagName: "purr-option" },
        { name: "helper" },
      ],
    },
  ],
});

test("each element imports its class from the emitted declarations", () => {
  expect(types).toContain(
    'import type { PurrSelect } from "./types/components/select/select.js";',
  );
  expect(types).toContain(
    'import type { PurrOption } from "./types/components/select/select.js";',
  );
  expect(types).not.toContain("helper");
});

test("public attributes become props and typed events become on<event> props", () => {
  expect(types).toContain(
    '"purr-select": PurrElement<PurrSelect, "value" | "disabled", { "purr-change": CustomEvent<{ value: string }>; "purr-input": CustomEvent }>;',
  );
  expect(types).not.toContain("_labelled");
  expect(types).toContain(
    "[K in keyof V as `on${K & string}`]?: (event: V[K]) => void;",
  );
});

test("an element with no attributes or events gets none", () => {
  expect(types).toContain('"purr-option": PurrElement<PurrOption, never, {}>;');
});

test("the types extend React's JSX namespace", () => {
  expect(types).toContain('declare module "react" {');
  expect(types).toContain("interface IntrinsicElements {");
});
