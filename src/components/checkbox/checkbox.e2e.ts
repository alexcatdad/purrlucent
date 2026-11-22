import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-checkbox--${name}`;

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
  const root = await gotoStory(page, story("states"));
  await expect(root).toMatchAriaSnapshot(`
    - checkbox "Shared"
    - checkbox "Recents" [checked]
    - checkbox "Tags" [checked=mixed]
    - checkbox "Network" [disabled]
    - checkbox "Favorites" [checked] [disabled]
    - checkbox "Locations" [checked=mixed] [disabled]
    - checkbox "Select all"
  `);
});

test("a click and Space turn the box on and off", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("checkbox", { name: "Recents" });
  await control.click();
  await expect(control).toBeChecked();
  await page.keyboard.press("Space");
  await expect(control).not.toBeChecked();
});

test("Enter does not toggle the box, as with a native checkbox", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("checkbox", { name: "Recents" });
  await control.focus();
  await page.keyboard.press("Enter");
  await expect(control).not.toBeChecked();
});

test("with a wrapping label the box stays beside the first line", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("checkbox", { name: "Recents" });
  const oneLine = (await control.boundingBox())!.height;
  await control.evaluate((el) => {
    el.style.inlineSize = "8rem";
    el.textContent = "Show recent documents in the sidebar and the Dock";
  });
  const [box, line] = await control.evaluate((el) => {
    const part = el.shadowRoot!.querySelector('[part="box"]')!;
    const range = document.createRange();
    range.selectNodeContents(el);
    const first = range.getClientRects()[0]!;
    const b = part.getBoundingClientRect();
    return [b.top + b.height / 2, first.top + first.height / 2];
  });
  expect(Math.abs(box - line)).toBeLessThanOrEqual(1);
  // The row grows for the extra lines; a one-line row keeps its height.
  expect((await control.boundingBox())!.height).toBeGreaterThan(oneLine);
});

test("a click on the label text toggles the box", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("checkbox", { name: "Recents" });
  const box = (await control.boundingBox())!;
  await page.mouse.click(box.x + box.width - 4, box.y + box.height / 2);
  await expect(control).toBeChecked();
});

test("a click on a mixed box makes it checked", async ({ page }) => {
  await gotoStory(page, story("states"));
  const control = page.getByRole("checkbox", { name: "Tags" });
  await control.click();
  await expect(control).toHaveAttribute("aria-checked", "true");
});

test("a disabled box takes no focus and does not change", async ({ page }) => {
  await gotoStory(page, story("states"));
  const control = page.getByRole("checkbox", { name: "Network" });
  await control.click({ force: true });
  await expect(control).not.toBeChecked();
  expect(await control.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
});

test("a disabled box is not focusable by a click or by script", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const control = page.getByRole("checkbox", { name: "Network" });
  await control.click({ force: true });
  await control.evaluate((el) => el.focus());
  await expect(control).not.toBeFocused();
  await expect(control).not.toHaveAttribute("tabindex");
});

test("holding the mouse down on a checked box darkens it past hover", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const control = page.getByRole("checkbox", { name: "Recents" });
  const tint = () =>
    control.evaluate((el) => getComputedStyle(el).getPropertyValue("--_tint"));
  await control.hover();
  expect(await tint()).toContain("8%");
  await page.mouse.down();
  expect(await tint()).toContain("16%");
  await page.mouse.up();
});

test("the form gets the value only while the box is checked", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([["news", "on"]]);
  await page.getByRole("checkbox", { name: "Accept the terms" }).click();
  await page.getByRole("checkbox", { name: "Newsletter" }).click();
  expect(await submitted(page)).toEqual([["terms", "yes"]]);
});

test("a form reset returns each box to its checked attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.getByRole("checkbox", { name: "Accept the terms" }).click();
  await page.getByRole("checkbox", { name: "Newsletter" }).click();
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(
    page.getByRole("checkbox", { name: "Newsletter" }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Accept the terms" }),
  ).not.toBeChecked();
});

test("a required box makes the form invalid until it is checked", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const valid = () =>
    page
      .locator("#form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  expect(await valid()).toBe(false);
  await page.getByRole("checkbox", { name: "Accept the terms" }).click();
  expect(await valid()).toBe(true);
});

test("a disabled fieldset disables the box and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  const control = page.getByRole("checkbox", { name: "Newsletter" });
  await expect(control).toBeDisabled();
  await control.click({ force: true });
  await expect(control).toBeChecked();
  expect(await submitted(page)).toEqual([]);
});

test("the label follows the box and mirrors under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const [box, label] = await page
    .locator("purr-checkbox")
    .first()
    .evaluate((el) => {
      const part = (name: string) =>
        el
          .shadowRoot!.querySelector(`[part="${name}"]`)!
          .getBoundingClientRect().x;
      return [part("box"), part("label")];
    });
  expect(box!).toBeGreaterThan(label!);
});

test("the box keeps its focus ring under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const control = page.locator("#box");
  await expect(control).toBeFocused();
  expect(
    await control.evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="box"]')!)
          .outlineStyle,
    ),
  ).not.toBe("none");
});

test("a checked box stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("states"));
  await page.emulateMedia({ forcedColors: "active" });
  const background = (name: string) =>
    page
      .getByRole("checkbox", { name })
      .evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector('[part="box"]')!)
            .backgroundColor,
      );
  expect(await background("Recents")).not.toBe(await background("Shared"));
});

test("under forced colors a disabled checked box is not drawn as an enabled one", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const box = (name: string) =>
    page.getByRole("checkbox", { name }).evaluate((el) => {
      const part = el.shadowRoot!.querySelector('[part="box"]')!;
      return [
        getComputedStyle(part).backgroundColor,
        part.getBoundingClientRect().width,
      ] as const;
    });
  const [, normalWidth] = await box("Recents");
  // Zero durations, so no colour is read halfway through its transition.
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const [enabled, width] = await box("Recents");
  const [disabled] = await box("Favorites");
  expect(disabled).not.toBe(enabled);
  expect(width).toBe(normalWidth);
});

test("each size draws a larger box than the one before", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  const widths = await Promise.all(
    ["md off", "lg off", "xl off"].map((name) =>
      page
        .getByRole("checkbox", { name })
        .evaluate(
          (el) =>
            el
              .shadowRoot!.querySelector('[part="box"]')!
              .getBoundingClientRect().width,
        ),
    ),
  );
  expect(widths[1]).toBeGreaterThan(widths[0]!);
  expect(widths[2]).toBeGreaterThan(widths[1]!);
});

test("a box without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-checkbox");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare")).toHaveAttribute("role", "checkbox");
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("states")));
});

test("virtual screen reader speaks the role, name and state", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("checkbox, Shared, not checked");
  expect(spoken).toContain("checkbox, Recents, checked");
  expect(spoken).toContain("checkbox, Tags, partially checked");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every box keeps a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, story("states"));
    for (const control of await page.locator("purr-checkbox").all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
