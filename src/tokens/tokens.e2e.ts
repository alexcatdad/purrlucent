import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  compositeOver,
  contrast,
  resolveColors,
} from "../../e2e/helpers/color.ts";
import { lowContrastText } from "../../e2e/helpers/rendered.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const colorSchemes = [
  { colorScheme: "light", contrast: "no-preference" },
  { colorScheme: "dark", contrast: "no-preference" },
  { colorScheme: "light", contrast: "more" },
  { colorScheme: "dark", contrast: "more" },
] as const;

/** Chromium only: Playwright's emulateMedia has no reduced-transparency option. */
const emulateTransparency = async (
  page: Page,
  value: "reduce" | "no-preference",
) => {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value }],
  });
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-transparency: reduce)").matches,
    ),
  ).toBe(value === "reduce");
};

// The machine's own setting leaks into the browser, so pin it to no preference.
// The decorator pins color-scheme from the theme global, so dark loads it explicitly.
const openMaterials = async (
  page: Page,
  material: "solid" | "glass",
  theme: "light" | "dark",
) => {
  if (test.info().project.name === "chromium")
    await emulateTransparency(page, "no-preference");
  await gotoStory(page, "foundations-tokens--materials", `theme:${theme}`);
  // The preview decorator resets the attribute on render; set ours after it.
  await page.locator("#bar").waitFor();
  await page.evaluate(
    (value) => document.documentElement.setAttribute("pl-material", value),
    material,
  );
};

/** The computed backdrop-filter and the alpha of the computed background. */
const measure = (target: Locator) =>
  target.evaluate((el) => {
    const style = getComputedStyle(el);
    const color = style.backgroundColor;
    // rgba(r, g, b, a) puts alpha last after a comma; rgb(r g b / a), oklch() and color() put it after a slash.
    const [, slash] = color.split("/");
    const commas = color.slice(color.indexOf("(") + 1, -1).split(",");
    const raw = slash ?? (commas.length === 4 ? commas[3] : undefined);
    const alpha = raw === undefined ? 1 : Number.parseFloat(raw);
    return {
      filter: style.backdropFilter,
      alpha: raw?.includes("%") ? alpha / 100 : alpha,
    };
  });

const bar = (page: Page) => measure(page.locator("#bar"));

/** A bare element wearing the control material and the edge, appended after the story renders. */
const addControl = async (page: Page) => {
  await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.id = "control";
    probe.style.cssText =
      "background: var(--pl-material-control); backdrop-filter: var(--pl-material-control-filter); box-shadow: var(--pl-material-edge)";
    document.body.append(probe);
  });
  return page.locator("#control");
};
test("solid mode computes the material filter to none", async ({ page }) => {
  await openMaterials(page, "solid", "light");
  expect((await bar(page)).filter).toBe("none");
});

test("glass mode computes the material filter to a blur", async ({ page }) => {
  await openMaterials(page, "glass", "light");
  const { filter, alpha } = await bar(page);
  expect(filter).toMatch(/^blur\([\d.]+px\) saturate\([\d.]+%?\)$/);
  expect(alpha).toBeLessThan(1);
});

// Review Focus 1: each condition below must make glass render solid and keep contrast.
const expectSolidAndLegible = async (page: Page) => {
  const { filter, alpha } = await bar(page);
  expect(filter).toBe("none");
  expect(alpha).toBe(1);
  const colors = await resolveColors(page, {
    label: "var(--pl-color-foreground)",
    bar: "var(--pl-material-bar)",
  });
  expect(contrast(colors.label!, colors.bar!)).toBeGreaterThanOrEqual(4.5);
};

const reducedTransparencyFallback = async (
  page: Page,
  browserName: string,
  theme: "light" | "dark",
) => {
  test.skip(
    browserName !== "chromium",
    "emulated through the Chromium protocol",
  );
  await openMaterials(page, "glass", theme);
  expect((await bar(page)).filter).not.toBe("none");
  await emulateTransparency(page, "reduce");
  await expectSolidAndLegible(page);
};

// Playwright's Firefox updates matchMedia() for emulated contrast but never
// restyles the page: https://github.com/microsoft/playwright/issues/43916
const FIREFOX_CONTRAST_BUG =
  "Playwright cannot emulate prefers-contrast styling in Firefox (microsoft/playwright#43916)";

const increasedContrastFallback = async (
  page: Page,
  theme: "light" | "dark",
) => {
  await openMaterials(page, "glass", theme);
  expect((await bar(page)).filter).not.toBe("none");
  await page.emulateMedia({ contrast: "more" });
  await expectSolidAndLegible(page);
};

