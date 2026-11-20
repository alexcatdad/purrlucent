import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = "surfaces--default";

// The machine's own settings leak into the browser, so pin both to no preference.
// Chromium only: Playwright's emulateMedia has no reduced-transparency option.
const openStory = async (page: Page, globals = "") => {
  await page.emulateMedia({ contrast: "no-preference" });
  if (test.info().project.name === "chromium") {
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-reduced-transparency", value: "no-preference" },
      ],
    });
  }
  return gotoStory(page, story, globals);
};

const backdropFilter = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).backdropFilter);

for (const id of ["bar", "panel", "sheet"]) {
  test(`${id} has a backdrop blur under glass and none when solid`, async ({
    page,
  }) => {
    await openStory(page);
    expect(await backdropFilter(page, id)).toBe("none");
    await openStory(page, "material:glass");
    expect(await backdropFilter(page, id)).toMatch(/^blur\(\d+(\.\d+)?px\)$/);
  });
}

test("list row and field shell never have a backdrop filter, glass or not", async ({
  page,
}) => {
  for (const globals of ["", "material:glass"]) {
    await openStory(page, globals);
    for (const id of ["list-row", "field"])
      expect(await backdropFilter(page, id), id).toBe("none");
  }
});

test("aria snapshot", async ({ page }) => {
  const root = await openStory(page);
  await expect(root).toMatchAriaSnapshot(`
    - text: Bar Panel Sheet List row
    - textbox "Name": Whiskers
  `);
});

for (const globals of ["", "material:glass"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "solid"})`, async ({
    page,
  }) => {
    await expectAccessible(await openStory(page, globals));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await openStory(page));
});

test("virtual screen reader speaks every surface", async ({ page }) => {
  await openStory(page);
  expect(await spokenPhrases(page)).toEqual([
    "document",
    "Bar",
    "Panel",
    "Sheet",
    "List row",
    "textbox, Name, Whiskers",
    "end of document",
  ]);
});

forEachViewport(({ name, pointer }) => {
  for (const material of ["solid", "glass"]) {
    test(`screenshot at ${name} in ${material}`, async ({ page }) => {
      const root = await openStory(page, `material:${material}`);
      expect(
        await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
      ).toBe(pointer === "coarse");
      await expect(root).toHaveScreenshot(`${material}-${name}.png`);
    });
  }
});
