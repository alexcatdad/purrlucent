import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-spinner--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("sizes"));
  await expect(root).toMatchAriaSnapshot(`
    - progressbar "Loading md"
    - progressbar "Loading lg"
    - progressbar "Loading xl"
  `);
});

test("sizes grow from md to xl", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  const widths: number[] = [];
  for (const size of ["md", "lg", "xl"]) {
    widths.push(
      (await page
        .getByRole("progressbar", { name: `Loading ${size}` })
        .boundingBox())!.width,
    );
  }
  expect(widths[0]).toBeLessThan(widths[1]!);
  expect(widths[1]).toBeLessThan(widths[2]!);
});

test("it turns with motion allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoStory(page, story("default"));
  const ring = page.locator("#spinner").locator(".arc");
  await expect(ring).toHaveCSS("animation-name", "purr-spinner-turn");
  const angle = () => ring.evaluate((el) => getComputedStyle(el).rotate);
  const first = await angle();
  await page.waitForTimeout(200);
  expect(await angle()).not.toBe(first);
});

test("under reduced motion it does not turn and still shows a partial ring", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  const ring = page.locator("#spinner").locator(".arc");
  await expect(ring).toHaveCSS("animation-duration", "0s");
  const dash = await page
    .locator("#spinner")
    .locator(".arc")
    .evaluate((el) => getComputedStyle(el).strokeDasharray);
  expect(dash).toMatch(/28/);
  await expect(page.locator("#spinner").locator(".track")).toBeVisible();
});

test("the ring keeps system colors under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const stroke = await page
    .locator("#spinner")
    .locator(".arc")
    .evaluate((el) => getComputedStyle(el).stroke);
  expect(stroke).not.toBe("none");
});

for (const name of ["default", "sizes", "glass"]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("a spinner without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-spinner");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare")).toHaveAttribute("role", "progressbar");
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

test("virtual screen reader speaks the role and name", async ({ page }) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("progressbar");
  expect(spoken).toContain("Loading");
});
