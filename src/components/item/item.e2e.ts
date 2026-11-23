import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-item--${name}`;

test("aria snapshot of a link row", async ({ page }) => {
  const root = await gotoStory(page, story("link"));
  await expect(root).toMatchAriaSnapshot(`
    - link "Quarterly report":
      - /url: "#report"
    - text: Edited yesterday
    - button "Share"
  `);
});

test("has no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("link")));
});

test("without an href there is no link", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByText("Quarterly report")).toBeVisible();
});

test("a click anywhere on the row follows the link", async ({ page }) => {
  await gotoStory(page, story("link"));
  const box = (await page.locator("pl-item").boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 4);
  expect(new URL(page.url()).hash).toBe("#report");
});

test("a link row has one tab stop for the link and one for the button", async ({
  page,
}) => {
  await gotoStory(page, story("link"));
  await page.getByRole("link").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Share" })).toBeFocused();
});

test("clicking the button does not follow the link", async ({ page }) => {
  await gotoStory(page, story("link"));
  await page.getByRole("button", { name: "Share" }).click();
  expect(new URL(page.url()).hash).toBe("");
});

test("Enter on the link follows it", async ({ page }) => {
  await gotoStory(page, story("link"));
  await page.getByRole("link").focus();
  await page.keyboard.press("Enter");
  expect(new URL(page.url()).hash).toBe("#report");
});

test("the focus ring is visible on the row, also under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("link"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("link").focus();
  const style = await page.locator("pl-item").evaluate((el) => {
    const a = el.shadowRoot!.querySelector("a")!;
    return getComputedStyle(a, "::after").outlineStyle;
  });
  expect(style).not.toBe("none");
});

test("the row is at least the minimum target height", async ({ page }) => {
  await gotoStory(page, story("title-only"));
  const box = (await page.locator("pl-item").boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("the media sits before the text and the actions after it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const media = (await page.locator("svg[slot=media]").boundingBox())!;
  const text = (await page.locator("[slot=title]").boundingBox())!;
  const action = (await page.getByRole("button").boundingBox())!;
  expect(media.x).toBeLessThan(text.x);
  expect(action.x).toBeGreaterThan(text.x);
});

test("under rtl the media sits at the right edge", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const item = (await page.locator("pl-item").boundingBox())!;
  const media = (await page.locator("svg[slot=media]").boundingBox())!;
  expect(media.x - item.x).toBeGreaterThan(item.width / 2);
});

test("a role set on the row is kept", async ({ page }) => {
  await gotoStory(page, story("list"));
  await expect(page.getByRole("listitem")).toHaveCount(3);
});

test("the row stays solid under glass", async ({ page }) => {
  await gotoStory(page, story("glass"));
  expect(
    await page
      .locator("pl-item")
      .evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toBe("none");
});

test("long text wraps without horizontal overflow at 200% text zoom", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("long-text")));
});

test("virtual screen reader speaks the title and description", async ({
  page,
}) => {
  await gotoStory(page, story("link"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Quarterly report");
  expect(spoken).toContain("Edited yesterday");
});
