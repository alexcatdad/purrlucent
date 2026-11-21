import { beforeEach, expect, test } from "bun:test";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { PressableController } from "./pressable.ts";

// bun has no DOM. This host stands in for a custom element: events fired on it
// are then fired on its document too, the way a real pointer event bubbles.
class FakeHost extends EventTarget {
  ownerDocument = new EventTarget();
  states = new Set<string>();
  controllers: ReactiveController[] = [];
  addController(controller: ReactiveController) {
    this.controllers.push(controller);
  }
  attachInternals() {
    return { states: this.states };
  }
  requestUpdate() {}
}

let host: FakeHost;
let disabled: boolean;
let presses: number;

beforeEach(() => {
  host = new FakeHost();
  disabled = false;
  presses = 0;
  const controller = new PressableController(
    host as unknown as ReactiveControllerHost & HTMLElement,
    { disabled: () => disabled },
  );
  controller.hostConnected();
  host.addEventListener("purr-press", () => presses++);
});

const key = (type: "keydown" | "keyup", value: string) =>
  host.dispatchEvent(Object.assign(new Event(type), { key: value }));
const pointer = (type: string, inside = true) => {
  const event = new Event(type);
  if (inside) host.dispatchEvent(event);
  host.ownerDocument.dispatchEvent(new Event(type));
};

test("Enter fires purr-press once", () => {
  key("keydown", "Enter");
  expect(presses).toBe(1);
});

test("Space fires purr-press once", () => {
  key("keydown", " ");
  key("keyup", " ");
  expect(presses).toBe(1);
});

test("disabled hosts fire nothing", () => {
  disabled = true;
  key("keydown", "Enter");
  key("keydown", " ");
  key("keyup", " ");
  pointer("pointerdown");
  pointer("pointerup");
  pointer("click");
  expect(presses).toBe(0);
  expect(host.states.has("pressed")).toBe(false);
});

test("a click fires purr-press", () => {
  pointer("pointerdown");
  pointer("pointerup");
  pointer("click");
  expect(presses).toBe(1);
});

test("pointer-down then pointer-up outside fires nothing", () => {
  pointer("pointerdown");
  pointer("pointerup", false);
  expect(presses).toBe(0);
  expect(host.states.has("pressed")).toBe(false);
});

test("state pressed is set only while the pointer is down", () => {
  expect(host.states.has("pressed")).toBe(false);
  pointer("pointerdown");
  expect(host.states.has("pressed")).toBe(true);
  pointer("pointerup");
  expect(host.states.has("pressed")).toBe(false);
});

test("Space keyup without a keydown on the host fires nothing", () => {
  key("keyup", " ");
  expect(presses).toBe(0);
});

test("Space keyup fires only once per keydown", () => {
  key("keydown", " ");
  key("keyup", " ");
  key("keyup", " ");
  expect(presses).toBe(1);
});

test("Enter and Space from a descendant are ignored", () => {
  const child = new EventTarget();
  for (const [type, value] of [
    ["keydown", "Enter"],
    ["keydown", " "],
    ["keyup", " "],
  ] as const) {
    const event = Object.assign(new Event(type), { key: value });
    Object.defineProperty(event, "target", { value: child });
    host.dispatchEvent(event);
  }
  expect(presses).toBe(0);
});

test("state pressed is set while Space is held", () => {
  key("keydown", " ");
  expect(host.states.has("pressed")).toBe(true);
  key("keyup", " ");
  expect(host.states.has("pressed")).toBe(false);
});

test("blur cancels a held Space", () => {
  key("keydown", " ");
  host.dispatchEvent(new Event("blur"));
  key("keyup", " ");
  expect(presses).toBe(0);
  expect(host.states.has("pressed")).toBe(false);
});

test("a provided ElementInternals is shared, not re-attached", () => {
  const shared = { states: new Set<string>() } as unknown as ElementInternals;
  let attached = 0;
  const other = new FakeHost();
  other.attachInternals = () => {
    attached++;
    return { states: other.states };
  };
  const controller = new PressableController(
    other as unknown as ReactiveControllerHost & HTMLElement,
    { disabled: () => false, internals: shared },
  );
  expect(attached).toBe(0);
  expect(controller.internals).toBe(shared);
});

test("internals defaults to the host's own", () => {
  const controller = host.controllers[0] as PressableController;
  expect(controller.internals.states).toBe(host.states as never);
});
