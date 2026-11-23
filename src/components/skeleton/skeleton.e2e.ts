import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-skeleton--${name}`;

test("aria snapshot of the loading region has no placeholders", async ({
  page,
}) => {
  const root = await gotoStory(page, story("loading-region"));
  await expect(root).toMatchAriaSnapshot(`
    - region "Profile"
  `);
});

test("a placeholder takes up space before content arrives", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const box = (await page.locator("#skeleton").boundingBox())!;
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
});

test("a placeholder is hidden from assistive technology and the region is busy", async ({
  page,
}) => {
  await gotoStory(page, story("loading-region"));
  await expect(page.locator("#region")).toHaveAttribute("aria-busy", "true");
  const skeletons = page.locator("#region pl-skeleton");
  await expect(skeletons).toHaveCount(3);
  for (const skeleton of await skeletons.all())
    await expect(skeleton).toHaveAttribute("aria-hidden", "true");
});

test("the circle shape is round and the rect shape is not", async ({
  page,
}) => {
  await gotoStory(page, story("shapes"));
  const circle = page.locator("#circle");
  const box = (await circle.boundingBox())!;
  expect(box.width).toBeCloseTo(box.height, 0);
  const radius = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(await radius("circle")).not.toBe(await radius("rect"));
});

test("the shimmer sweeps with motion allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoStory(page, story("shimmer"));
  const skeleton = page.locator("#skeleton");
  await expect(skeleton).toHaveCSS("animation-name", "pl-skeleton-sweep");
  const position = () =>
    skeleton.evaluate((el) => getComputedStyle(el).backgroundPositionX);
  const first = await position();
  await page.waitForTimeout(300);
  expect(await position()).not.toBe(first);
});

test("under reduced motion the shimmer stops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("shimmer"));
  const skeleton = page.locator("#skeleton");
  await expect(skeleton).toHaveCSS("animation-name", "none");
  await expect(skeleton).toHaveCSS("background-image", "none");
});

test("the shimmer is mirrored under rtl", async ({ page }) => {
  await gotoStory(page, story("shimmer"));
  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  await expect(page.locator("#skeleton")).toHaveCSS(
    "animation-direction",
    "reverse",
  );
});

test("the placeholder keeps a visible border under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("shimmer"));
  await page.emulateMedia({ forcedColors: "active" });
  const style = await page
    .locator("#skeleton")
    .evaluate((el) => getComputedStyle(el).borderTopStyle);
  expect(style).toBe("solid");
});

test("a loading region and its loaded content pass axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("loading-region")));
  await expectAccessible(await gotoStory(page, story("loaded")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await gotoStory(page, story("loading-region")),
  );
});

test("virtual screen reader speaks the region name", async ({ page }) => {
  await gotoStory(page, story("loading-region"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Profile");
});
