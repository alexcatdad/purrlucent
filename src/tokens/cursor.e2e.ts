import { expect, test, type Page } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

/** The computed cursor of an element, or of a part inside its shadow root. */
const cursorOf = (page: Page, selector: string, inner?: string) =>
  page.evaluate(
    ([host, part]) => {
      const el = document.querySelector(host!)!;
      const target = part ? el.shadowRoot!.querySelector(part)! : el;
      return getComputedStyle(target).cursor;
    },
    [selector, inner],
  );

const setToken = (page: Page, name: string, value: string) =>
  page.evaluate(
    ([n, v]) => document.documentElement.style.setProperty(n!, v!),
    [name, value],
  );

test("an enabled button shows the pointing hand", async ({ page }) => {
  await gotoStory(page, "actions-button--default");
  await expect(page.locator("pl-button").first()).toBeVisible();
  expect(await cursorOf(page, "pl-button")).toBe("pointer");
});

test("a sidebar item control shows the pointing hand", async ({ page }) => {
  await gotoStory(page, "navigation-sidebar--default");
  await expect(page.locator("pl-sidebar-item#settings")).toBeVisible();
  expect(await cursorOf(page, "pl-sidebar-item#settings", ".control")).toBe(
    "pointer",
  );
});

test("a tab shows the pointing hand", async ({ page }) => {
  await gotoStory(page, "navigation-tabs--default");
  await expect(page.locator("pl-tab").first()).toBeVisible();
  expect(await cursorOf(page, "pl-tab")).toBe("pointer");
});

test("a disabled button shows not-allowed, and the token overrides it", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--disabled");
  await expect(page.locator("#disabled-secondary")).toBeVisible();
  expect(await cursorOf(page, "#disabled-secondary")).toBe("not-allowed");
  await setToken(page, "--pl-cursor-disabled", "default");
  expect(await cursorOf(page, "#disabled-secondary")).toBe("default");
});

test("--pl-cursor-interactive overrides the pointing hand", async ({
  page,
}) => {
  await gotoStory(page, "actions-button--default");
  await expect(page.locator("pl-button").first()).toBeVisible();
  await setToken(page, "--pl-cursor-interactive", "default");
  expect(await cursorOf(page, "pl-button")).toBe("default");
});
