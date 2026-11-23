import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  compositeOver,
  contrast,
  resolveColors,
} from "../../e2e/helpers/color.ts";
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
  await gotoStory(page, "tokens--materials", `theme:${theme}`);
  // The preview decorator resets the attribute on render; set ours after it.
  await page.locator("#bar").waitFor();
  await page.evaluate(
    (value) => document.documentElement.setAttribute("pl-material", value),
    material,
  );
};

/** The computed backdrop-filter and the alpha of the computed bar background. */
const bar = (page: Page) =>
  page.locator("#bar").evaluate((el) => {
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
  await gotoStory(page, "tokens--palette");
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
    await gotoStory(page, "tokens--materials", `theme:${theme}`);
    return page
      .locator("#bar")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  };
  expect(await barBackground("dark")).not.toBe(await barBackground("light"));
});
