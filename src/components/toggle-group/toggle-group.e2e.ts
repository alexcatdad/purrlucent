import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "components-toggle-group--default";

const selectedValue = (page: Page) =>
  page.locator("#control").evaluate((el) => (el as HTMLInputElement).value);

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.locator("purr-toggle-group-item[selected]")).toHaveCount(1);
  return root;
};

test("aria snapshot", async ({ page }) => {
  const root = await open(page);
  await expect(root).toMatchAriaSnapshot(`
    - radiogroup "Calendar range":
      - radio "Day" [checked]
      - radio "Week"
      - radio "Month"
  `);
});

test("Tab enters on the selected segment, arrows move and select", async ({
  page,
}) => {
  await open(page, "components-toggle-group--preselected");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Month" })).toBeFocused();
  await page.keyboard.press("ArrowRight"); // wraps to the first
  await expect(page.getByRole("radio", { name: "Day" })).toBeFocused();
  expect(await selectedValue(page)).toBe("day");
  await page.keyboard.press("ArrowUp"); // wraps to the last
  expect(await selectedValue(page)).toBe("month");
  await page.keyboard.press("ArrowDown");
  expect(await selectedValue(page)).toBe("day");
  await page.keyboard.press("End");
  expect(await selectedValue(page)).toBe("month");
  await page.keyboard.press("Home");
  expect(await selectedValue(page)).toBe("day");
  await page.keyboard.press("ArrowLeft");
  expect(await selectedValue(page)).toBe("month");
});

test("only the selected segment is a tab stop", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("radio", { name: "Day" })).toBeFocused();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.querySelector("purr-toggle-group-item:focus"),
    ),
  ).toBeNull();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("radio", { name: "Day" })).toBeFocused();
});

test("Space selects the focused segment", async ({ page }) => {
  await open(page);
  await page.getByRole("radio", { name: "Week" }).focus();
  await page.keyboard.press("Space");
  expect(await selectedValue(page)).toBe("week");
});

test("a click selects one segment and purr-change fires once", async ({
  page,
}) => {
  await open(page);
  await page.locator("#control").evaluate((el) => {
    (window as unknown as { changes: unknown[] }).changes = [];
    el.addEventListener("purr-change", (e) =>
      (window as unknown as { changes: unknown[] }).changes.push(
        (e as CustomEvent).detail,
      ),
    );
  });
  await page.getByRole("radio", { name: "Week" }).click();
  await page.getByRole("radio", { name: "Week" }).click();
  await expect(page.getByRole("radio", { name: "Week" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("radio", { name: "Day" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { changes: unknown[] }).changes,
    ),
  ).toEqual([{ selected: ["week"] }]);
});

test("a selection is required: the selected segment cannot be cleared", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("radio", { name: "Day" }).click();
  await expect(page.getByRole("radio", { name: "Day" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(await selectedValue(page)).toBe("day");
  await page.locator("#control").evaluate((el) => {
    (el as HTMLInputElement).value = "nonsense";
  });
  await expect.poll(() => selectedValue(page)).toBe("day");
});

// Review Focus 2: arrows follow the visual direction.
test("under rtl, ArrowLeft selects the next segment and ArrowRight the previous", async ({
  page,
}) => {
  await open(page, "components-toggle-group--rtl");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowLeft");
  expect(await selectedValue(page)).toBe("week");
  await page.keyboard.press("ArrowRight");
  expect(await selectedValue(page)).toBe("day");
  const [day, month] = await Promise.all(
    ["Day", "Month"].map((name) =>
      page.getByRole("radio", { name }).boundingBox(),
    ),
  );
  expect(day!.x).toBeGreaterThan(month!.x);
});

// Review Focus 3: Windows High Contrast must keep the selection visible.
test("the selected segment stays visible under forced colors", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
  ).toBe(true);
  const background = (name: string) =>
    page
      .getByRole("radio", { name })
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.cssText = "background: Highlight; forced-color-adjust: none";
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect.poll(() => background("Day")).toBe(highlight);
  expect(await background("Week")).not.toBe(highlight);
});

// Review Focus 5: a tablet in landscape is wide but still touch.
test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer on a wide screen keeps each segment at 44 by 44", async ({
    page,
  }) => {
    await open(page);
    expect(
      await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ).toBe(true);
    for (const name of ["Day", "Week", "Month"]) {
      const box = await page.getByRole("radio", { name }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(await open(page, story, globals));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page));
});

test("virtual screen reader speaks the group and each radio", async ({
  page,
}) => {
  await open(page);
  expect(await spokenPhrases(page)).toEqual([
    "document",
    "radiogroup, Calendar range",
    "radio, Day, checked, position 1, set size 3",
    "radio, Week, not checked, position 2, set size 3",
    "radio, Month, not checked, position 3, set size 3",
    "end of radiogroup, Calendar range",
    "end of document",
  ]);
});

forEachViewport(({ name }) => {
  for (const [label, globals] of [
    ["default", ""],
    ["rtl", "dir:rtl"],
  ] as const) {
    test(`screenshot at ${name} (${label})`, async ({ page }) => {
      const root = await open(page, story, globals);
      await expect(root).toHaveScreenshot(`${label}-${name}.png`);
    });
  }
});
