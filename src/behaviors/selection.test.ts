import { expect, test } from "bun:test";
import { SelectionController } from "./selection.ts";

function setup(opts: { mode: "single" | "multiple"; required: boolean }) {
  const host = Object.assign(new EventTarget(), {
    addController() {},
    requestUpdate() {},
  });
  const events: string[][] = [];
  host.addEventListener("pl-change", (e) =>
    events.push((e as CustomEvent<{ selected: string[] }>).detail.selected),
  );
  const controller = new SelectionController<string>(
    host as unknown as ConstructorParameters<typeof SelectionController>[0],
    opts,
  );
  return { controller, events };
}

test("single selection replaces the previous value", () => {
  const { controller } = setup({ mode: "single", required: false });
  controller.select("a");
  controller.select("b");
  expect([...controller.selected]).toEqual(["b"]);
});

test("multiple selection accumulates and toggles", () => {
  const { controller } = setup({ mode: "multiple", required: false });
  controller.select("a");
  controller.toggle("b");
  expect([...controller.selected]).toEqual(["a", "b"]);
  controller.toggle("a");
  expect([...controller.selected]).toEqual(["b"]);
});

test("required refuses to empty the selection", () => {
  const single = setup({ mode: "single", required: true });
  single.controller.select("a");
  single.controller.toggle("a");
  expect([...single.controller.selected]).toEqual(["a"]);
  const multi = setup({ mode: "multiple", required: true });
  multi.controller.select("a");
  multi.controller.toggle("a");
  expect([...multi.controller.selected]).toEqual(["a"]);
});

test("not required single toggle can empty the selection", () => {
  const { controller } = setup({ mode: "single", required: false });
  controller.select("a");
  controller.toggle("a");
  expect(controller.selected.size).toBe(0);
});

test("pl-change fires once per change", () => {
  const { controller, events } = setup({ mode: "single", required: true });
  controller.select("a");
  controller.select("a");
  controller.toggle("a");
  controller.select("b");
  expect(events).toEqual([["a"], ["b"]]);
});
