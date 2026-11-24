import { expect, test, type Page } from "@playwright/test";
import { expectAccessible } from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `forms-month-range-picker--${name}`;

/** The cell of a month, by year and month number. */
const month = (page: Page, year: number, number: number) =>
  page.locator(`#picker [data-month="${year * 12 + number - 1}"]`);
const title = (page: Page) => page.locator("#picker [part=title]");
const picker = (page: Page) => page.locator("#picker");
const value = (page: Page) =>
  picker(page).evaluate((el) => (el as HTMLElement & { value: string }).value);

/** Records pl-change details and the native events on the picker. */
const record = (page: Page) =>
  picker(page).evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    el.addEventListener("pl-change", (event) => {
      const { value, start, end } = (
        event as CustomEvent<{ value: string; start: string; end: string }>
      ).detail;
      log.push(`pl-change:${value}:${start}:${end}`);
    });
    for (const name of ["input", "change"])
      el.addEventListener(name, () => log.push(name));
  });
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

test("the months of one year are a grid of three columns named by the label and year", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await expect(page.getByRole("grid", { name: "Period, 2026" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(4);
  await expect(page.getByRole("gridcell")).toHaveCount(12);
  await expect(page.getByRole("row").first().getByRole("gridcell")).toHaveCount(
    3,
  );
  await expect(
    page.getByRole("gridcell", { name: "February 2026" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("gridcell", { name: "April 2026" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("gridcell", { name: "June 2026" }),
  ).toHaveAttribute("aria-selected", "false");
});

test("two clicks choose a range in either order, and the value is ordered", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await record(page);
  await month(page, 2026, 9).click();
  expect(await recorded(page)).toEqual([]);
  await month(page, 2026, 7).click();
  expect(await value(page)).toBe("2026-07/2026-09");
  expect(await recorded(page)).toEqual([
    "pl-change:2026-07/2026-09:2026-07:2026-09",
    "input",
    "change",
  ]);
  await expect(month(page, 2026, 8)).toHaveAttribute("aria-selected", "true");
});

test("inline, leaving after one month chooses that month alone", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await record(page);
  await month(page, 2026, 10).click();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect.poll(() => value(page)).toBe("2026-10/2026-10");
  expect(await recorded(page)).toEqual([
    "pl-change:2026-10/2026-10:2026-10:2026-10",
    "input",
    "change",
  ]);
});

test("the button shows the range and opens the months on its start", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  // Intl writes the range with its own dash and spacing.
  const trigger = page.getByRole("button", {
    name: /^Period, Feb\s*\S\s*May 2026$/,
  });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Period" })).toBeVisible();
  await expect(month(page, 2026, 2)).toBeFocused();
});

test("closing the popover after one month chooses that month alone", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.getByRole("button", { name: /^Period/ }).click();
  await month(page, 2026, 11).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await value(page)).toBe("2026-11/2026-11");
  await expect(
    page.getByRole("button", { name: "Period, Nov 2026" }),
  ).toBeVisible();
});

test("the second month closes the popover with the range", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.getByRole("button", { name: /^Period/ }).click();
  await month(page, 2026, 3).click();
  await month(page, 2026, 1).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await value(page)).toBe("2026-01/2026-03");
});

test("arrows move by a month and a row, Home and End to January and December, Page keys by a year", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await month(page, 2026, 2).focus();
  await page.keyboard.press("ArrowRight");
  await expect(month(page, 2026, 3)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(month(page, 2026, 6)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowLeft");
  await expect(month(page, 2026, 2)).toBeFocused();
  await page.keyboard.press("End");
  await expect(month(page, 2026, 12)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(month(page, 2026, 1)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(month(page, 2025, 12)).toBeFocused();
  await expect(title(page)).toHaveText("2025");
  await page.keyboard.press("PageDown");
  await expect(month(page, 2026, 12)).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(month(page, 2025, 12)).toBeFocused();
});

test("Enter and Space choose the start and the end", async ({ page }) => {
  await gotoStory(page, story("inline"));
  await month(page, 2026, 5).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press(" ");
  expect(await value(page)).toBe("2026-05/2026-07");
});

test("under rtl the arrow keys mirror", async ({ page }) => {
  await gotoStory(page, story("inline"));
  await picker(page).evaluate((el) => el.setAttribute("dir", "rtl"));
  await month(page, 2026, 2).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(month(page, 2026, 3)).toBeFocused();
});

test("Clear empties the value and fires pl-change with empty months", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await record(page);
  await page.getByRole("button", { name: "Clear" }).click();
  expect(await value(page)).toBe("");
  expect(await recorded(page)).toEqual(["pl-change:::", "input", "change"]);
  await expect(page.getByRole("button", { name: "Clear" })).toBeDisabled();
  await expect(
    page.locator('#picker [part~="month"][aria-selected="true"]'),
  ).toHaveCount(0);
});

test("months outside min and max cannot be chosen and the year buttons stop", async ({
  page,
}) => {
  await gotoStory(page, story("with-range"));
  await expect(month(page, 2026, 4)).toHaveAttribute("aria-disabled", "true");
  await month(page, 2026, 4).click();
  await page.locator("#picker [part=nav]").nth(1).click();
  await expect(title(page)).toHaveText("2026");
  await expect(page.locator("#picker [part=nav]").nth(1)).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await page.locator("#picker [part=nav]").first().click();
  await expect(title(page)).toHaveText("2025");
  await expect(month(page, 2025, 9)).toHaveAttribute("aria-disabled", "true");
  await expect(month(page, 2025, 10)).not.toHaveAttribute("aria-disabled");
});

test("month names follow the locale", async ({ page }) => {
  await gotoStory(page, story("locales"));
  await expect(
    page.getByRole("gridcell", { name: "februari 2026" }),
  ).toBeVisible();
  await expect(
    page.getByRole("gridcell", { name: "Februar 2026" }),
  ).toBeVisible();
});

test("the form gets the range and a reset returns it", async ({ page }) => {
  await gotoStory(page, story("in-a-form"));
  const submitted = () =>
    page
      .locator("#form")
      .evaluate((form) => new FormData(form as HTMLFormElement).get("period"));
  expect(await submitted()).toBe("2026-02/2026-05");
  await page.getByRole("button", { name: /^Period/ }).click();
  await page.locator('[data-month="24318"]').click();
  await page.keyboard.press("Escape");
  expect(await submitted()).toBe("2026-07/2026-07");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect.poll(submitted).toBe("2026-02/2026-05");
});

test("inline and open popover pass the accessibility check", async ({
  page,
}) => {
  await expectAccessible(await gotoStory(page, story("inline")));
  const root = await gotoStory(page, story("default"));
  await page.getByRole("button", { name: /^Period/ }).click();
  await expectAccessible(root);
});
