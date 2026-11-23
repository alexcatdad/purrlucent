import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-badge--${name}`;

test("aria snapshot: the badge is its text", async ({ page }) => {
  const root = await gotoStory(page, story("variants"));
  await expect(root).toMatchAriaSnapshot(`
    - text: Draft
    - text: New
    - text: Failed
  `);
});

test("each variant says its status in text", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await expect(page.locator("#neutral")).toHaveText("Draft");
  await expect(page.locator("#accent")).toHaveText("New");
  await expect(page.locator("#destructive")).toHaveText("Failed");
});

test("the variants differ in fill", async ({ page }) => {
  await gotoStory(page, story("variants"));
  const fill = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  const fills = [
    await fill("neutral"),
    await fill("accent"),
    await fill("destructive"),
  ];
  expect(new Set(fills).size).toBe(3);
});

test("the text meets 4.5:1 against the fill in every variant", async ({
  page,
}) => {
  await gotoStory(page, story("variants"));
  const ratios = await page.locator("pl-badge").evaluateAll((els) => {
    const channels = (css: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const luminance = ([r, g, b]: number[]) => {
      const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
    };
    return els.map((el) => {
      const style = getComputedStyle(el);
      const a = luminance(channels(style.backgroundColor));
      const b = luminance(channels(style.color));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  });
  for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("it takes no focus", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(
    () => document.activeElement?.localName ?? "",
  );
  expect(focused).not.toBe("pl-badge");
});

test("a one-digit badge is round", async ({ page }) => {
  await gotoStory(page, story("counts"));
  const box = (await page.locator("#one").boundingBox())!;
  expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(2);
  const many = (await page.locator("#many").boundingBox())!;
  expect(many.width).toBeGreaterThan(box.width);
});

test("under rtl the text is still shown", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  await expect(page.locator("#badge")).toHaveText("3");
});

test("the badge keeps an edge under forced colors", async ({ page }) => {
  await gotoStory(page, story("variants"));
  await page.emulateMedia({ forcedColors: "active" });
  const width = await page
    .locator("#destructive")
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(width).not.toBe("0px");
});

test("it passes axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("variants")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("variants")));
});

test("virtual screen reader speaks the badge text", async ({ page }) => {
  await gotoStory(page, story("variants"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Failed");
});
