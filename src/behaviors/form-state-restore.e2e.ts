import { expect, test, type Page } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

type Restorable = HTMLElement & {
  formStateRestoreCallback(state: string, mode: string): void;
};

const restore = (page: Page, selector: string, state: string) =>
  page
    .locator(selector)
    .evaluate(
      (el, value) =>
        (el as Restorable).formStateRestoreCallback(value, "restore"),
      state,
    );

const submitted = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
        k,
        String(v),
      ]),
    );

test("a restored select state chooses that option", async ({ page }) => {
  await gotoStory(page, "forms-select--in-form");
  await restore(page, "#pick", "b");
  await expect
    .poll(() => submitted(page))
    .toEqual([
      ["apple", "fuji"],
      ["pick", "b"],
    ]);
});

test("a restored combobox state sets the value and the shown text", async ({
  page,
}) => {
  await gotoStory(page, "forms-combobox--in-form");
  await restore(page, "#pick", "b");
  await expect
    .poll(() => submitted(page))
    .toEqual([
      ["apple", "fuji"],
      ["pick", "b"],
    ]);
  await expect(page.locator("#pick").getByRole("combobox")).toHaveValue("Beta");
});

test("a restored checkbox state checks and unchecks the box", async ({
  page,
}) => {
  await gotoStory(page, "forms-checkbox--in-form");
  await restore(page, "#terms", "true");
  await expect(page.locator("#terms")).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() => submitted(page))
    .toEqual([
      ["news", "on"],
      ["terms", "yes"],
    ]);
  await restore(page, "#news", "false");
  await expect(page.locator("#news")).toHaveAttribute("aria-checked", "false");
  await expect.poll(() => submitted(page)).toEqual([["terms", "yes"]]);
});

test("a restored radio group state chooses that radio", async ({ page }) => {
  await gotoStory(page, "forms-radio-group--in-form");
  await restore(page, "#other", "l");
  await expect(page.getByRole("radio", { name: "Large" })).toBeChecked();
  await expect
    .poll(() => submitted(page))
    .toEqual([
      ["open", "windows"],
      ["size", "l"],
    ]);
  await restore(page, "#control", "tabs");
  await expect(page.getByRole("radio", { name: "Tabs" })).toBeChecked();
  await expect
    .poll(() => submitted(page))
    .toEqual([
      ["open", "tabs"],
      ["size", "l"],
    ]);
});

test("a restored toggle group state selects that segment", async ({ page }) => {
  await gotoStory(page, "actions-toggle-group--in-form");
  await expect(page.locator("pl-toggle-group-item[selected]")).toHaveCount(1);
  await restore(page, "#control", "month");
  await expect(page.getByRole("radio", { name: "Month" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect.poll(() => submitted(page)).toEqual([["range", "month"]]);
});
