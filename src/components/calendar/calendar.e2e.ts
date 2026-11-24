import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `forms-calendar--${name}`;

const day = (page: Page, iso: string, scope = "") =>
  page.locator(`${scope} [data-date="${iso}"]`.trim());
const title = (page: Page, scope = "#calendar") =>
  page.locator(`${scope} [part=title]`);
const nav = (page: Page, which: "prev" | "next") =>
  page.locator(`#calendar [part=nav]`).nth(which === "prev" ? 0 : 1);

type Calendar = HTMLElement & {
  value: string;
  updateComplete: Promise<boolean>;
};

/** Records pl-change, input and change on the calendar, as strings. */
const record = (page: Page) =>
  page.locator("#calendar").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    el.addEventListener("pl-change", (event) =>
      log.push(
        `pl-change:${(event as CustomEvent<{ value: string }>).detail.value}`,
      ),
    );
    for (const name of ["input", "change"])
      el.addEventListener(name, () => log.push(name));
  });
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

const focusDay = (page: Page, iso: string) =>
  day(page, iso).evaluate((el) => (el as HTMLElement).focus());

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - button "Previous month"
    - button "Next month"
    - grid "November 2026"
  `);
  await expect(page.getByRole("gridcell")).toHaveCount(30);
  await expect(
    page.getByRole("gridcell", { name: "Wednesday, November 18, 2026" }),
  ).toHaveAttribute("aria-selected", "true");
});

test("the days are a grid named by the month, with weekday headings", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("grid", { name: "November 2026" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(7);
  await expect(page.getByRole("columnheader").first()).toContainText("Sun");
});

test("only the selected day is a tab stop", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.locator('[data-date][tabindex="0"]')).toHaveCount(1);
  await expect(day(page, "2026-11-18")).toHaveAttribute("tabindex", "0");
  await expect(day(page, "2026-11-19")).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(day(page, "2026-11-18")).toBeFocused();
});

test("a press selects a day and fires pl-change, input and change once", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await day(page, "2026-11-20").click();
  await expect(day(page, "2026-11-20")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(day(page, "2026-11-18")).toHaveAttribute(
    "aria-selected",
    "false",
  );
  expect(await recorded(page)).toEqual([
    "pl-change:2026-11-20",
    "input",
    "change",
  ]);
  expect(
    await page.locator("#calendar").evaluate((el) => (el as Calendar).value),
  ).toBe("2026-11-20");
  await day(page, "2026-11-20").click();
  expect(await recorded(page)).toHaveLength(3);
});

test("arrow keys move one day and one week", async ({ page }) => {
  await gotoStory(page, story("default"));
  await focusDay(page, "2026-11-18");
  await page.keyboard.press("ArrowRight");
  await expect(day(page, "2026-11-19")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(day(page, "2026-11-17")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(day(page, "2026-11-24")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(day(page, "2026-11-10")).toBeFocused();
});

test("the arrows carry on into the next and the previous month", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await focusDay(page, "2026-11-30");
  await page.keyboard.press("ArrowRight");
  await expect(day(page, "2026-12-01")).toBeFocused();
  await expect(title(page)).toHaveText("December 2026");
  await page.keyboard.press("ArrowLeft");
  await expect(day(page, "2026-11-30")).toBeFocused();
  await expect(title(page)).toHaveText("November 2026");
});

test("Home and End go to the first and last day of the week", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await focusDay(page, "2026-11-18");
  await page.keyboard.press("Home");
  await expect(day(page, "2026-11-15")).toBeFocused();
  await page.keyboard.press("End");
  await expect(day(page, "2026-11-21")).toBeFocused();
});

test("Page Up and Page Down move a month, with Shift a year, and keep the day or the month's last", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await focusDay(page, "2026-11-30");
  await page.keyboard.press("PageDown");
  await expect(day(page, "2026-12-30")).toBeFocused();
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await expect(day(page, "2026-10-30")).toBeFocused();
  await page.keyboard.press("Shift+PageDown");
  await expect(day(page, "2027-10-30")).toBeFocused();
  await focusDay(page, "2027-10-30");
  await page.keyboard.press("Shift+PageUp");
  await page.keyboard.press("Shift+PageUp");
  await expect(day(page, "2025-10-30")).toBeFocused();
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  await expect(day(page, "2026-02-28")).toBeFocused();
});

test("Enter and Space select the focused day", async ({ page }) => {
  await gotoStory(page, story("default"));
  await record(page);
  await focusDay(page, "2026-11-18");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(day(page, "2026-11-19")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(day(page, "2026-11-20")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await recorded(page)).toEqual([
    "pl-change:2026-11-19",
    "input",
    "change",
    "pl-change:2026-11-20",
    "input",
    "change",
  ]);
});

test("the keyboard story selects with the keys", async ({ page }) => {
  await gotoStory(page, story("keyboard"));
  await expect(day(page, "2026-11-26")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("the month buttons change the month and keep the focused day", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await nav(page, "next").click();
  await expect(title(page)).toHaveText("December 2026");
  await expect(day(page, "2026-12-18")).toHaveAttribute("tabindex", "0");
  await nav(page, "prev").click();
  await nav(page, "prev").click();
  await expect(title(page)).toHaveText("October 2026");
  // Changing the month is not a selection.
  await expect(day(page, "2026-11-18")).toHaveCount(0);
  await nav(page, "next").click();
  await expect(day(page, "2026-11-18")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("the title is announced when the month changes", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(title(page)).toHaveAttribute("aria-live", "polite");
});

test("min and max grey out the days outside and stop the month buttons", async ({
  page,
}) => {
  await gotoStory(page, story("with-range"));
  await expect(day(page, "2026-11-08")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(day(page, "2026-11-09")).not.toHaveAttribute("aria-disabled");
  await expect(nav(page, "prev")).toHaveAttribute("aria-disabled", "true");
  await expect(nav(page, "next")).not.toHaveAttribute("aria-disabled");
  await record(page);
  // aria-disabled controls fail Playwright's enabled check; force the click
  await day(page, "2026-11-08").click({ force: true });
  await expect(day(page, "2026-11-18")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await recorded(page)).toEqual([]);
  await nav(page, "prev").click({ force: true });
  await expect(title(page)).toHaveText("November 2026");
  await nav(page, "next").click();
  await expect(title(page)).toHaveText("December 2026");
  await expect(nav(page, "next")).toHaveAttribute("aria-disabled", "true");
  await nav(page, "next").click({ force: true });
  await expect(title(page)).toHaveText("December 2026");
});

test("keyboard moves stay inside min and max", async ({ page }) => {
  await gotoStory(page, story("with-range"));
  await focusDay(page, "2026-11-09");
  await page.keyboard.press("ArrowLeft");
  await expect(day(page, "2026-11-09")).toBeFocused();
  await page.keyboard.press("PageUp");
  await expect(day(page, "2026-11-09")).toBeFocused();
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  await expect(day(page, "2026-12-20")).toBeFocused();
});

test("disabled-dates takes a list of ISO days and they cannot be selected", async ({
  page,
}) => {
  await gotoStory(page, story("disabled-dates"));
  for (const iso of ["2026-11-03", "2026-11-11", "2026-11-25"])
    await expect(day(page, iso)).toHaveAttribute("aria-disabled", "true");
  await expect(day(page, "2026-11-04")).not.toHaveAttribute("aria-disabled");
  await record(page);
  await day(page, "2026-11-11").click({ force: true });
  await focusDay(page, "2026-11-11");
  await page.keyboard.press("Enter");
  expect(await recorded(page)).toEqual([]);
  await expect(day(page, "2026-11-18")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("the disabledDates property takes a function", async ({ page }) => {
  await gotoStory(page, story("disabled-by-function"));
  await expect(day(page, "2026-11-07")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(day(page, "2026-11-08")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(day(page, "2026-11-09")).not.toHaveAttribute("aria-disabled");
});

test("a value that is not a real day selects nothing", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("#calendar").evaluate(async (el) => {
    (el as Calendar).value = "2026-02-31";
    await (el as Calendar).updateComplete;
  });
  await expect(page.locator('[aria-selected="true"]')).toHaveCount(0);
});

test("today is marked", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("#calendar").evaluate(async (el) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    (el as Calendar).value =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    await (el as Calendar).updateComplete;
  });
  await expect(page.locator('[aria-current="date"]')).toHaveCount(1);
});

test("month names, weekday names and the first weekday follow the locale", async ({
  page,
}) => {
  await gotoStory(page, story("locales"));
  await expect(title(page, "#en-US")).toHaveText("November 2026");
  await expect(title(page, "#fr")).toHaveText("novembre 2026");
  await expect(title(page, "#ja")).toHaveText("2026年11月");
  // 1 November 2026 is a Sunday: first in the US week, last in the German one.
  const column = (scope: string) =>
    page
      .locator(`${scope} [data-date="2026-11-01"]`)
      .evaluate((cell) => (cell as HTMLTableCellElement).cellIndex);
  expect(await column("#en-US")).toBe(0);
  expect(await column("#de")).toBe(6);
  await expect(page.locator("#de th").first()).toContainText("Mo");
  await expect(
    page.getByRole("gridcell", { name: /Mittwoch, 18\. November 2026/ }),
  ).toBeVisible();
});

test("first-day overrides the locale's first weekday", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page
    .locator("#calendar")
    .evaluate((el) => el.setAttribute("first-day", "3"));
  await expect(page.locator("#calendar th").first()).toContainText("Wed");
  await focusDay(page, "2026-11-18");
  await page.keyboard.press("Home");
  await expect(day(page, "2026-11-18")).toBeFocused();
  await page.keyboard.press("End");
  await expect(day(page, "2026-11-24")).toBeFocused();
});

test("the button names can be replaced", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("#calendar").evaluate((el) => {
    el.setAttribute("prev-label", "Mois précédent");
    el.setAttribute("next-label", "Mois suivant");
  });
  await expect(
    page.getByRole("button", { name: "Mois précédent" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mois suivant" }),
  ).toBeVisible();
});

test("the form gets the value, and a reset returns the value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const submitted = () =>
    page
      .locator("#form")
      .evaluate((form) =>
        [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
          k,
          String(v),
        ]),
      );
  expect(await submitted()).toEqual([["day", "2026-11-18"]]);
  await day(page, "2026-11-20").click();
  expect(await submitted()).toEqual([["day", "2026-11-20"]]);
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(day(page, "2026-11-18")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await submitted()).toEqual([["day", "2026-11-18"]]);
});

test("under rtl the month buttons and the arrow keys mirror", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const prev = (await nav(page, "prev").boundingBox())!;
  const next = (await nav(page, "next").boundingBox())!;
  expect(prev.x).toBeGreaterThan(next.x);
  await focusDay(page, "2026-11-18");
  await page.keyboard.press("ArrowRight");
  await expect(day(page, "2026-11-17")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(day(page, "2026-11-19")).toBeFocused();
});

test("the selected day is filled, today is bold and a disabled day is dimmed", async ({
  page,
}) => {
  await gotoStory(page, story("disabled-dates"));
  const style = (iso: string) =>
    day(page, iso).evaluate((el) => {
      const css = getComputedStyle(el);
      return [css.backgroundColor, css.color];
    });
  const selected = await style("2026-11-18");
  const plain = await style("2026-11-04");
  const off = await style("2026-11-03");
  expect(selected[0]).not.toBe(plain[0]);
  expect(off[1]).not.toBe(plain[1]);
});

test("the focus ring is drawn on the focused day", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(day(page, "2026-11-18")).toBeFocused();
  await expect(day(page, "2026-11-18")).toHaveCSS("outline-style", "solid");
});

test("the selected day keeps its fill under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const background = (iso: string) =>
    day(page, iso).evaluate((el) => getComputedStyle(el).backgroundColor);
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.cssText = "background: Highlight; forced-color-adjust: none";
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect.poll(() => background("2026-11-18")).toBe(highlight);
  expect(await background("2026-11-19")).not.toBe(highlight);
  await focusDay(page, "2026-11-18");
  await page.keyboard.press("ArrowRight");
  await expect(day(page, "2026-11-19")).toHaveCSS("outline-style", "solid");
});

test("nothing fades under reduced motion", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(day(page, "2026-11-18")).toHaveCSS("transition-duration", "0s");
  await expect(nav(page, "next")).toHaveCSS("transition-duration", "0s");
});

test("the calendar passes axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("calendar ja: day labels are one line", async ({ page }) => {
  await gotoStory(page, story("locales"));
  const labels = await page.locator("#ja [part=day]").evaluateAll((cells) =>
    cells.map((cell) => {
      const range = document.createRange();
      range.selectNodeContents(cell);
      return [cell.textContent!.trim(), range.getClientRects().length] as const;
    }),
  );
  expect(labels).toHaveLength(30);
  // The Japanese 日 suffix is left out: the cell shows the number, on one line.
  for (const [text, lines] of labels) {
    expect(text).toMatch(/^\d{1,2}$/);
    expect(lines).toBe(1);
  }
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the days and the month buttons are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    for (const control of [
      day(page, "2026-11-18"),
      nav(page, "prev"),
      nav(page, "next"),
    ]) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
