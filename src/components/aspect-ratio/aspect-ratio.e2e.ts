import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `containers-aspect-ratio--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - img "Cat on a sofa"
  `);
});

test("the box keeps its ratio at any width", async ({ page }) => {
  await gotoStory(page, story("ratios"));
  const sizes = await page.locator("pl-aspect-ratio").evaluateAll((els) =>
    els.map((el) => {
      const { width, height } = el.getBoundingClientRect();
      return [el.getAttribute("ratio"), width / height] as const;
    }),
  );
  for (const [ratio, actual] of sizes) {
    const [w, h = "1"] = ratio!.split("/");
    expect(actual).toBeCloseTo(Number(w) / Number(h), 1);
  }
  await page.setViewportSize({ width: 320, height: 640 });
  const box = await page.locator("pl-aspect-ratio").nth(2).boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
});

test("slotted media fills the box", async ({ page }) => {
  await gotoStory(page, story("default"));
  const { host, media } = await page.locator("#box").evaluate((el) => ({
    host: el.getBoundingClientRect().toJSON(),
    media: el.firstElementChild!.getBoundingClientRect().toJSON(),
  }));
  expect(media.width).toBeCloseTo(host.width, 0);
  expect(media.height).toBeCloseTo(host.height, 0);
});

test("a changing ratio resizes the box and a bad one falls back to 1", async ({
  page,
}) => {
  await gotoStory(page, story("updates"));
  const box = page.locator("#box");
  const shape = () =>
    box.evaluate((el) => {
      const { width, height } = el.getBoundingClientRect();
      return width / height;
    });
  expect(await shape()).toBeCloseTo(2, 1);
  await box.evaluate(
    (el) => ((el as HTMLElement & { ratio: string }).ratio = "4/3"),
  );
  await expect.poll(shape).toBeCloseTo(4 / 3, 1);
  await box.evaluate(
    (el) => ((el as HTMLElement & { ratio: string }).ratio = "wide"),
  );
  await expect.poll(shape).toBeCloseTo(1, 1);
});

test("the box keeps its ratio under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const { width, height } = (await page
    .locator("pl-aspect-ratio")
    .boundingBox())!;
  expect(width / height).toBeCloseTo(16 / 9, 1);
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("ratios")));
});

test("virtual screen reader speaks the media", async ({ page }) => {
  await gotoStory(page, story("default"));
  expect((await spokenPhrases(page)).join(" | ")).toContain("Cat on a sofa");
});
