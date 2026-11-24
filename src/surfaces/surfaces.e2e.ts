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

// Clear glass dims its backdrop to half (brightness(50%)) under a 35% black
// film, so the brightest backdrop shows as mid gray before the film: its labels
// are measured over that and over black, in the dark colors it forces.
test("clear glass dims its backdrop and its labels hold over white or black", async ({
  page,
}) => {
  await openStory(
    page,
    "material:glass;theme:dark",
    "foundations-surfaces--clear",
  );
  const colors = await resolveColors(
    page,
    Object.fromEntries(
      glassForegrounds.map(([role]) => [role, `var(--pl-color-${role})`]),
    ),
  );
  for (const id of ["clear-bar", "clear-panel"]) {
    expect(await backdropFilter(page, id), id).toMatch(
      /brightness\((0\.5|50%)\)/,
    );
    const background = await page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const shown = await compositeOver(page, background, [
      "rgb(128 128 128)",
      "#000",
    ]);
    for (const over of shown)
      for (const [role, need] of glassForegrounds)
        expect(
          contrast(colors[role]!, over),
          `${role} on ${id}`,
        ).toBeGreaterThanOrEqual(need);
  }
});

test("clear glass takes the dark text colors in a light theme too", async ({
  page,
}) => {
  await openStory(
    page,
    "material:glass;theme:light",
    "foundations-surfaces--clear",
  );
  const [clear, body] = await page.evaluate(() =>
    [document.querySelector("#clear-bar")!, document.body].map(
      (el) => getComputedStyle(el).color,
    ),
  );
  expect(clear).not.toBe(body);
  const { light } = await resolveColors(page, { light: clear! });
  expect(contrast(light!, [0, 0, 0])).toBeGreaterThan(
    contrast(light!, [255, 255, 255]),
  );
});

test("a tint changes the glass fill and solid ignores it", async ({ page }) => {
  await openStory(page, "material:glass", "foundations-surfaces--tinted");
  const tinted = await page
    .locator("#bar")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await openStory(page, "material:glass");
  const plain = await page
    .locator("#bar")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tinted).not.toBe(plain);
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

const bodyImage = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundImage);

test("glass stories paint the backdrop", async ({ page }) => {
  await openStory(page, "", "foundations-surfaces--glass");
  // The decorator sets the attribute during render, after the root attaches.
  await expect.poll(() => bodyImage(page)).toContain("radial-gradient");
});

test("solid stories do not", async ({ page }) => {
  await openStory(page);
  // Wait for the story to render, so the read cannot pass before the decorator ran.
  await page.locator("#bar").waitFor();
  expect(await bodyImage(page)).toBe("none");
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
