import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-combobox--${name}`;

const combo = (page: Page, name = "Apple variety") =>
  page.getByRole("combobox", { name });
const option = (page: Page, name: string) =>
  page.getByRole("option", { name, exact: true });
const listbox = (page: Page) => page.getByRole("listbox");
const chevron = (page: Page, name = "Apple variety") =>
  page.getByRole("button", { name: `${name}, show options` });

/** The names of the options the list shows, in order. */
const listed = (page: Page) =>
  page.locator("purr-combobox").evaluate((el) =>
    el
      .shadowRoot!.querySelector<HTMLSlotElement>("slot:not([name])")!
      .assignedElements()
      .map((o) => o.textContent!.trim()),
  );

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

/** Records the detail of a purr-input or purr-change event on #combo in window.log. */
const record = (page: Page, type: "purr-input" | "purr-change") =>
  page.evaluate((type) => {
    const log: unknown[] = [];
    document
      .querySelector("#combo")!
      .addEventListener(type, (e) => log.push((e as CustomEvent).detail));
    (window as unknown as { log: unknown[] }).log = log;
  }, type);
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: unknown[] }).log);

/** What the input's active descendant points at, as text. */
const activeDescendant = (page: Page) =>
  combo(page).evaluate(
    (input) =>
      (
        input as HTMLInputElement & { ariaActiveDescendantElement: Element }
      ).ariaActiveDescendantElement?.textContent?.trim() ?? null,
  );

test("aria snapshot, closed", async ({ page }) => {
  const root = await gotoStory(page, story("preselected"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Apple variety" [expanded=false]: Fuji
    - button "Apple variety, show options" [expanded=false]
  `);
});

