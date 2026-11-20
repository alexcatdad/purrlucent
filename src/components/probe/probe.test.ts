import { expect, test } from "bun:test";
import { PurrProbe } from "./probe.ts";

test("purr-probe is a registered custom element", () => {
  expect(customElements.get("purr-probe")).toBe(PurrProbe);
});
