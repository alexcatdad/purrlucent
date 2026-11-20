import { afterEach, beforeEach, expect, test } from "bun:test";
import type { ReactiveController, ReactiveControllerHost } from "lit";
import { DismissController } from "./dismiss.ts";

type Host = ReactiveControllerHost & EventTarget;

const realDocument = globalThis.document;
let doc: EventTarget;
let host: Host;
let controller: ReactiveController;
let reasons: string[];
let enabled: boolean;

beforeEach(() => {
  doc = new EventTarget();
  Object.defineProperty(globalThis, "document", {
    value: doc,
    configurable: true,
  });
  reasons = [];
  enabled = true;
  host = Object.assign(new EventTarget(), {
    addController: (c: ReactiveController) => (controller = c),
    removeController: () => {},
    requestUpdate: () => {},
    updateComplete: Promise.resolve(true),
  });
  new DismissController(host as never, {
    onDismiss: (reason) => reasons.push(reason),
    enabled: () => enabled,
  });
  controller.hostConnected?.();
});

afterEach(() => {
  controller.hostDisconnected?.();
  Object.defineProperty(globalThis, "document", {
    value: realDocument,
    configurable: true,
  });
});

const key = (name: string) =>
  doc.dispatchEvent(Object.assign(new Event("keydown"), { key: name }));
const pointerDown = (path: EventTarget[]) =>
  doc.dispatchEvent(
    Object.assign(new Event("pointerdown"), { composedPath: () => path }),
  );

test("Escape calls onDismiss with escape", () => {
  key("Escape");
  expect(reasons).toEqual(["escape"]);
});

test("other keys do not dismiss", () => {
  key("Enter");
  expect(reasons).toEqual([]);
});

test("pointer-down outside calls onDismiss with outside", () => {
  pointerDown([new EventTarget(), doc]);
  expect(reasons).toEqual(["outside"]);
});

test("pointer-down inside does not dismiss", () => {
  pointerDown([new EventTarget(), host, doc]);
  expect(reasons).toEqual([]);
});

test("nothing fires when disabled", () => {
  enabled = false;
  key("Escape");
  pointerDown([doc]);
  expect(reasons).toEqual([]);
});

test("nothing fires after the host disconnects", () => {
  controller.hostDisconnected?.();
  key("Escape");
  pointerDown([doc]);
  expect(reasons).toEqual([]);
});
