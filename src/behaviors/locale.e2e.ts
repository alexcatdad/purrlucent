import { expect, test, type Page } from "@playwright/test";
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

const setLang = (page: Page, lang: string) =>
  page
    .locator("#lang")
    .evaluate((el, lang) => el.setAttribute("lang", lang), lang);

/** The checkbox's required message, read through its ElementInternals. */
const requiredMessage = (page: Page) =>
  page
    .locator("#terms")
    .evaluate(
      (el) =>
        (el as unknown as { pressable: { internals: ElementInternals } })
          .pressable.internals.validationMessage,
    );

test("changing lang at runtime updates the components on the page", async ({
  page,
}) => {
  await gotoStory(page, story);
  await setLang(page, "en");
  await expect(page.getByRole("button", { name: "Dismiss" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Pagination" }),
  ).toBeVisible();
  await setLang(page, "sv");
  await expect(page.getByRole("button", { name: "Stäng" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Sidnumrering" }),
  ).toBeVisible();
});

test("changing lang on the document element updates them too", async ({
  page,
}) => {
  await gotoStory(page, story);
  await page.locator("#lang").evaluate((el) => el.removeAttribute("lang"));
  await page.evaluate(() => (document.documentElement.lang = "sv"));
  await expect(page.getByRole("button", { name: "Stäng" })).toBeVisible();
  await page.evaluate(() => (document.documentElement.lang = "en"));
  await expect(page.getByRole("button", { name: "Dismiss" })).toBeVisible();
});

test("the required message follows a change of lang", async ({ page }) => {
  await gotoStory(page, story);
  await expect
    .poll(() => requiredMessage(page))
    .toBe("Markera rutan för att fortsätta.");
  await setLang(page, "en");
  await expect
    .poll(() => requiredMessage(page))
    .not.toBe("Markera rutan för att fortsätta.");
});

test("setMessages after render updates the components in that lang", async ({
  page,
}) => {
  await gotoStory(page, story);
  await setLang(page, "de");
  await expect(page.getByRole("button", { name: "Dismiss" })).toBeVisible();
  await page.locator("#add-german").click();
  await expect(page.getByRole("button", { name: "Schließen" })).toBeVisible();
});
