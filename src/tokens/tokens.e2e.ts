import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

const textRoles = [
  "label",
  "secondary-label",
  "tertiary-label",
  "accent",
  "destructive",
  "success",
  "warning",
];

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
const openMaterials = async (page: Page, material: "solid" | "glass") => {
  if (test.info().project.name === "chromium")
    await emulateTransparency(page, "no-preference");
  await gotoStory(page, "tokens--materials");
  // The preview decorator resets the attribute on render; set ours after it.
  await page.locator("#bar").waitFor();
  await page.evaluate(
    (value) => document.documentElement.setAttribute("purr-material", value),
    material,
  );
};

/** The computed backdrop-filter and the alpha of the computed bar background. */
const bar = (page: Page) =>
  page.locator("#bar").evaluate((el) => {
    const style = getComputedStyle(el);
    const alpha = /\/\s*([\d.]+)(%?)\)/.exec(style.backgroundColor);
    return {
      filter: style.backdropFilter,
      alpha: alpha ? Number(alpha[1]) / (alpha[2] ? 100 : 1) : 1,
    };
  });

/** Resolves a CSS color to 8-bit sRGB through a canvas, so oklch needs no hand-written math. */
const resolveColors = (page: Page, colors: Record<string, string>) =>
  page.evaluate((entries) => {
    const ctx = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    })!;
    return Object.fromEntries(
      Object.entries(entries).map(([key, css]) => {
        const probe = document.createElement("div");
        probe.style.color = css;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = resolved;
        ctx.fillRect(0, 0, 1, 1);
        return [key, [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]];
      }),
    ) as Record<string, [number, number, number]>;
  }, colors);

const luminance = ([r, g, b]: number[]) => {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = (v ?? 0) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!;
};

const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

test("solid mode computes the material filter to none", async ({ page }) => {
  await openMaterials(page, "solid");
  expect((await bar(page)).filter).toBe("none");
});

test("glass mode computes the material filter to a blur", async ({ page }) => {
  await openMaterials(page, "glass");
  const { filter, alpha } = await bar(page);
  expect(filter).toMatch(/^blur\(\d+(\.\d+)?px\)$/);
  expect(alpha).toBeLessThan(1);
});

// Review Focus 1: each condition below must make glass render solid and keep contrast.
const expectSolidAndLegible = async (page: Page) => {
  const { filter, alpha } = await bar(page);
  expect(filter).toBe("none");
  expect(alpha).toBe(1);
  const colors = await resolveColors(page, {
    label: "var(--purr-color-label)",
    bar: "var(--purr-material-bar)",
  });
  expect(contrast(colors.label!, colors.bar!)).toBeGreaterThanOrEqual(4.5);
};

test("glass falls back to solid under reduced transparency", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "emulated through the Chromium protocol",
  );
  await openMaterials(page, "glass");
  expect((await bar(page)).filter).not.toBe("none");
  await emulateTransparency(page, "reduce");
  await expectSolidAndLegible(page);
});

test("glass falls back to solid under increased contrast", async ({ page }) => {
  await openMaterials(page, "glass");
  expect((await bar(page)).filter).not.toBe("none");
  await page.emulateMedia({ contrast: "more" });
  await expectSolidAndLegible(page);
});

test("glass falls back to solid without backdrop-filter support", async ({
  page,
}) => {
  await openMaterials(page, "glass");
  expect((await bar(page)).filter).not.toBe("none");
  // A browser cannot be made to drop backdrop-filter, so the shipped file is
  // swapped in with its @supports test pointed at a property nobody has.
  const shipped = readFileSync(`${import.meta.dirname}/tokens.css`, "utf8");
  const unsupported = shipped.replaceAll(
    "backdrop-filter: blur(1px)",
    "purr-unsupported-property: 1",
  );
  expect(unsupported).not.toBe(shipped);
  await page.evaluate((css) => {
    // Storybook's build rewrites the tokens, so retire its copy first.
    for (const sheet of document.styleSheets)
      if ([...sheet.cssRules].some((r) => r.cssText.includes("purr.tokens")))
        sheet.disabled = true;
    document.head.append(
      Object.assign(document.createElement("style"), { textContent: css }),
    );
  }, unsupported);
  await expectSolidAndLegible(page);
});

test("every text role meets 4.5:1 against background in all four color schemes", async ({
  page,
}) => {
  await gotoStory(page, "tokens--palette");
  for (const scheme of colorSchemes) {
    await page.emulateMedia(scheme);
    const colors = await resolveColors(page, {
      background: "var(--purr-color-background)",
      ...Object.fromEntries(
        textRoles.map((role) => [role, `var(--purr-color-${role})`]),
      ),
    });
    for (const role of textRoles) {
      expect(
        contrast(colors[role]!, colors.background!),
        `${role} in ${scheme.colorScheme}, contrast ${scheme.contrast}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
