import { expect, test } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = "foundations-localization--swedish";

test("components inside a registered lang use its text", async ({ page }) => {
  await gotoStory(page, story);
  await expect(page.getByRole("button", { name: "Stäng" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Frukt, visa alternativ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Sidnumrering" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Nästa sida" })).toBeVisible();
});

test("a component inside another one's shadow root reads the outer lang", async ({
  page,
}) => {
  await gotoStory(page, story);
  await page.getByRole("button", { name: "Välj datum" }).click();
  await expect(page.getByRole("dialog", { name: "Välj datum" })).toBeVisible();
  // The calendar is slotted into the popover, so it is found from the page.
  await expect(
    page.getByRole("button", { name: "Föregående månad" }),
  ).toBeVisible();
});

test("an attribute wins over the registered text", async ({ page }) => {
  await gotoStory(page, story);
  await page
    .locator("pl-banner")
    .evaluate((el) => el.setAttribute("close-label", "Avfärda"));
  await expect(page.getByRole("button", { name: "Avfärda" })).toBeVisible();
});

test("outside the registered lang the text stays English", async ({ page }) => {
  await gotoStory(page, story);
  await page
    .locator("[lang=sv]")
    .evaluate((el) => el.setAttribute("lang", "de"));
  // The text is read at render, so the banner renders again to pick up the change.
  await page
    .locator("pl-banner")
    .evaluate((el) =>
      (el as unknown as { requestUpdate(): void }).requestUpdate(),
    );
  await expect(page.getByRole("button", { name: "Dismiss" })).toBeVisible();
});
