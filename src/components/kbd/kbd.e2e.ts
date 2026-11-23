import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `text-kbd--${name}`;

test("aria snapshot: the key text is plain text", async ({ page }) => {
  const root = await gotoStory(page, story("shortcut"));
  await expect(root).toMatchAriaSnapshot(`
    - text: ⌃⌥⇧⌘K ⌘S Esc
  `);
});

// The text stays in the light DOM; the kbd element holds the slot it shows in.
test("it renders a kbd element with the slotted text", async ({ page }) => {
  await gotoStory(page, story("default"));
  const key = page.locator("#key");
  await expect(key.locator("kbd slot")).toHaveCount(1);
  await expect(key).toHaveText("⌘K");
});

test("a shortcut keeps modifiers in the order Control, Option, Shift, Command", async ({
  page,
}) => {
  await gotoStory(page, story("shortcut"));
  const text = await page.locator("#shortcut").textContent();
  expect(text?.trim()).toBe("⌃⌥⇧⌘K");
});

test("it takes no focus", async ({ page }) => {
  await gotoStory(page, story("separate-keys"));
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(
    () => document.activeElement?.localName ?? "",
  );
  expect(focused).not.toBe("pl-kbd");
  expect(
    await page
      .locator("pl-kbd")
      .first()
      .evaluate((el) => el.hasAttribute("tabindex")),
  ).toBe(false);
});

test("a single glyph is at least as wide as it is tall", async ({ page }) => {
  await gotoStory(page, story("separate-keys"));
  const box = (await page.locator("pl-kbd").first().boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(box.height - 0.5);
});

test("under rtl the key keeps its own text order", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  await expect(page.locator("#key")).toHaveText("⌘K");
});

test("kbd rtl reads ⌘K", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const key = page.locator("#key");
  expect(
    await key.locator("kbd").evaluate((el) => getComputedStyle(el).direction),
  ).toBe("ltr");
  // ⌘ is drawn left of K.
  const [command, letter] = await key.evaluate((el) => {
    const text = el.firstChild as Text;
    const left = (at: number) => {
      const range = document.createRange();
      range.setStart(text, at);
      range.setEnd(text, at + 1);
      return range.getBoundingClientRect().left;
    };
    return [left(0), left(1)];
  });
  expect(command).toBeLessThan(letter!);
});

test("the keycap keeps its edge under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const width = await page
    .locator("#key")
    .locator("kbd")
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(width).not.toBe("0px");
});

test("it passes axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("shortcut")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("shortcut")));
});

test("virtual screen reader speaks the key text", async ({ page }) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("⌘K");
});
