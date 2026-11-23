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
          events: [{ name: "pl-change" }, { name: "name" }],
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

test("public attributes become props and events become on<event> props", () => {
  expect(types).toContain(
    '"pl-select": PlElement<PlSelect, "value" | "disabled", "pl-change">;',
  );
  expect(types).not.toContain("_labelled");
  expect(types).toContain(
    "[K in V as `on${K}`]?: (event: CustomEvent) => void;",
  );
});

test("an element with no attributes or events gets never", () => {
  expect(types).toContain('"pl-option": PlElement<PlOption, never, never>;');
});

test("the types extend React's JSX namespace", () => {
  expect(types).toContain('declare module "react" {');
  expect(types).toContain("interface IntrinsicElements {");
});
