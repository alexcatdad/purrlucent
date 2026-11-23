import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../e2e/helpers/a11y.ts";
import {
  compositeOver,
  contrast,
  resolveColors,
} from "../../e2e/helpers/color.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = "foundations-surfaces--default";

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

const patterned = "foundations-surfaces--patterned-backdrop";

const backdropFilter = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).backdropFilter);

for (const id of ["bar", "panel", "sheet"]) {
  test(`${id} has a backdrop blur under glass and none when solid`, async ({
    page,
  }) => {
    await openStory(page);
    expect(await backdropFilter(page, id)).toBe("none");
    await openStory(page, "material:glass");
    expect(await backdropFilter(page, id)).toMatch(
      /^blur\([\d.]+px\) saturate\([\d.]+%?\)$/,
    );
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

// materials/5: the tint is translucent, so each rendered surface's background
// is composited over the extremes of any backdrop (black, white) and the
// midpoint between them. Its legibility floor: every text role at 4.5:1 and
// the focus ring and selection face at 3:1, the weakest included.
const glassForegrounds = [
  ["label", 4.5],
  ["secondary-label", 4.5],
  ["tertiary-label", 4.5],
  ["accent-text", 4.5],
  ["destructive-text", 4.5],
  ["focus", 3],
  ["selection", 3],
] as const;

test("glass labels stay legible over any backdrop", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await openStory(page, `material:glass;theme:${theme}`, patterned);
    const colors = await resolveColors(
      page,
      Object.fromEntries(
        glassForegrounds.map(([role]) => [role, `var(--pl-color-${role})`]),
      ),
    );
    for (const id of ["bar", "panel", "sheet"]) {
      const background = await page
        .locator(`#${id}`)
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      const shown = await compositeOver(page, background, [
        "#000",
        "#808080",
        "#fff",
      ]);
      for (const over of shown)
        for (const [role, need] of glassForegrounds)
          expect(
            contrast(colors[role]!, over),
            `${role} on ${id} in ${theme}`,
          ).toBeGreaterThanOrEqual(need);
    }
  }
});

// Over a checkerboard, glass keeps a real blur and a highlight edge, and no stroke.
// It does not yet show the tint differs from the plain page background, so
// materials/6 stays pending.
test("glass blurs and edges each surface over a patterned backdrop", async ({
  page,
}) => {
  await openStory(page, "material:glass", patterned);
  for (const id of ["bar", "panel", "sheet"]) {
    const style = await page.locator(`#${id}`).evaluate((el) => {
      const { backdropFilter, boxShadow, borderBlockEndStyle } =
        getComputedStyle(el);
      return { backdropFilter, boxShadow, borderBlockEndStyle };
    });
    expect(
      Number.parseFloat(
        style.backdropFilter.match(/blur\(([\d.]+)px\)/)?.[1] ?? "0",
      ),
      `${id} blur`,
    ).toBeGreaterThanOrEqual(8);
    expect(style.boxShadow, `${id} edge`).toContain("inset");
    expect(style.borderBlockEndStyle, `${id} stroke`).toBe("none");
  }
});

// Forced colors drops box-shadow, so each surface needs a real edge.
test("surfaces keep a visible edge under forced colors", async ({ page }) => {
  await openStory(page);
  await page.emulateMedia({ forcedColors: "active" });
  for (const id of ["bar", "panel", "sheet"]) {
    const edge = await page.locator(`#${id}`).evaluate((el) => {
      const { borderBlockEndStyle, borderBlockEndWidth } = getComputedStyle(el);
      return `${borderBlockEndStyle} ${borderBlockEndWidth}`;
    });
    expect(edge, id).toBe("solid 1px");
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
