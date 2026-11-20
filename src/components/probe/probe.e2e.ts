import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "probe--default";

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story);
  await expect(root).toMatchAriaSnapshot(`- text: Probe`);
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story));
});

test("virtual screen reader speaks the default story", async ({ page }) => {
  await gotoStory(page, story);
  expect(await spokenPhrases(page)).toEqual([
    "document",
    "Probe",
    "end of document",
  ]);
});

forEachViewport(({ name, pointer }) => {
  test(`screenshot at ${name}`, async ({ page }) => {
    const root = await gotoStory(page, story);
    expect(
      await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ).toBe(pointer === "coarse");
    await expect(root).toHaveScreenshot(`default-${name}.png`);
  });
});
