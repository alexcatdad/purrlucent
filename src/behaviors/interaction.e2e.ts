import { expect, test } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = "behaviors-interaction--default";

// Review Focus 5: a tablet in landscape is wide but still touch.
test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer on a wide screen keeps the hit area at 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story);
    expect(
      await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ).toBe(true);
    const box = await page.locator("#host").boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// Review Focus 3: Windows High Contrast must not strip the focus ring.
test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, story);
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);
  await page.keyboard.press("Tab");
  const host = page.locator("#host");
  await expect(host).toBeFocused();
  const ring = await host.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(ring.style).not.toBe("none");
  expect(ring.width).toBeGreaterThan(0);
});

test("the pressed state is visible while the pointer is down", async ({
  page,
}) => {
  await gotoStory(page, story);
  const host = page.locator("#host");
  const opacity = () => host.evaluate((el) => getComputedStyle(el).opacity);
  await host.hover();
  const resting = await opacity();
  await page.mouse.down();
  expect(await opacity()).not.toBe(resting);
  await page.mouse.up();
  expect(await opacity()).toBe(resting);
});