test("aria snapshot, open", async ({ page }) => {
  const root = await gotoStory(page, story("open"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Apple variety" [expanded]: Fuji
    - button "Apple variety, show options" [expanded]
    - listbox "Apple variety":
      - option "McIntosh" [selected=false]
      - option "Fuji" [selected]
      - option "Gala" [selected=false]
      - option "Granny Smith" [selected=false]
      - option "Honeycrisp" [disabled] [selected=false]
      - option "Ambrosia" [selected=false]
  `);
});

test("aria snapshot, filtered: starts-with matches come first", async ({
  page,
}) => {
  const root = await gotoStory(page, story("filtered"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Apple variety" [expanded]: a
    - listbox "Apple variety":
      - option "Ambrosia" [selected=false]
      - option "Gala" [selected=false]
      - option "Granny Smith" [selected=false]
  `);
});

test("aria snapshot, no results", async ({ page }) => {
  const root = await gotoStory(page, story("no-results"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Apple variety" [expanded]: zzz
    - listbox "Apple variety":
      - option "No results" [disabled] [selected=false]
  `);
});

test("the active option is the input's active descendant while focus stays in the input", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await combo(page).focus();
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("McIntosh");
  await expect(combo(page)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("Fuji");
  await page.keyboard.press("Escape");
  expect(await activeDescendant(page)).toBeNull();
});

test("typing filters, ranks and opens the list", async ({ page }) => {
  await gotoStory(page, story("default"));
  await combo(page).focus();
  await expect(listbox(page)).toBeHidden();
  await page.keyboard.type("a");
  await expect(listbox(page)).toBeVisible();
  await expect(combo(page)).toHaveAttribute("aria-expanded", "true");
  expect(await listed(page)).toEqual(["Ambrosia", "Gala", "Granny Smith"]);
  await page.keyboard.type("N");
  expect(await listed(page)).toEqual(["Granny Smith"]);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  expect(await listed(page)).toHaveLength(6);
});

test("arrows move the active option, skip disabled ones and stop at the ends", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await combo(page).focus();
  await page.keyboard.press("ArrowDown");
  await expect(listbox(page)).toBeVisible();
  expect(await activeDescendant(page)).toBe("McIntosh");
  await page.keyboard.press("ArrowUp");
  expect(await activeDescendant(page)).toBe("McIntosh");
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("Granny Smith");
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("Ambrosia");
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("Ambrosia");
  await expect(combo(page)).toBeFocused();
});

test("ArrowUp on the closed field opens at the last option", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await combo(page).focus();
  await page.keyboard.press("ArrowUp");
  expect(await activeDescendant(page)).toBe("Ambrosia");
});

test("opening a field with a choice marks that choice active", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await combo(page).focus();
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("Fuji");
  expect(await listed(page)).toHaveLength(6);
});

test("Enter chooses the active option, closes and fires purr-change", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page, "purr-change");
  await combo(page).focus();
  await page.keyboard.type("gr");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("Granny Smith");
  await expect(combo(page)).toBeFocused();
  expect(await recorded(page)).toEqual([{ value: "Granny Smith" }]);
  // The same choice again is not a change.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect(await recorded(page)).toHaveLength(1);
});

test("Escape closes the list, a second Escape clears the text", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await record(page, "purr-change");
  await combo(page).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("Fuji");
  await page.keyboard.press("Escape");
  await expect(combo(page)).toHaveValue("");
  expect(await recorded(page)).toEqual([{ value: "" }]);
});

test("Alt+ArrowDown opens and Alt+ArrowUp closes without touching the text", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await combo(page).focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(listbox(page)).toBeVisible();
  await expect(combo(page)).toHaveValue("Fuji");
  await page.keyboard.press("Alt+ArrowUp");
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("Fuji");
});

// Whether Home moves the caret is the browser's call (macOS WebKit leaves it),
// so the field must only not take the key and not touch the active option.
test("Home and End are left to the text caret and keep the active option", async ({
  page,
  browserName,
}) => {
  await gotoStory(page, story("default"));
  await combo(page).focus();
  await page.keyboard.type("gra");
  await page.keyboard.press("ArrowDown");
  await page.evaluate(() => {
    const log: boolean[] = [];
    document.addEventListener("keydown", (e) => log.push(e.defaultPrevented));
    (window as unknown as { log: boolean[] }).log = log;
  });
  const caret = () =>
    combo(page).evaluate((input) => (input as HTMLInputElement).selectionStart);
  await page.keyboard.press("Home");
  if (browserName === "chromium") expect(await caret()).toBe(0);
  await page.keyboard.press("End");
  if (browserName === "chromium") expect(await caret()).toBe(3);
  expect(await recorded(page)).toEqual([false, false]);
  expect(await activeDescendant(page)).toBe("Granny Smith");
});

test("purr-input reports the text while typing", async ({ page }) => {
  await gotoStory(page, story("default"));
  await record(page, "purr-input");
  await combo(page).focus();
  await page.keyboard.type("ga");
  expect(await recorded(page)).toEqual([{ text: "g" }, { text: "ga" }]);
});

test("the chevron toggles the list, is not a tab stop and keeps focus in the field", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const next = document.createElement("input");
    next.id = "next";
    document.querySelector("purr-combobox")!.after(next);
  });
  await chevron(page).click();
  await expect(listbox(page)).toBeVisible();
  await expect(combo(page)).toBeFocused();
  await chevron(page).click();
  await expect(listbox(page)).toBeHidden();
  await expect(chevron(page)).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("Tab");
  await expect(page.locator("#next")).toBeFocused();
});

test("clicking an option chooses it, closes the list and keeps focus in the field", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page, "purr-change");
  await chevron(page).click();
  await option(page, "Gala").click();
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("Gala");
  await expect(combo(page)).toBeFocused();
  expect(await recorded(page)).toEqual([{ value: "Gala" }]);
});

test("a press outside closes the list and restores the chosen label", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await page.keyboard.type("x");
  await page.mouse.click(5, 5);
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("Fuji");
});

test("a disabled option cannot be chosen", async ({ page }) => {
  await gotoStory(page, story("open"));
  await option(page, "Honeycrisp").click({ force: true });
  await expect(listbox(page)).toBeVisible();
  await expect(combo(page)).toHaveValue("Fuji");
});

test("no results shows a row that cannot be chosen", async ({ page }) => {
  await gotoStory(page, story("no-results"));
  await option(page, "No results").click({ force: true });
  await expect(listbox(page)).toBeVisible();
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBeNull();
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("");
});

test("leaving unmatched text restores the last chosen label", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await record(page, "purr-change");
  await combo(page).fill("Fu");
  await page.keyboard.type("x");
  await page.keyboard.press("Tab");
  await expect(combo(page)).toHaveValue("Fuji");
  expect(await recorded(page)).toEqual([]);
});

test("text that is exactly a label is chosen on leaving", async ({ page }) => {
  await gotoStory(page, story("default"));
  await record(page, "purr-change");
  await combo(page).fill("gala");
  await page.keyboard.press("Tab");
  await expect(combo(page)).toHaveValue("Gala");
  expect(await recorded(page)).toEqual([{ value: "Gala" }]);
});

test("with allow-custom, unmatched text is kept as the value", async ({
  page,
}) => {
  await gotoStory(page, story("allow-custom"));
  await record(page, "purr-change");
  await combo(page).fill("Pink Lady");
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeHidden();
  await expect(combo(page)).toHaveValue("Pink Lady");
  expect(await recorded(page)).toEqual([{ value: "Pink Lady" }]);
  expect(
    await page
      .locator("#combo")
      .evaluate((el) => (el as never as { value: string }).value),
  ).toBe("Pink Lady");
});

test("the form gets the value like a text field", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([
    ["apple", "fuji"],
    ["pick", ""],
  ]);
  await combo(page, "Required pick").focus();
  await page.keyboard.type("be");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect(await submitted(page)).toEqual([
    ["apple", "fuji"],
    ["pick", "b"],
  ]);
});

test("a form reset returns each combobox to its selected option or none", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await combo(page).fill("Gala");
  await combo(page, "Required pick").fill("Alpha");
  await page.keyboard.press("Tab");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(combo(page)).toHaveValue("Fuji");
  await expect(combo(page, "Required pick")).toHaveValue("");
  expect(await submitted(page)).toEqual([
    ["apple", "fuji"],
    ["pick", ""],
  ]);
});

test("a required combobox makes the form invalid until one is chosen", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const valid = () =>
    page
      .locator("#form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  expect(await valid()).toBe(false);
  await combo(page, "Required pick").fill("Alpha");
  await page.keyboard.press("Tab");
  expect(await valid()).toBe(true);
});

test("a disabled fieldset disables the combobox and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(combo(page)).toBeDisabled();
  await expect(chevron(page)).toBeDisabled();
  expect(await submitted(page)).toEqual([]);
});

test("a disabled combobox takes no focus and does not open", async ({
  page,
}) => {
  await gotoStory(page, story("disabled"));
  await expect(combo(page).first()).toBeDisabled();
  await chevron(page).first().click({ force: true });
  await expect(listbox(page)).toBeHidden();
});

test.describe("near the bottom edge", () => {
  test.use({ viewport: { width: 800, height: 400 } });

  test("the popup flips and stays inside the viewport", async ({ page }) => {
    await gotoStory(page, story("default"));
    await page.locator("#combo").evaluate((el) => {
      el.style.position = "fixed";
      el.style.insetBlockEnd = "10px";
      el.style.insetInlineStart = "10px";
    });
    await chevron(page).click();
    const list = (await listbox(page).boundingBox())!;
    const control = (await combo(page).boundingBox())!;
    expect(list.y).toBeGreaterThanOrEqual(0);
    expect(list.y + list.height).toBeLessThanOrEqual(control.y);
  });
});

test("the popup is at least as wide as the field", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  await chevron(page, "Apple variety, xl").click();
  const list = (await listbox(page).boundingBox())!;
  const box = (await combo(page, "Apple variety, xl").boundingBox())!;
  expect(list.width).toBeGreaterThanOrEqual(box.width);
});

test("under rtl the popup aligns to the field's start edge", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  await chevron(page).click();
  const list = (await listbox(page).boundingBox())!;
  const field = (await page
    .locator("purr-combobox")
    .evaluate((el) =>
      el
        .shadowRoot!.querySelector("[part=field]")!
        .getBoundingClientRect()
        .toJSON(),
    )) as {
    right: number;
  };
  expect(list.x + list.width).toBeCloseTo(field.right, 0);
});

test("the focus ring and the active option stay visible under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(combo(page)).toBeFocused();
  const ring = await page
    .locator("purr-combobox")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector("[part=field]")!)
          .outlineStyle,
    );
  expect(ring).toBe("solid");
  await page.keyboard.press("ArrowDown");
  const colors = await option(page, "McIntosh").evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.backgroundColor, style.color];
  });
  expect(colors[0]).not.toBe(colors[1]);
});

/** Adds `markup` after the story, so a test can probe states no story shows. */
const mount = (page: Page, markup: string) =>
  page.evaluate((markup) => {
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
  }, markup);

const abc = `
  <purr-option value="a">Alpha</purr-option>
  <purr-option value="b">Beta</purr-option>
  <purr-option value="c">Gamma</purr-option>`;

test("a form reset returns a combobox to its starting value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<form id="probe"><purr-combobox label="Probe" value="b">${abc}</purr-combobox></form>`,
  );
  await expect(combo(page, "Probe")).toHaveValue("Beta");
  await combo(page, "Probe").fill("Gamma");
  await page.keyboard.press("Tab");
  await page
    .locator("#probe")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(combo(page, "Probe")).toHaveValue("Beta");
});

test("opening scrolls a long list to the chosen option", async ({ page }) => {
  await gotoStory(page, story("default"));
  const items = Array.from(
    { length: 30 },
    (_, i) => `<purr-option value="o${i}">Item ${i}</purr-option>`,
  ).join("");
  await mount(
    page,
    `<purr-combobox id="probe" label="Probe" value="o25">${items}</purr-combobox>`,
  );
  await combo(page, "Probe").focus();
  await page.keyboard.press("ArrowDown");
  await expect(listbox(page)).toBeVisible();
  await expect
    .poll(() =>
      page.locator("#probe").evaluate((el) => {
        const list = el.shadowRoot!.querySelector("[part=listbox]")!;
        const active = el
          .querySelector("[data-active]")!
          .getBoundingClientRect();
        const box = list.getBoundingClientRect();
        return active.top >= box.top && active.bottom <= box.bottom;
      }),
    )
    .toBe(true);
});

test("leaving the field untouched keeps a value that has no visible text", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<purr-combobox id="probe" label="Probe">${abc}</purr-combobox>`,
  );
  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement & { value: string }>(
      "#probe",
    )!;
    (window as unknown as { log: unknown[] }).log = [];
    el.addEventListener("purr-change", (e) =>
      (window as unknown as { log: unknown[] }).log.push(
        (e as CustomEvent).detail,
      ),
    );
    el.value = "zzz";
  });
  await combo(page, "Probe").focus();
  await page.keyboard.press("Tab");
  expect(
    await page
      .locator("#probe")
      .evaluate((el) => (el as never as { value: string }).value),
  ).toBe("zzz");
  expect(await recorded(page)).toEqual([]);
});

test("the chevron changes its border when open under forced colors", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await gotoStory(page, story("default"));
  const border = () =>
    chevron(page).evaluate(
      (el) => getComputedStyle(el, "::before").borderColor,
    );
  const closed = await border();
  await chevron(page).click();
  await expect(chevron(page)).toHaveAttribute("aria-expanded", "true");
  expect(await border()).not.toBe(closed);
});

test("in dark mode the field stands out from the page", async ({ page }) => {
  await gotoStory(page, story("default"), "theme:dark");
  const { field, page: canvas } = await page
    .locator("purr-combobox")
    .evaluate((el) => {
      const shell = getComputedStyle(
        el.shadowRoot!.querySelector("[part=field]")!,
      );
      return {
        field: { fill: shell.backgroundColor, edge: shell.boxShadow },
        page: getComputedStyle(document.body).backgroundColor,
      };
    });
  expect(field.fill).not.toBe(canvas);
  expect(field.edge).not.toBe("none");
});

for (const name of [
  "default",
  "labelled",
  "preselected",
  "placeholder",
  "sizes",
  "disabled",
  "allow-custom",
  "in-form",
  "open",
  "filtered",
  "no-results",
  "rtl",
  "glass",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    // Axe reads colours: zero durations, so no highlight is caught mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const root = await gotoStory(page, story(name));
    await expectAccessible(root);
  });
}

test("a slotted label names the field and wins over the label attribute", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  await expect(combo(page)).toBeVisible();
  await expect(chevron(page)).toBeVisible();
  await expect(page.locator("[slot=label]")).toBeVisible();
  await mount(
    page,
    `<purr-combobox label="Ignored"><span slot="label">Shown</span>${abc}</purr-combobox>`,
  );
  await expect(combo(page, "Shown")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Ignored" })).toHaveCount(0);
});

test("the label attribute names the field when nothing is slotted", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(combo(page)).toBeVisible();
  await expect(page.locator("purr-combobox [slot=label]")).toHaveCount(0);
  await expect(
    page.locator("purr-combobox").locator("[part=label]"),
  ).toBeHidden();
});

test("an external label names the field, even one added later", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<label for="ext">City</label><purr-combobox id="ext">${abc}</purr-combobox><purr-combobox id="late">${abc}</purr-combobox>`,
  );
  await expect(combo(page, "City")).toBeVisible();
  await page.evaluate(() =>
    document.body.insertAdjacentHTML(
      "beforeend",
      '<label for="late">Country</label>',
    ),
  );
  await page.locator("#late").evaluate((el) => (el as HTMLElement).focus());
  await expect(combo(page, "Country")).toBeFocused();
});

test("a combobox without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-combobox");
    bare.innerHTML = "<purr-option>One</purr-option>";
    el.append(bare);
  });
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

test("virtual screen reader speaks the options of the open list", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Fuji");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the field, the chevron and every option are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    const box = (await combo(page).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    const button = (await chevron(page).boundingBox())!;
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(button.height).toBeGreaterThanOrEqual(44);
    for (const item of await page.getByRole("option").all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
