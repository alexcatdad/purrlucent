import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-radio-group--${name}`;

const chosen = (page: Page, id = "#control") =>
  page.locator(id).evaluate((el) => (el as HTMLInputElement).value);

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

const radio = (page: Page, name: string) => page.getByRole("radio", { name });

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("preselected"));
  await expect(root).toMatchAriaSnapshot(`
    - radiogroup "Open folders in":
      - radio "Tabs" [checked]
      - radio "New windows"
      - radio "Split view" [disabled]
  `);
});

test("Tab enters on the chosen radio, arrows move, choose and wrap", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await page.keyboard.press("Tab");
  await expect(radio(page, "Tabs")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(radio(page, "New windows")).toBeFocused();
  expect(await chosen(page)).toBe("windows");
  await page.keyboard.press("ArrowDown"); // skips the disabled radio and wraps
  expect(await chosen(page)).toBe("tabs");
  await page.keyboard.press("ArrowUp");
  expect(await chosen(page)).toBe("windows");
  await page.keyboard.press("ArrowRight");
  expect(await chosen(page)).toBe("tabs");
  await page.keyboard.press("ArrowLeft");
  expect(await chosen(page)).toBe("windows");
});

test("with no choice, Tab enters on the first radio and does not choose it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(radio(page, "Tabs")).toBeFocused();
  expect(await chosen(page)).toBe("");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.querySelector("purr-radio:focus")),
  ).toBeNull();
});

test("only the chosen radio is a tab stop", async ({ page }) => {
  await gotoStory(page, story("preselected"));
  expect(
    await page
      .locator("purr-radio")
      .evaluateAll((els) => els.map((el) => el.getAttribute("tabindex"))),
  ).toEqual(["0", "-1", null]);
});

test("Space chooses the focused radio", async ({ page }) => {
  await gotoStory(page, story("default"));
  await radio(page, "Split view").focus();
  await page.keyboard.press("Space");
  expect(await chosen(page)).toBe("split");
});

test("a click chooses one radio and purr-change fires once", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("#control").evaluate((el) => {
    (window as unknown as { changes: unknown[] }).changes = [];
    el.addEventListener("purr-change", (e) =>
      (window as unknown as { changes: unknown[] }).changes.push(
        (e as CustomEvent).detail,
      ),
    );
  });
  await radio(page, "New windows").click();
  await radio(page, "New windows").click();
  await expect(radio(page, "New windows")).toBeChecked();
  await expect(radio(page, "Tabs")).not.toBeChecked();
  expect(
    await page.evaluate(
      () => (window as unknown as { changes: unknown[] }).changes,
    ),
  ).toEqual([{ selected: ["windows"] }]);
});

test("a click on the label text chooses the radio", async ({ page }) => {
  await gotoStory(page, story("default"));
  const box = (await radio(page, "New windows").boundingBox())!;
  await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);
  expect(await chosen(page)).toBe("windows");
});

test("a disabled radio cannot be chosen or focused", async ({ page }) => {
  await gotoStory(page, story("preselected"));
  await radio(page, "Split view").click({ force: true });
  expect(await chosen(page)).toBe("tabs");
  await expect(radio(page, "Split view")).not.toBeFocused();
});

test("a disabled group takes no focus and does not change", async ({
  page,
}) => {
  await gotoStory(page, story("disabled"));
  await radio(page, "New windows").click({ force: true });
  expect(await chosen(page)).toBe("tabs");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.querySelector("purr-radio:focus")),
  ).toBeNull();
});

test("horizontal radios lie in a row", async ({ page }) => {
  await gotoStory(page, story("horizontal"));
  const [a, b] = await Promise.all(
    ["Tabs", "New windows"].map((name) => radio(page, name).boundingBox()),
  );
  expect(a!.y).toBe(b!.y);
  expect(b!.x).toBeGreaterThan(a!.x);
});

test("the group submits name=value only while a radio is chosen", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([["open", "windows"]]);
  await radio(page, "Large").click();
  expect(await submitted(page)).toEqual([
    ["open", "windows"],
    ["size", "l"],
  ]);
});

test("a form reset returns to the radio marked checked", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  await radio(page, "Tabs").click();
  await radio(page, "Large").click();
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(radio(page, "New windows")).toBeChecked();
  await expect(radio(page, "Tabs")).not.toBeChecked();
  await expect(radio(page, "Large")).not.toBeChecked();
  expect(await chosen(page, "#other")).toBe("");
});

test("a required group makes the form invalid until a radio is chosen", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const valid = () =>
    page
      .locator("#form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  expect(await valid()).toBe(false);
  await radio(page, "Small").click();
  expect(await valid()).toBe(true);
});

test("a disabled fieldset disables the group and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(radio(page, "Tabs")).toHaveAttribute("aria-disabled", "true");
  await radio(page, "Tabs").click({ force: true });
  await expect(radio(page, "New windows")).toBeChecked();
  expect(await submitted(page)).toEqual([]);
});

test("under rtl, ArrowLeft chooses the next radio and ArrowRight the previous", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowLeft");
  expect(await chosen(page)).toBe("windows");
  await page.keyboard.press("ArrowRight");
  expect(await chosen(page)).toBe("tabs");
});

test("the chosen radio stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("preselected"));
  await page.emulateMedia({ forcedColors: "active" });
  const background = (name: string) =>
    radio(page, name).evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="box"]')!)
          .backgroundColor,
    );
  expect(await background("Tabs")).not.toBe(await background("New windows"));
  await page.keyboard.press("Tab");
  expect(
    await radio(page, "Tabs").evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="box"]')!)
          .outlineStyle,
    ),
  ).not.toBe("none");
});

for (const name of [
  "default",
  "preselected",
  "horizontal",
  "sizes",
  "disabled",
  "in-form",
  "rtl",
  "glass",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("horizontal")));
});

test("virtual screen reader speaks the group and each radio", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  expect(await spokenPhrases(page)).toEqual([
    "document",
    "radiogroup, Open folders in",
    "radio, Tabs, checked, position 1, set size 3",
    "radio, New windows, not checked, position 2, set size 3",
    "radio, Split view, not checked, disabled, position 3, set size 3",
    "end of radiogroup, Open folders in",
    "end of document",
  ]);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every radio keeps a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, story("preselected"));
    for (const control of await page.locator("purr-radio").all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

forEachViewport(({ name }) => {
  for (const id of ["preselected", "horizontal", "sizes", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, story(id));
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
