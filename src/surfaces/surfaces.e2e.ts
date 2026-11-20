import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../e2e/helpers/matrix.ts";
import {
  compositeOver,
  contrast,
  resolveColors,
} from "../../e2e/helpers/color.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = "surfaces--default";

// The machine's own settings leak into the browser, so pin both to no preference.
// Chromium only: Playwright's emulateMedia has no reduced-transparency option.
const openStory = async (page: Page, globals = "", id = story) => {
  await page.emulateMedia({ contrast: "no-preference" });
  if (test.info().project.name === "chromium") {
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-reduced-transparency", value: "no-preference" },
      ],
    });
  }
  return gotoStory(page, id, globals);
};

const patterned = "surfaces--patterned-backdrop";

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

// materials/5: the tint is translucent, so each rendered surface's own label
// color is checked against its own background over the extremes of any backdrop
// (black, white) and the midpoint between them.
test("glass labels stay legible over any backdrop", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await openStory(page, `material:glass;theme:${theme}`, patterned);
    for (const id of ["bar", "panel", "sheet"]) {
      const { color, backgroundColor } = await page
        .locator(`#${id}`)
        .evaluate((el) => {
          const { color, backgroundColor } = getComputedStyle(el);
          return { color, backgroundColor };
        });
      const label = (await resolveColors(page, { label: color })).label!;
      const shown = await compositeOver(page, backgroundColor, [
        "#000",
        "#808080",
        "#fff",
      ]);
      for (const over of shown)
        expect(
          contrast(label, over),
          `${id} in ${theme}`,
        ).toBeGreaterThanOrEqual(4.5);
    }
  }
});

// Over a checkerboard, glass keeps a real blur, a tint strong enough to hide the
// pattern, and a visible edge. It does not yet show the tint differs from the
// plain page background, so materials/6 stays pending.
test("glass blurs, tints and outlines each surface over a patterned backdrop", async ({
  page,
}) => {
  await openStory(page, "material:glass", patterned);
  for (const id of ["bar", "panel", "sheet"]) {
    const style = await page.locator(`#${id}`).evaluate((el) => {
      const { backdropFilter, backgroundColor, borderBlockEndWidth } =
        getComputedStyle(el);
      return { backdropFilter, backgroundColor, borderBlockEndWidth };
    });
    expect(
      Number.parseFloat(
        style.backdropFilter.match(/blur\((.+)px\)/)?.[1] ?? "0",
      ),
      `${id} blur`,
    ).toBeGreaterThanOrEqual(8);
    // Black and white backdrops differ by (1 - alpha) * 255 per channel.
    const [overBlack, overWhite] = await compositeOver(
      page,
      style.backgroundColor,
      ["#000", "#fff"],
    );
    for (const [i, channel] of overBlack!.entries())
      expect(overWhite![i]! - channel, `${id} tint`).toBeLessThanOrEqual(51);
    expect(Number.parseFloat(style.borderBlockEndWidth), `${id} edge`).toBe(1);
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
  test(`screenshot over a patterned backdrop at ${name}`, async ({ page }) => {
    const root = await openStory(page, "material:glass", patterned);
    await expect(root).toHaveScreenshot(`patterned-${name}.png`);
  });

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
