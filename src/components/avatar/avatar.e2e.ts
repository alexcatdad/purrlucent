import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-avatar--${name}`;

const shadow = (selector: string) => (el: Element) =>
  el.shadowRoot!.querySelector(selector) !== null;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - img "Ada Lovelace"
  `);
});

test("an image shows and the initials are removed once it loads", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const avatar = page.locator("#avatar");
  await expect(avatar.locator("img")).toBeVisible();
  await expect
    .poll(() => avatar.evaluate(shadow("[part=initials]")))
    .toBe(false);
});

test("without a src the initials of the name show", async ({ page }) => {
  await gotoStory(page, story("initials"));
  const initials = (id: string) =>
    page.locator(`#${id}`).locator("[part=initials]");
  await expect(initials("two")).toHaveText("AL");
  await expect(initials("one")).toHaveText("G");
  await expect(initials("three")).toHaveText("MW");
  await expect(page.locator("#two").locator("img")).toHaveCount(0);
});

test("an image that fails to load falls back to the initials", async ({
  page,
}) => {
  await gotoStory(page, story("fallback"));
  const avatar = page.locator("#avatar");
  await expect(avatar.locator("[part=initials]")).toHaveText("AL");
  await expect(avatar.locator("img")).toHaveCount(0);
});

test("the host carries the name and the initials and picture are hidden", async ({
  page,
}) => {
  await gotoStory(page, story("fallback"));
  const avatar = page.getByRole("img", { name: "Ada Lovelace" });
  await expect(avatar).toHaveAttribute("aria-label", "Ada Lovelace");
  await expect(avatar.locator("[part=initials]")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await gotoStory(page, story("default"));
  await expect(page.locator("#avatar").locator("img")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

test("without a name the avatar has no role and no name", async ({ page }) => {
  await gotoStory(page, story("decorative"));
  const avatar = page.locator("#avatar");
  await expect(avatar).not.toHaveAttribute("role");
  await expect(avatar).not.toHaveAttribute("aria-label");
});

test("sizes grow from sm to xl and stay round", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  const sizes: number[] = [];
  for (const size of ["sm", "md", "lg", "xl"]) {
    const box = (await page.locator(`#${size}`).boundingBox())!;
    expect(box.width).toBeCloseTo(box.height, 0);
    sizes.push(box.width);
  }
  expect(sizes[0]).toBeLessThan(sizes[1]!);
  expect(sizes[1]).toBeLessThan(sizes[2]!);
  expect(sizes[2]).toBeLessThan(sizes[3]!);
});

test("changing the name and src updates the avatar", async ({ page }) => {
  await gotoStory(page, story("fallback"));
  const avatar = page.locator("#avatar");
  await avatar.evaluate((el) => {
    el.setAttribute("name", "Grace Hopper");
    el.removeAttribute("src");
  });
  await expect(avatar.locator("[part=initials]")).toHaveText("GH");
  await expect(avatar).toHaveAttribute("aria-label", "Grace Hopper");
  await avatar.evaluate((el) => el.removeAttribute("name"));
  await expect(avatar.locator("[part=initials]")).toHaveText("");
  await expect(avatar).not.toHaveAttribute("role");
});

test("the avatar keeps a visible border under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("fallback"));
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await page
      .locator("#avatar")
      .evaluate((el) => getComputedStyle(el).borderTopStyle),
  ).toBe("solid");
});

test("the initials meet contrast in the story", async ({ page }) => {
  const root = await gotoStory(page, story("initials"));
  await expectAccessible(root);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

test("virtual screen reader speaks the name once", async ({ page }) => {
  await gotoStory(page, story("fallback"));
  const spoken = await spokenPhrases(page);
  expect(
    spoken.filter((phrase) => phrase.includes("Ada Lovelace")),
  ).not.toEqual([]);
  expect(spoken.join(" | ")).not.toContain("AL");
});
