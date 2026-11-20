import { expect, test } from "bun:test";
import { RovingFocusController } from "./roving-focus.ts";

function setup(
  opts: {
    orientation?: "horizontal" | "vertical";
    wrap?: boolean;
    tabStops?: "one" | "all";
  } = {},
  rtl = false,
) {
  const host = Object.assign(new EventTarget(), {
    addController() {},
    requestUpdate() {},
    matches: (selector: string) => selector === ":dir(rtl)" && rtl,
  });
  const items = [0, 1, 2].map(() => ({
    tabIndex: -1,
    focused: false,
    focus() {
      for (const item of items) item.focused = item === this;
    },
  }));
  const controller = new RovingFocusController(
    host as unknown as ConstructorParameters<typeof RovingFocusController>[0],
    {
      items: () => items as unknown as HTMLElement[],
      orientation: opts.orientation ?? "horizontal",
      wrap: opts.wrap ?? false,
      tabStops: opts.tabStops,
    },
  );
  controller.hostConnected();
  const press = (
    from: number,
    key: string,
    mods: Partial<
      Record<"altKey" | "ctrlKey" | "metaKey" | "shiftKey", boolean>
    > = {},
  ) => {
    const event = new Event("keydown", { cancelable: true });
    Object.defineProperty(event, "key", { value: key });
    Object.assign(event, mods);
    Object.defineProperty(event, "target", { value: items[from] });
    host.dispatchEvent(event);
    return event;
  };
  const focused = () => items.findIndex((item) => item.focused);
  return { items, press, focused, controller };
}

test("only the active item has tabindex 0", () => {
  const { items, press } = setup();
  expect(items.map((i) => i.tabIndex)).toEqual([0, -1, -1]);
  press(0, "ArrowRight");
  expect(items.map((i) => i.tabIndex)).toEqual([-1, 0, -1]);
});

test("tabStops all leaves tabindex alone and still moves focus", () => {
  const { items, press, focused } = setup({ tabStops: "all" });
  expect(items.map((i) => i.tabIndex)).toEqual([-1, -1, -1]);
  press(0, "ArrowRight");
  expect(focused()).toBe(1);
  expect(items.map((i) => i.tabIndex)).toEqual([-1, -1, -1]);
});

test("arrow keys move focus in the orientation", () => {
  const h = setup();
  h.press(0, "ArrowRight");
  expect(h.focused()).toBe(1);
  const v = setup({ orientation: "vertical" });
  v.press(0, "ArrowDown");
  expect(v.focused()).toBe(1);
  v.press(0, "ArrowRight");
  expect(v.items[2]!.focused).toBe(false);
});

test("Home and End jump to the first and last item", () => {
  const { press, focused } = setup();
  press(1, "End");
  expect(focused()).toBe(2);
  press(2, "Home");
  expect(focused()).toBe(0);
});

test("wrap on loops past the ends", () => {
  const { press, focused } = setup({ wrap: true });
  press(2, "ArrowRight");
  expect(focused()).toBe(0);
  press(0, "ArrowLeft");
  expect(focused()).toBe(2);
});

test("wrap off stops at the ends", () => {
  const { press, items } = setup({ wrap: false });
  press(2, "ArrowRight");
  press(0, "ArrowLeft");
  expect(items[0]!.tabIndex).toBe(0);
  expect(items[2]!.tabIndex).toBe(-1);
});

test("under rtl, ArrowRight moves to the previous item", () => {
  const { press, focused } = setup({}, true);
  press(1, "ArrowRight");
  expect(focused()).toBe(0);
  press(1, "ArrowLeft");
  expect(focused()).toBe(2);
});

test("the active index is clamped when items shrink", () => {
  const { items, press, controller } = setup();
  press(1, "End");
  expect(items.map((i) => i.tabIndex)).toEqual([-1, -1, 0]);
  items.length = 2;
  controller.hostUpdated();
  expect(items.map((i) => i.tabIndex)).toEqual([-1, 0]);
});

test("Alt, Ctrl and Meta disable the arrow, Home and End keys", () => {
  const { press, focused } = setup();
  for (const mod of ["altKey", "ctrlKey", "metaKey"] as const) {
    for (const key of ["ArrowRight", "End", "Home"]) {
      expect(press(0, key, { [mod]: true }).defaultPrevented).toBe(false);
    }
  }
  expect(focused()).toBe(-1);
});

test("Shift does not disable the keys", () => {
  const { press, focused } = setup();
  press(0, "ArrowRight", { shiftKey: true });
  expect(focused()).toBe(1);
});

test("activate seeds the tab stop without moving focus", () => {
  const { items, controller, focused } = setup();
  controller.activate(2);
  expect(items.map((i) => i.tabIndex)).toEqual([-1, -1, 0]);
  expect(focused()).toBe(-1);
  controller.activate(9);
  expect(items.map((i) => i.tabIndex)).toEqual([-1, -1, 0]);
});

test("handled keys are prevented, others are left alone", () => {
  const { press } = setup();
  expect(press(0, "ArrowRight").defaultPrevented).toBe(true);
  expect(press(0, "a").defaultPrevented).toBe(false);
});
