import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-card--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - strong: Team plan
    - text: Billed every month.
    - button "Edit"
    - text: Five members share this plan. Each member can create projects and invite guests.
    - button "Cancel plan"
    - button "Add member"
  `);
});

test("has no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("a section with nothing in it is hidden", async ({ page }) => {
  await gotoStory(page, story("content-only"));
  const hidden = await page
    .locator("pl-card")
    .evaluate((el) =>
      ["header", "content", "footer"].map(
        (part) =>
          (el.shadowRoot!.querySelector(`[part=${part}]`) as HTMLElement)
            .offsetHeight === 0,
      ),
    );
  expect(hidden).toEqual([true, false, true]);
});

test("a header without content hides the content section", async ({ page }) => {
  await gotoStory(page, story("header-only"));
  const content = await page
    .locator("pl-card")
    .evaluate(
      (el) =>
        (el.shadowRoot!.querySelector("[part=content]") as HTMLElement)
          .offsetHeight,
    );
  expect(content).toBe(0);
});

test("the card is not a tab stop and its controls are", async ({ page }) => {
  await gotoStory(page, story("default"));
  expect(
    await page
      .locator("pl-card")
      .evaluate((el) => el.hasAttribute("tabindex") || el.hasAttribute("role")),
  ).toBe(false);
  await page.getByRole("button", { name: "Edit" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel plan" })).toBeFocused();
});

test("the action sits at the trailing edge of the header", async ({ page }) => {
  await gotoStory(page, story("default"));
  const card = (await page.locator("pl-card").boundingBox())!;
  const edit = (await page
    .getByRole("button", { name: "Edit" })
    .boundingBox())!;
  expect(edit.x).toBeGreaterThan(card.x + card.width / 2);
});

test("under rtl the action sits at the left edge", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const card = (await page.locator("pl-card").boundingBox())!;
  const edit = (await page
    .getByRole("button", { name: "Edit" })
    .boundingBox())!;
  expect(edit.x - card.x).toBeLessThan(card.width / 2);
});

test("the card stays solid under glass", async ({ page }) => {
  await gotoStory(page, story("glass"));
  const style = await page
    .locator("pl-card")
    .evaluate((el) => getComputedStyle(el).backdropFilter);
  expect(style).toBe("none");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the title and content", async ({ page }) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Team plan");
  expect(spoken).toContain("Five members share this plan");
});
