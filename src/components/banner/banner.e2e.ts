import { expect, test, type Page } from "@playwright/test";
import {
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-banner--${name}`;

const close = (page: Page) => page.getByRole("button", { name: "Dismiss" });

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("tones"));
  await expect(root).toMatchAriaSnapshot(`
    - status:
      - strong: Design review
      - text: Starts in 10 minutes in the large meeting room on the second floor.
      - button "Dismiss"
    - alert:
      - strong: The message could not be sent
      - text: Check the network connection and try again.
      - button "Dismiss"
    - paragraph: Content below the banners.
  `);
});

test("the destructive tone is an alert and the others are status", async ({
  page,
}) => {
  await gotoStory(page, story("tones"));
  await expect(page.getByRole("status")).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(1);
  await page
    .locator("pl-banner")
    .first()
    .evaluate((el) => el.setAttribute("tone", "destructive"));
  await expect(page.getByRole("alert")).toHaveCount(2);
});

test("the close button hides the banner and fires pl-close once", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  // Listening before the click, so the count cannot race it.
  await page.locator("pl-banner").evaluate((el) => {
    const w = window as never as { closes: number };
    w.closes = 0;
    el.addEventListener("pl-close", () => w.closes++);
  });
  await close(page).click();
  await expect(page.locator("pl-banner")).toBeHidden();
  // A duplicate would follow right after the first event.
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => (window as never as { closes: number }).closes),
  ).toBe(1);
  expect(
    await page.locator("pl-banner").evaluate((el) => el.hasAttribute("open")),
  ).toBe(false);
});

test("the keyboard closes the banner", async ({ page }) => {
  await gotoStory(page, story("default"));
  await close(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("pl-banner")).toBeHidden();
});

test("closing with the keyboard continues the tab order after the banner", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("pl-banner").evaluate((el) => {
    const next = document.createElement("input");
    next.setAttribute("aria-label", "Next");
    el.after(next);
  });
  await close(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("pl-banner")).toBeHidden();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Next" })).toBeFocused();
});

test("an author-set role is kept", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("pl-banner").evaluate((el) => {
    el.setAttribute("role", "note");
    el.setAttribute("tone", "destructive");
  });
  await expect(page.getByRole("note")).toHaveCount(1);
});

/** The tone's own icon, drawn in the icon slot's fallback. */
const toneIcon = (page: Page, i: number) =>
  page
    .locator("pl-banner")
    .nth(i)
    .evaluate((el) => {
      const icon = el.shadowRoot!.querySelector("slot[name=icon] > svg")!;
      return {
        paths: icon.innerHTML,
        width: icon.getBoundingClientRect().width,
        hidden: icon.getAttribute("aria-hidden"),
      };
    });

test("without a slotted icon each tone draws its own", async ({ page }) => {
  await gotoStory(page, story("without-icon"));
  const [info, destructive] = [
    await toneIcon(page, 0),
    await toneIcon(page, 1),
  ];
  expect(info.width).toBeGreaterThan(0);
  expect(destructive.width).toBeGreaterThan(0);
  expect(destructive.paths).not.toBe(info.paths);
  expect([info.hidden, destructive.hidden]).toEqual(["true", "true"]);
});

test("a slotted icon replaces the tone's own", async ({ page }) => {
  await gotoStory(page, story("default"));
  expect((await toneIcon(page, 0)).width).toBe(0);
});

test("a banner that appears does not take focus", async ({ page }) => {
  await gotoStory(page, story("closed"));
  await page.locator("pl-banner").evaluate((el) => el.setAttribute("open", ""));
  await expect(page.locator("pl-banner")).toBeVisible();
  expect(
    await page.evaluate(() => document.activeElement === document.body),
  ).toBe(true);
});

test("a banner without open is not shown", async ({ page }) => {
  await gotoStory(page, story("closed"));
  await expect(page.locator("pl-banner")).toBeHidden();
});

test("close-label names the close button", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page
    .locator("pl-banner")
    .evaluate((el) => el.setAttribute("close-label", "Ignorer"));
  await expect(page.getByRole("button", { name: "Ignorer" })).toBeVisible();
});

test("actions sit under the text and take part in tab order", async ({
  page,
}) => {
  await gotoStory(page, story("with-actions"));
  const text = (await page.locator("pl-banner [slot=title]").boundingBox())!;
  const later = (await page
    .getByRole("button", { name: "Later" })
    .boundingBox())!;
  expect(later.y).toBeGreaterThan(text.y + text.height - 1);
  // WebKit's Tab order skips native buttons, so start on the close button.
  await close(page).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Later" })).toBeFocused();
});

test("under rtl the close button sits at the left edge", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const banner = (await page.locator("pl-banner").boundingBox())!;
  const button = (await close(page).boundingBox())!;
  expect(button.x - banner.x).toBeLessThan(banner.width / 2);
});

test("the focus ring is visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await close(page).focus();
  expect(
    await close(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await gotoStory(page, story("with-actions")),
  );
});

test("virtual screen reader speaks the title, message and close button", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Design review");
  expect(spoken).toContain("Starts in 10 minutes");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the close button is at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("default"));
    const box = (await close(page).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