const unsupportedFallback = async (page: Page, theme: "light" | "dark") => {
  await openMaterials(page, "glass", theme);
  expect((await bar(page)).filter).not.toBe("none");
  // A browser cannot be made to drop backdrop-filter, so the shipped file is
  // swapped in with its @supports test pointed at a property nobody has.
  const shipped = readFileSync(`${import.meta.dirname}/tokens.css`, "utf8");
  const unsupported = shipped.replaceAll(
    "backdrop-filter: blur(1px)",
    "pl-unsupported-property: 1",
  );
  expect(unsupported).not.toBe(shipped);
  await page.evaluate((css) => {
    // Storybook's build rewrites the tokens, so retire its copy first.
    for (const sheet of document.styleSheets)
      if ([...sheet.cssRules].some((r) => r.cssText.includes("pl.tokens")))
        sheet.disabled = true;
    document.head.append(
      Object.assign(document.createElement("style"), { textContent: css }),
    );
  }, unsupported);
  await expectSolidAndLegible(page);
};

test.describe("light color scheme", () => {
  test.use({ colorScheme: "light" });

  test("glass falls back to solid under reduced transparency", async ({
    page,
    browserName,
  }) => reducedTransparencyFallback(page, browserName, "light"));

  test("glass falls back to solid under increased contrast", ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "firefox", FIREFOX_CONTRAST_BUG);
    return increasedContrastFallback(page, "light");
  });

  test("glass falls back to solid without backdrop-filter support", ({
    page,
  }) => unsupportedFallback(page, "light"));
});

test.describe("dark color scheme", () => {
  test.use({ colorScheme: "dark" });

  test("glass falls back to solid under reduced transparency in dark", async ({
    page,
    browserName,
  }) => reducedTransparencyFallback(page, browserName, "dark"));

  test("glass falls back to solid under increased contrast in dark", ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "firefox", FIREFOX_CONTRAST_BUG);
    return increasedContrastFallback(page, "dark");
  });

  test("glass falls back to solid without backdrop-filter support in dark", ({
    page,
  }) => unsupportedFallback(page, "dark"));
});

// Contrast pairs: [foreground roles, ground roles, minimum ratio].
// Translucent roles are measured as they show: "<role>/<i>" is that role
// composited over black, grey, white and the page.
const opaque = ["background", "surface", "input"];
const fills = ["muted-1", "muted-2", "muted-3", "muted-pressed"];
const backdrops = ["#000", "#808080", "#fff"];
const tints = ["overlay", "popover"];
const overPage = (roles: string[]) => roles.map((r) => `${r}/3`);
const glass = tints.flatMap((t) => [0, 1, 2, 3].map((i) => `${t}/${i}`));
const text = [
  "foreground",
  "muted-foreground",
  "accent-text",
  "destructive-text",
];
const grounds = [...opaque, ...overPage(fills)];
const pairs = (more: boolean): [string[], string[], number][] => [
  [text, [...grounds, ...glass], 4.5],
  [["ring", "input-border", "selected"], grounds, 3],
  [["accent-foreground"], ["accent"], 4.5],
  [["selected-foreground"], ["selected"], 4.5],
  [["destructive-foreground"], ["destructive"], 4.5],
  // The border is a hairline in default contrast and a real edge under more.
  ...(more
    ? ([[["border"], opaque, 3]] as [string[], string[], number][])
    : []),
];
// Grounds that are translucent are measured as they show over each backdrop.
const translucent = [...tints, ...fills];

test("every text role meets 4.5:1 against background in all four color schemes", async ({
  page,
  browserName,
}) => {
  await gotoStory(page, "foundations-tokens--palette");
  for (const scheme of colorSchemes) {
    const more = scheme.contrast === "more";
    // FIREFOX_CONTRAST_BUG: Firefox would check the default values again.
    if (more && browserName === "firefox") continue;
    await page.emulateMedia(scheme);
    const table = pairs(more);
    const roles = new Set(table.flatMap(([f, g]) => [...f, ...g]));
    const colors = await resolveColors(
      page,
      Object.fromEntries(
        [...roles]
          .filter((role) => !role.includes("/"))
          .map((role) => [role, `var(--pl-color-${role})`]),
      ),
    );
    const pageColor = `rgb(${colors.background!.join(" ")})`;
    for (const role of translucent)
      (
        await compositeOver(page, `var(--pl-color-${role})`, [
          ...backdrops,
          pageColor,
        ])
      ).forEach((shown, i) => (colors[`${role}/${i}`] = shown));
    // A foreground may be translucent too, so it is measured as it shows on each ground.
    for (const [foregrounds, under, need] of table)
      for (const fg of foregrounds) {
        const shown = await compositeOver(
          page,
          `var(--pl-color-${fg})`,
          under.map((bg) => `rgb(${colors[bg]!.join(" ")})`),
        );
        under.forEach((bg, i) =>
          expect(
            contrast(shown[i]!, colors[bg]!),
            `${fg} on ${bg} in ${scheme.colorScheme}, contrast ${scheme.contrast}`,
          ).toBeGreaterThanOrEqual(need),
        );
      }
  }
});

