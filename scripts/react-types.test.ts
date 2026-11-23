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
          events: [{ name: "purr-change" }, { name: "name" }],
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

test("public attributes become props and events become on<event> props", () => {
  expect(types).toContain(
    '"purr-select": PurrElement<PurrSelect, "value" | "disabled", "purr-change">;',
  );
  expect(types).not.toContain("_labelled");
  expect(types).toContain(
    "[K in V as `on${K}`]?: (event: CustomEvent) => void;",
  );
});

test("an element with no attributes or events gets never", () => {
  expect(types).toContain(
    '"purr-option": PurrElement<PurrOption, never, never>;',
  );
});

test("the types extend React's JSX namespace", () => {
  expect(types).toContain('declare module "react" {');
  expect(types).toContain("interface IntrinsicElements {");
});
