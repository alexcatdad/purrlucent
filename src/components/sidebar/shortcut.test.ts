import { expect, test } from "bun:test";
import { matchesShortcut } from "./shortcut.ts";

const press = (key: string, mods: Record<string, boolean> = {}, code = "") => ({
  key,
  code,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

test("mod is Command on Apple platforms and Control elsewhere", () => {
  expect(matchesShortcut(press("b", { metaKey: true }), "mod+b", true)).toBe(
    true,
  );
  expect(matchesShortcut(press("b", { ctrlKey: true }), "mod+b", true)).toBe(
    false,
  );
  expect(matchesShortcut(press("b", { ctrlKey: true }), "mod+b", false)).toBe(
    true,
  );
});

test("modifiers must match exactly", () => {
  expect(matchesShortcut(press("b"), "mod+b", false)).toBe(false);
  expect(
    matchesShortcut(
      press("b", { ctrlKey: true, shiftKey: true }),
      "mod+b",
      false,
    ),
  ).toBe(false);
  expect(
    matchesShortcut(
      press("B", { ctrlKey: true, shiftKey: true }),
      "mod+shift+b",
      false,
    ),
  ).toBe(true);
});

test("a letter matches by position when Option changes the character", () => {
  expect(
    matchesShortcut(press("∫", { altKey: true }, "KeyB"), "alt+b", true),
  ).toBe(true);
});

test("a key alone is a shortcut", () => {
  expect(matchesShortcut(press("\\"), "\\", false)).toBe(true);
});
