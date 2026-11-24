import { expect, test, type Locator, type Page } from "@playwright/test";
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
  await expect.poll(() => value(page)).toBe("2026-11/2026-11");
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
  await expect.poll(() => value(page)).toBe("2026-01/2026-03");
});

test("a range can span years: the year buttons and Page keys work after the first month", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await month(page, 2026, 11).click();
  await page.locator("#picker [part=nav]").nth(1).click();
  await expect(title(page)).toHaveText("2027");
  await month(page, 2027, 2).click();
  expect(await value(page)).toBe("2026-11/2027-02");
  await expect(title(page)).toHaveText("2027");
  await month(page, 2027, 3).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("PageUp");
  await expect(month(page, 2026, 3)).toBeFocused();
  await page.keyboard.press("Enter");
  expect(await value(page)).toBe("2026-03/2027-03");
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
  await record(page);
  // aria-disabled controls fail Playwright's enabled check; force the click
  await month(page, 2026, 4).click({ force: true });
  await month(page, 2026, 4).click({ force: true });
  expect(await recorded(page)).toEqual([]);
  await page.locator("#picker [part=nav]").nth(1).click({ force: true });
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
  await expect.poll(submitted).toBe("2026-07/2026-07");
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

const styles = (locator: Locator, props: string[]) =>
  locator.evaluate((el, names) => {
    const style = getComputedStyle(el);
    return names.map((name) => style.getPropertyValue(name));
  }, props);
/** The corner radii in px: start-start, end-start, start-end, end-end. */
const radii = async (locator: Locator) =>
  (
    await styles(locator, [
      "border-start-start-radius",
      "border-end-start-radius",
      "border-start-end-radius",
      "border-end-end-radius",
    ])
  ).map(parseFloat);
const background = async (locator: Locator) =>
  (await styles(locator, ["background-color"]))[0];
const inBand = /\b(start|end|between)\b/;

test("the trigger is as tall as a select beside it and the labels line up", async ({
  page,
}) => {
  await gotoStory(page, story("with-select"));
  const box = (selector: string) => page.locator(selector).boundingBox();
  const select = await box("#select [part=trigger]");
  const trigger = await box("#picker [part=trigger]");
  expect(Math.abs(select!.height - trigger!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(select!.y - trigger!.y)).toBeLessThanOrEqual(1);
  const selectLabel = await box("#select [part=label]");
  const pickerLabel = await box("#picker [part=label]");
  expect(Math.abs(selectLabel!.y - pickerLabel!.y)).toBeLessThanOrEqual(1);
  expect(
    Math.abs(selectLabel!.height - pickerLabel!.height),
  ).toBeLessThanOrEqual(1);
  await expect(
    page.getByRole("button", { name: /^Period, Feb\s*\S\s*May 2026$/ }),
  ).toBeVisible();
});

test("the trigger is a field with a calendar icon, a chevron and a muted placeholder", async ({
  page,
}) => {
  await gotoStory(page, story("placeholder"));
  const trigger = page.locator("#picker [part=trigger]");
  await expect(trigger.locator("[part=icon]")).toBeVisible();
  await expect(trigger.locator("[part=glyph]")).toBeVisible();
  await expect(trigger.locator("[part=value]")).toHaveText("Choose a period");
  const [text] = await styles(trigger, ["color"]);
  const [hint] = await styles(trigger.locator("[part=value]"), ["color"]);
  expect(hint).not.toBe(text);
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("the range is one band: the ends are caps, the months between join, and the band rounds at row ends", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  // February to May: a cap, the end of row one, the start of row two, a cap.
  const feb = month(page, 2026, 2);
  const mar = month(page, 2026, 3);
  const apr = month(page, 2026, 4);
  const may = month(page, 2026, 5);
  await expect(feb).toHaveAttribute("part", /\bstart\b/);
  await expect(mar).toHaveAttribute("part", /\bbetween\b/);
  await expect(apr).toHaveAttribute("part", /\bbetween\b/);
  await expect(may).toHaveAttribute("part", /\bend\b/);
  expect(await background(mar)).toBe(await background(apr));
  expect(await background(feb)).toBe(await background(may));
  expect(await background(feb)).not.toBe(await background(mar));
  expect(await background(mar)).not.toBe("rgba(0, 0, 0, 0)");
  expect(await background(month(page, 2026, 1))).toBe("rgba(0, 0, 0, 0)");
  expect(await background(month(page, 2026, 6))).toBe("rgba(0, 0, 0, 0)");
  const febRadii = await radii(feb);
  const marRadii = await radii(mar);
  const aprRadii = await radii(apr);
  const mayRadii = await radii(may);
  expect(febRadii[0]).toBeGreaterThan(0);
  expect(febRadii[2]).toBe(0);
  expect(marRadii[0]).toBe(0);
  expect(marRadii[2]).toBeGreaterThan(0);
  expect(aprRadii[0]).toBeGreaterThan(0);
  expect(aprRadii[2]).toBe(0);
  expect(mayRadii[0]).toBe(0);
  expect(mayRadii[2]).toBeGreaterThan(0);
});

test("a range of one month is a single rounded cap", async ({ page }) => {
  await gotoStory(page, story("single-month"));
  const mar = month(page, 2026, 3);
  await expect(mar).toHaveAttribute("part", /\bstart\b/);
  await expect(mar).toHaveAttribute("part", /\bend\b/);
  expect((await radii(mar)).every((radius) => radius > 0)).toBe(true);
  expect(await background(mar)).not.toBe(
    await background(month(page, 2026, 4)),
  );
  await expect(page.locator('#picker [part~="between"]')).toHaveCount(0);
});

test("after the first month, hovering another previews the band up to it, backwards too", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await month(page, 2026, 9).click();
  await month(page, 2026, 11).hover();
  await expect(month(page, 2026, 9)).toHaveAttribute("part", /\bstart\b/);
  await expect(month(page, 2026, 10)).toHaveAttribute("part", /\bbetween\b/);
  await expect(month(page, 2026, 11)).toHaveAttribute("part", /\bend\b/);
  // The preview is not a choice.
  await expect(month(page, 2026, 11)).toHaveAttribute("aria-selected", "false");
  expect(await value(page)).toBe("2026-02/2026-05");
  await month(page, 2026, 7).hover();
  await expect(month(page, 2026, 7)).toHaveAttribute("part", /\bstart\b/);
  await expect(month(page, 2026, 8)).toHaveAttribute("part", /\bbetween\b/);
  await expect(month(page, 2026, 9)).toHaveAttribute("part", /\bend\b/);
  await expect(month(page, 2026, 11)).not.toHaveAttribute("part", inBand);
  expect(await background(month(page, 2026, 7))).toBe(
    await background(month(page, 2026, 9)),
  );
});

test("moving focus with the keyboard previews the band the same way", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await month(page, 2026, 8).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(month(page, 2026, 6)).toBeFocused();
  await expect(month(page, 2026, 6)).toHaveAttribute("part", /\bstart\b/);
  await expect(month(page, 2026, 7)).toHaveAttribute("part", /\bbetween\b/);
  await expect(month(page, 2026, 8)).toHaveAttribute("part", /\bend\b/);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(month(page, 2026, 9)).toHaveAttribute("part", /\bend\b/);
  await expect(month(page, 2026, 8)).toHaveAttribute("part", /\bstart\b/);
  expect(await value(page)).toBe("2026-02/2026-05");
});

test("a range across years keeps its band on each year's page and the field shows both years", async ({
  page,
}) => {
  await gotoStory(page, story("cross-year"));
  await expect(page.locator("#picker [part=value]")).toHaveText(
    /^Nov 2025\s*\S\s*Feb 2026$/,
  );
  const inline = (year: number, number: number) =>
    page.locator(`#inline [data-month="${year * 12 + number - 1}"]`);
  await expect(page.locator("#inline [part=title]")).toHaveText("2025");
  await expect(inline(2025, 11)).toHaveAttribute("part", /\bstart\b/);
  await expect(inline(2025, 12)).toHaveAttribute("part", /\bbetween\b/);
  await expect(inline(2025, 10)).not.toHaveAttribute("part", inBand);
  await page.locator("#inline [part=nav]").nth(1).click();
  await expect(page.locator("#inline [part=title]")).toHaveText("2026");
  await expect(inline(2026, 1)).toHaveAttribute("part", /\bbetween\b/);
  await expect(inline(2026, 2)).toHaveAttribute("part", /\bend\b/);
  await expect(inline(2026, 3)).not.toHaveAttribute("part", inBand);
  expect(await background(inline(2026, 1))).not.toBe("rgba(0, 0, 0, 0)");
});

test("a range within one year shows the year once", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.locator("#picker [part=value]")).toHaveText(
    /^Feb\s*\S\s*May 2026$/,
  );
});

