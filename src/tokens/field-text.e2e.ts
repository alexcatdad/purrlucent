import { expect, test, type Page } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

const fields = [
  ["forms-input--default", "pl-input", "input"],
  ["forms-text-area--default", "pl-textarea", "textarea"],
  ["forms-number-field--default", "pl-number-field", "input"],
  ["forms-combobox--default", "pl-combobox", "input"],
  ["forms-date-picker--default", "pl-date-picker", "input"],
  ["ai-chat-prompt-input--default", "pl-prompt-input pl-textarea", "textarea"],
] as const;

/** The computed font size of the native control inside a field's shadow root. */
const fontSize = (page: Page, host: string, control: string) =>
  page
    .locator(host)
    .first()
    .evaluate(
      (el, selector) =>
        parseFloat(
          getComputedStyle(el.shadowRoot!.querySelector(selector)!).fontSize,
        ),
      control,
    );

test.describe("coarse pointer", () => {
  test.use({ hasTouch: true });

  for (const [id, host, control] of fields) {
    test(`${host} text is at least 16px, so iOS does not zoom on focus`, async ({
      page,
    }) => {
      await gotoStory(page, id);
      await expect(page.locator(host).first()).toBeVisible();
      await expect
        .poll(() => fontSize(page, host, control))
        .toBeGreaterThanOrEqual(16);
    });
  }
});

test.describe("fine pointer", () => {
  for (const [id, host, control] of fields) {
    test(`${host} keeps its compact text size`, async ({ page }) => {
      await gotoStory(page, id);
      await expect(page.locator(host).first()).toBeVisible();
      expect(await fontSize(page, host, control)).toBeLessThan(16);
    });
  }
});