test("the Storybook theme global switches token colors while the OS stays light", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  const barBackground = async (theme: string) => {
    await gotoStory(page, "foundations-tokens--materials", `theme:${theme}`);
    return page
      .locator("#bar")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  };
  expect(await barBackground("dark")).not.toBe(await barBackground("light"));
});

test("glass controls get a material", async ({ page }) => {
  await openMaterials(page, "glass", "light");
  const { filter, alpha } = await measure(await addControl(page));
  expect(filter).toContain("blur");
  expect(alpha).toBeLessThan(1);
});

const rootToken = (page: Page, name: string) =>
  page.evaluate(
    (token) =>
      getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    name,
  );

for (const theme of ["light", "dark"] as const)
  test(`glass edge carries a highlight in ${theme}`, async ({ page }) => {
    await openMaterials(page, "glass", theme);
    // The token holds two inset shadows: the top highlight and the hairline.
    expect(
      (await rootToken(page, "--pl-material-edge")).match(/inset/g),
    ).toHaveLength(2);
    const shadow = await (
      await addControl(page)
    ).evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow.match(/inset/g)).toHaveLength(2);
  });

test("glass controls cast a shadow", async ({ page }) => {
  await openMaterials(page, "glass", "light");
  // The build folds color-mix() into a hex color, so the computed shadow is measured, not the token text.
  const shadow = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.boxShadow = "var(--pl-elevation-control)";
    document.body.append(probe);
    const value = getComputedStyle(probe).boxShadow;
    probe.remove();
    return value;
  });
  expect(shadow).not.toBe("none");
  // rgba(r, g, b, a) puts alpha last after a comma; color(srgb r g b / a) after a slash.
  const color = shadow.match(/(?:rgba?|color)\([^)]*\)/)![0];
  const alpha = color.includes("/")
    ? Number.parseFloat(color.split("/")[1]!)
    : color.startsWith("rgba")
      ? Number.parseFloat(color.split(",")[3]!)
      : 1;
  expect(alpha).toBeGreaterThan(0);
});

// Under a fallback the control keeps its solid-mode look, so it is compared
// with the same probe once the material is switched to solid. The solid face
// is the neutral secondary tint, which is translucent by design.
const expectSolidControl = async (page: Page) => {
  const control = await addControl(page);
  const fallback = await measure(control);
  const shadow = await control.evaluate((el) => getComputedStyle(el).boxShadow);
  const elevation = await rootToken(page, "--pl-elevation-control");
  await page.evaluate(() =>
    document.documentElement.setAttribute("pl-material", "solid"),
  );
  expect(fallback.filter).toBe("none");
  expect(elevation).toBe("none");
  expect(fallback).toEqual(await measure(control));
  expect(shadow).toBe(
    await control.evaluate((el) => getComputedStyle(el).boxShadow),
  );
};

test("reduced transparency makes controls solid", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "emulated through the Chromium protocol",
  );
  await openMaterials(page, "glass", "light");
  await emulateTransparency(page, "reduce");
  await expectSolidControl(page);
});

test("more contrast makes controls solid", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", FIREFOX_CONTRAST_BUG);
  await openMaterials(page, "glass", "light");
  await page.emulateMedia({ contrast: "more" });
  await expectSolidControl(page);
});

// Measured from rendered pixels, so the story's backdrop, the glass tint and the blur all count.
for (const theme of ["light", "dark"] as const)
  test(`text on glass meets contrast over the backdrop in ${theme}`, async ({
    page,
    browserName,
  }) => {
    // The machine's own settings leak into the browser, so pin them to no preference.
    await page.emulateMedia({ colorScheme: theme, contrast: "no-preference" });
    if (browserName === "chromium")
      await emulateTransparency(page, "no-preference");
    await gotoStory(
      page,
      "foundations-surfaces--glass",
      `material:glass;theme:${theme}`,
    );
    await page.locator("#bar").waitFor();
    await page.evaluate(() => document.fonts.ready);
    expect(await lowContrastText(page)).toEqual([]);
  });
