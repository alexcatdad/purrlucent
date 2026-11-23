import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-date-picker--${name}`;

const field = (page: Page, scope = "#picker") => page.locator(`${scope} input`);
const button = (page: Page, scope = "#picker") =>
  page.locator(`${scope} pl-button[slot=trigger]`);
const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Choose date" });
const day = (page: Page, iso: string, scope = "#picker") =>
  page.locator(`${scope} [data-date="${iso}"]`);

type Picker = HTMLElement & {
  value: string;
  validity: ValidityState;
  validationMessage: string;
  updateComplete: Promise<boolean>;
};

const value = (page: Page, scope = "#picker") =>
  page.locator(scope).evaluate((el) => (el as Picker).value);

/** Records every event the picker fires, as strings. */
const record = (page: Page, scope = "#picker") =>
  page.locator(scope).evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["pl-input", "pl-change"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: string }>).detail.value}`,
        ),
      );
    for (const name of ["input", "change"])
      el.addEventListener(name, () => log.push(name));
  });
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

/** What the form would submit, as [name, value] pairs. */
const submitted = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
        k,
        String(v),
      ]),
    );

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - textbox "Date": 11/18/2026
    - button "Choose date" [expanded=false]
  `);
});

test("the entry shows the day as the locale writes it", async ({ page }) => {
  await gotoStory(page, story("locales"));
  await expect(field(page, "#en-US")).toHaveValue("11/18/2026");
  await expect(field(page, "#de")).toHaveValue("18.11.2026");
  await expect(field(page, "#ja")).toHaveValue("2026/11/18");
  expect(await value(page, "#de")).toBe("2026-11-18");
});

test("a slotted label names the entry and a click on it focuses the field", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("#picker").focus();
  await expect(field(page)).toBeFocused();
  await field(page).blur();
  await page.locator('#picker label[part="label"]').click();
  await expect(field(page)).toBeFocused();
});

test("typing a day in the locale's format sets the value and fires pl-input, input and, on blur, pl-change and change", async ({
  page,
}) => {
  await gotoStory(page, story("empty"));
  await record(page);
  await field(page).pressSequentially("11/22/2026");
  expect(await value(page)).toBe("2026-11-22");
  await page.keyboard.press("Tab");
  const log = await recorded(page);
  expect(log.filter((e) => e.startsWith("pl-input")).at(-1)).toBe(
    "pl-input:2026-11-22",
  );
  expect(log.filter((e) => e === "input")).toHaveLength(10);
  expect(log.filter((e) => e.startsWith("pl-change"))).toEqual([
    "pl-change:2026-11-22",
  ]);
  expect(log.filter((e) => e === "change")).toHaveLength(1);
});

test("an ISO day is read too, and the entry is rewritten in the locale's format on commit", async ({
  page,
}) => {
  await gotoStory(page, story("empty"));
  await field(page).fill("2026-11-22");
  expect(await value(page)).toBe("2026-11-22");
  await page.keyboard.press("Tab");
  await expect(field(page)).toHaveValue("11/22/2026");
});

test("a day half typed or not real is no value", async ({ page }) => {
  await gotoStory(page, story("empty"));
  for (const text of ["11/22/20", "11/22", "02/31/2026", "13/01/2026", "x"]) {
    await field(page).fill(text);
    expect(await value(page)).toBe("");
  }
});

test("an invalid entry shows its message after a blur and describes the entry with it", async ({
  page,
}) => {
  await gotoStory(page, story("empty"));
  const message = page.locator('#picker [part="message"]');
  await expect(message).toBeHidden();
  await field(page).fill("13/45/2026");
  await expect(field(page)).not.toHaveAttribute("aria-invalid");
  await page.keyboard.press("Tab");
  await expect(field(page)).toHaveAttribute("aria-invalid", "true");
  await expect(message).toBeVisible();
  await expect(message).toHaveText("Enter a valid date.");
  await expect(field(page)).toHaveAccessibleDescription("Enter a valid date.");
  await field(page).fill("11/22/2026");
  await expect(message).toBeHidden();
  await expect(field(page)).not.toHaveAttribute("aria-invalid");
});

test("a day outside min and max or a disabled day is invalid and is no value", async ({
  page,
}) => {
  await gotoStory(page, story("range"));
  for (const text of ["11/08/2026", "12/21/2026", "11/25/2026"]) {
    await field(page).fill(text);
    expect(await value(page)).toBe("");
    const state = await page.locator("#picker").evaluate((el) => {
      const picker = el as Picker;
      return [picker.validity.valid, picker.validationMessage];
    });
    expect(state).toEqual([false, "Choose an available date."]);
  }
  await field(page).fill("11/10/2026");
  expect(await value(page)).toBe("2026-11-10");
});

test("invalid-message and range-message can be replaced", async ({ page }) => {
  await gotoStory(page, story("range"));
  await page.locator("#picker").evaluate((el) => {
    el.setAttribute("invalid-message", "Ungültiges Datum.");
    el.setAttribute("range-message", "Nicht verfügbar.");
  });
  await field(page).fill("x");
  await expect
    .poll(() =>
      page
        .locator("#picker")
        .evaluate((el) => (el as Picker).validationMessage),
    )
    .toBe("Ungültiges Datum.");
  await field(page).fill("11/08/2026");
  await expect
    .poll(() =>
      page
        .locator("#picker")
        .evaluate((el) => (el as Picker).validationMessage),
    )
    .toBe("Nicht verfügbar.");
});

test("the button opens the calendar on the value and focus moves to the selected day", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(dialog(page)).toBeHidden();
  await button(page).click();
  await expect(dialog(page)).toBeVisible();
  await expect(button(page)).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#picker [part=title]")).toHaveText(
    "November 2026",
  );
  await expect(day(page, "2026-11-18")).toBeFocused();
  await expect(day(page, "2026-11-18")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("Enter and Space on the button open the calendar", async ({ page }) => {
  await gotoStory(page, story("default"));
  for (const key of ["Enter", "Space"]) {
    await button(page).focus();
    await page.keyboard.press(key);
    await expect(day(page, "2026-11-18")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
  }
});

test("Alt and Down Arrow in the entry open the calendar", async ({ page }) => {
  await gotoStory(page, story("default"));
  await field(page).focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(dialog(page)).toBeVisible();
  await expect(day(page, "2026-11-18")).toBeFocused();
});

test("the calendar shows the typed day when it opens", async ({ page }) => {
  await gotoStory(page, story("default"));
  await field(page).fill("03/04/2027");
  await button(page).click();
  await expect(page.locator("#picker [part=title]")).toHaveText("March 2027");
  await expect(day(page, "2027-03-04")).toBeFocused();
});

test("choosing a day fills the entry, closes the calendar and returns focus to the button", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await button(page).click();
  await day(page, "2026-11-20").click();
  await expect(dialog(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
  await expect(field(page)).toHaveValue("11/20/2026");
  expect(await value(page)).toBe("2026-11-20");
  expect(await recorded(page)).toEqual([
    "pl-input:2026-11-20",
    "input",
    "pl-change:2026-11-20",
    "change",
  ]);
});

test("choosing a day with the keyboard returns focus to the button", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await button(page).focus();
  await page.keyboard.press("Enter");
  await expect(day(page, "2026-11-18")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(dialog(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
  await expect(field(page)).toHaveValue("11/19/2026");
});

test("Escape closes the calendar, keeps the value and returns focus to the button", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await expect(day(page, "2026-11-18")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toBeHidden();
  await expect(button(page)).toBeFocused();
  expect(await value(page)).toBe("2026-11-18");
});

test("a press outside closes the calendar", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(dialog(page)).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog(page)).toBeHidden();
});

test("the calendar in the popover holds min, max and the disabled days", async ({
  page,
}) => {
  await gotoStory(page, story("range"));
  await button(page).click();
  await expect(day(page, "2026-11-08")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(day(page, "2026-11-25")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await record(page);
  await day(page, "2026-11-08").click({ force: true });
  await expect(dialog(page)).toBeVisible();
  expect(await recorded(page)).toEqual([]);
});

test("the popover is wide enough for the whole calendar", async ({ page }) => {
  await gotoStory(page, story("open"));
  const fits = await page.locator("#picker pl-popover").evaluate((el) => {
    const panel = el.shadowRoot!.querySelector("[part=panel]")!;
    return panel.scrollWidth <= panel.clientWidth;
  });
  expect(fits).toBe(true);
});

test("the calendar's own events do not leave the picker", async ({ page }) => {
  await gotoStory(page, story("default"));
  await record(page);
  await button(page).click();
  await day(page, "2026-11-21").click();
  const log = await recorded(page);
  expect(log.filter((e) => e.startsWith("pl-change"))).toHaveLength(1);
  expect(log.filter((e) => e === "input")).toHaveLength(1);
  expect(log.filter((e) => e === "change")).toHaveLength(1);
});

test("the form gets the value, and a reset returns the value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([["when", "2026-11-18"]]);
  await field(page, "#other").fill("12/01/2026");
  expect(await submitted(page)).toEqual([
    ["when", "2026-11-18"],
    ["until", "2026-12-01"],
  ]);
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(field(page)).toHaveValue("11/18/2026");
  await expect(field(page, "#other")).toHaveValue("");
});

test("required and a day that is not real make the form invalid", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const valid = () =>
    page
      .locator("#form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  expect(await valid()).toBe(false);
  await field(page, "#other").fill("nope");
  expect(await valid()).toBe(false);
  await field(page, "#other").fill("12/01/2026");
  expect(await valid()).toBe(true);
});

test("a blocked submit marks an untouched invalid field", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  await expect(field(page, "#other")).not.toHaveAttribute("aria-invalid");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(field(page, "#other")).toHaveAttribute("aria-invalid", "true");
});

test("a disabled fieldset disables the field and the button and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(field(page)).toBeDisabled();
  await expect(button(page)).toHaveAttribute("aria-disabled", "true");
  expect(await submitted(page)).toEqual([]);
});

test("a disabled field takes no focus and a read-only one keeps its value and does not open", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const disabled = page.getByRole("textbox", { name: "Disabled" });
  await expect(disabled).toBeDisabled();
  const readonly = page.getByRole("textbox", { name: "Read only" });
  await readonly.focus();
  await page.keyboard.type("x");
  await expect(readonly).toHaveValue("11/18/2026");
  await page.keyboard.press("Alt+ArrowDown");
  await expect(dialog(page)).toBeHidden();
  await expect(
    page.locator("pl-date-picker").nth(1).locator("pl-button[slot=trigger]"),
  ).toHaveAttribute("aria-disabled", "true");
});

test("values set from script show in the entry", async ({ page }) => {
  await gotoStory(page, story("empty"));
  await page.locator("#picker").evaluate(async (el) => {
    (el as Picker).value = "2027-01-05";
    await (el as Picker).updateComplete;
  });
  await expect(field(page)).toHaveValue("01/05/2027");
  await page.locator("#picker").evaluate(async (el) => {
    (el as Picker).value = "";
    await (el as Picker).updateComplete;
  });
  await expect(field(page)).toHaveValue("");
});

test("the button sits at the end of the field under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const entry = (await field(page).boundingBox())!;
  const trigger = (await button(page).boundingBox())!;
  expect(trigger.x + trigger.width).toBeLessThanOrEqual(entry.x + 1);
});

test("the field keeps a border under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const style = await page
    .locator("#picker")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
          .borderStyle,
    );
  expect(style).toBe("solid");
});

test("the picker passes axe, open and closed", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
  const open = await gotoStory(page, story("open"));
  await expect(dialog(page)).toBeVisible();
  await expectAccessible(open);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the field and the button are at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("default"));
    const entry = (await page.locator("#picker").boundingBox())!;
    expect(entry.height).toBeGreaterThanOrEqual(44);
    const trigger = (await button(page).boundingBox())!;
    expect(trigger.width).toBeGreaterThanOrEqual(44);
    expect(trigger.height).toBeGreaterThanOrEqual(44);
  });
});
