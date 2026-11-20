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
  expect(presses).toBe(0);
  expect(host.states.has("pressed")).toBe(false);
});

test("pointer-up inside fires purr-press", () => {
  pointer("pointerdown");
  pointer("pointerup");
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
