import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-scroll-area--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("fits"));
  await expect(root).toMatchAriaSnapshot(`
    - region "Notes":
      - paragraph: Line 1
      - paragraph: Line 2
  `);
});

test("the region is named by its label", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("region", { name: "Release notes" })).toHaveCount(
    1,
  );
});

test("an overflowing region without focusable content takes a tab stop", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.locator("#area")).toHaveAttribute("tabindex", "0");
});

test("a region that fits is not a tab stop", async ({ page }) => {
  await gotoStory(page, story("fits"));
  await expect(page.locator("#area")).not.toHaveAttribute("tabindex");
});

test("a region with focusable content is not a tab stop itself", async ({
  page,
}) => {
  await gotoStory(page, story("with-controls"));
  await expect(page.locator("#area")).not.toHaveAttribute("tabindex");
});

test("content added later adds the tab stop", async ({ page }) => {
  await gotoStory(page, story("updates"));
  await expect(page.locator("#area")).toHaveAttribute("tabindex", "0");
});

test("the keyboard scrolls the focused region", async ({ page }) => {
  await gotoStory(page, story("default"));
  const area = page.locator("#area");
  await area.focus();
  await page.keyboard.press("PageDown");
  await expect
    .poll(() => area.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      area.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop),
    )
    .toBeLessThan(2);
});

test("scrolling is native and the content is not moved by a transform", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const area = page.locator("#area");
  await area.evaluate((el) => (el.scrollTop = 100));
  const state = await area.evaluate((el) => {
    const content = el.shadowRoot!.querySelector("[part=content]")!;
    return {
      overflowY: getComputedStyle(el).overflowY,
      transform: getComputedStyle(content).transform,
      top: el.scrollTop,
    };
  });
  expect(state).toEqual({ overflowY: "auto", transform: "none", top: 100 });
});

test("the scrollbar is thin", async ({ page }) => {
  await gotoStory(page, story("default"));
  expect(
    await page
      .locator("#area")
      .evaluate((el) => getComputedStyle(el).scrollbarWidth),
  ).toBe("thin");
});

test("a horizontal region scrolls sideways only", async ({ page }) => {
  await gotoStory(page, story("horizontal"));
  const style = await page.locator("#area").evaluate((el) => {
    const { overflowX, overflowY } = getComputedStyle(el);
    return { overflowX, overflowY, scrolls: el.scrollWidth > el.clientWidth };
  });
  expect(style).toEqual({
    overflowX: "auto",
    overflowY: "hidden",
    scrolls: true,
  });
});

test("the focused region shows a ring", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(page.locator("#area")).toBeFocused();
  expect(
    await page
      .locator("#area")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});

test("a region scrolls under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const area = page.locator("#area");
  await area.evaluate((el) => (el.scrollTop = 60));
  expect(await area.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});

test("a region without a label has no region role", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("pl-scroll-area");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare")).not.toHaveAttribute("role");
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the region", async ({ page }) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("region");
  expect(spoken).toContain("Release notes");
});