test("this month has a dot, not bold accent text", async ({ page }) => {
  await gotoStory(page, story("empty"));
  const now = page.locator('#picker [part~="month"][aria-current="date"]');
  await expect(now).toHaveCount(1);
  const [weight, color] = await styles(now, ["font-weight", "color"]);
  expect(Number(weight)).toBeLessThan(600);
  const other = page
    .locator('#picker [part~="month"]:not([aria-current="date"])')
    .first();
  expect((await styles(other, ["color"]))[0]).toBe(color);
  const dot = await now.evaluate((el) => {
    const style = getComputedStyle(el, "::after");
    return [style.content, style.backgroundColor, style.width];
  });
  expect(dot[0]).not.toBe("none");
  expect(dot[1]).not.toBe("rgba(0, 0, 0, 0)");
  expect(parseFloat(dot[2]!)).toBeGreaterThan(0);
});

test("Clear is enabled while there is a value and disabled without one", async ({
  page,
}) => {
  await gotoStory(page, story("inline"));
  await expect(page.getByRole("button", { name: "Clear" })).toBeEnabled();
  await gotoStory(page, story("empty"));
  await expect(page.getByRole("button", { name: "Clear" })).toBeDisabled();
  await page.locator("#picker [data-month]").first().click();
  await expect(page.getByRole("button", { name: "Clear" })).toBeEnabled();
});

test("a preset sets the range, fires the change events and closes", async ({
  page,
}) => {
  await gotoStory(page, story("presets"));
  await record(page);
  await page.getByRole("button", { name: /^Period/ }).click();
  await expect(page.getByRole("dialog", { name: "Period" })).toBeVisible();
  await expect(page.locator("#picker [part=preset]")).toHaveCount(3);
  await page.getByRole("button", { name: "Second quarter" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(await value(page)).toBe("2026-04/2026-06");
  expect(await recorded(page)).toEqual([
    "pl-change:2026-04/2026-06:2026-04:2026-06",
    "input",
    "change",
  ]);
  await expect(page.locator("#picker [part=value]")).toHaveText(
    /^Apr\s*\S\s*Jun 2026$/,
  );
});

test("without presets there is no list", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.getByRole("button", { name: /^Period/ }).click();
  await expect(page.locator("#picker [part=presets]")).toHaveCount(0);
});
