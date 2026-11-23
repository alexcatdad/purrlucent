// Each form control fires the native input and change events after its own
// pl-* events, with its value already updated, so React's onInput and
// onChange and form libraries see the edit.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

/** Logs the pl-* and native events fired on the host, each with the host's state at that moment. */
const listen = (host: Locator) =>
  host.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    const control = el as HTMLElement & {
      value?: unknown;
      checked?: boolean;
      type?: string;
    };
    for (const type of ["pl-input", "input", "pl-change", "change"])
      el.addEventListener(type, (event) => {
        if (event.target !== el) return;
        const state =
          control.type === "checkbox" ? control.checked : control.value;
        log.push(`${type}:${String(state)}`);
      });
  });

const logged = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

/** The events of one change to `state`, in the order a control fires them. */
const changed = (state: string) => [
  `pl-change:${state}`,
  `input:${state}`,
  `change:${state}`,
];

for (const [name, selector] of [
  ["checkbox", "#box"],
  ["switch", "#switch"],
] as const) {
  test(`a ${name} reads as a checkbox and a click fires input and change`, async ({
    page,
  }) => {
    await gotoStory(page, `components-${name}--default`);
    const host = page.locator(selector);
    expect(await host.evaluate((el) => (el as { type?: string }).type)).toBe(
      "checkbox",
    );
    await listen(host);
    await host.click();
    expect(await logged(page)).toEqual(changed("true"));
  });
}

test("choosing an option in a select fires input and change", async ({
  page,
}) => {
  await gotoStory(page, "components-select--default");
  await listen(page.locator("#select"));
  await page.getByRole("combobox", { name: "Apple variety" }).click();
  await page.getByRole("option", { name: "Gala", exact: true }).click();
  expect(await logged(page)).toEqual(changed("Gala"));
});

test("clearing a combobox fires change, then input", async ({ page }) => {
  await gotoStory(page, "components-combobox--preselected");
  await listen(page.locator("#combo"));
  await page.getByRole("combobox", { name: "Apple variety" }).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  expect(await logged(page)).toEqual([
    "pl-change:",
    "change:",
    "pl-input:",
    "input:",
  ]);
});

test("a click and an arrow key in a radio group each fire input and change", async ({
  page,
}) => {
  await gotoStory(page, "components-radio-group--default");
  await listen(page.locator("#control"));
  await page.getByRole("radio", { name: "New windows" }).click();
  await page.keyboard.press("ArrowDown");
  expect(await logged(page)).toEqual([
    ...changed("windows"),
    ...changed("split"),
  ]);
});

test("choosing a segment in a toggle group fires input and change", async ({
  page,
}) => {
  await gotoStory(page, "components-toggle-group--default");
  await listen(page.locator("#control"));
  await page.getByRole("radio", { name: "Week" }).click();
  expect(await logged(page)).toEqual(changed("week"));
});

test("a key on a slider fires input, then change", async ({ page }) => {
  await gotoStory(page, "components-slider--default");
  const host = page.locator("#slider");
  await listen(host);
  await page.getByRole("slider", { name: "Volume" }).focus();
  await page.keyboard.press("ArrowRight");
  const value = await host.evaluate((el) =>
    String((el as HTMLElement & { value: number }).value),
  );
  expect(value).not.toBe("50");
  expect(await logged(page)).toEqual([
    `pl-input:${value}`,
    `input:${value}`,
    `pl-change:${value}`,
    `change:${value}`,
  ]);
});

test("typing in an input fires one input per edit and change on commit", async ({
  page,
}) => {
  await gotoStory(page, "components-input--default");
  await listen(page.locator("pl-input"));
  await page.getByRole("textbox", { name: "Name" }).pressSequentially("ab");
  await page.keyboard.press("Tab");
  expect(await logged(page)).toEqual([
    "pl-input:a",
    "input:a",
    "pl-input:ab",
    "input:ab",
    "pl-change:ab",
    "change:ab",
  ]);
});

test("the clear button of a search field fires input and change", async ({
  page,
}) => {
  await gotoStory(page, "components-input--search");
  const host = page.locator("pl-input").nth(1);
  await listen(host);
  await host.getByRole("button", { name: "Clear" }).click();
  expect(await logged(page)).toEqual([
    "pl-input:",
    "input:",
    "pl-change:",
    "change:",
  ]);
});

test("typing in a text area fires input and change", async ({ page }) => {
  await gotoStory(page, "components-text-area--default");
  await listen(page.locator("#area"));
  await page.getByRole("textbox", { name: "Message" }).pressSequentially("a");
  await page.keyboard.press("Tab");
  expect(await logged(page)).toEqual([
    "pl-input:a",
    "input:a",
    "pl-change:a",
    "change:a",
  ]);
});

test("a key on a number field fires input and change", async ({ page }) => {
  await gotoStory(page, "components-number-field--steps");
  await listen(page.locator("pl-number-field"));
  await page.getByRole("spinbutton").focus();
  await page.keyboard.press("ArrowUp");
  expect(await logged(page)).toEqual([
    "pl-input:6",
    "input:6",
    "pl-change:6",
    "change:6",
  ]);
});
