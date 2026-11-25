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

// Temporary: reports the state the WebKit texture lens reads.
test("DIAGNOSTIC webkit texture lens state", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit");
  const lensRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("lens")) lensRequests.push(r.url());
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => errors.push(`${m.type()}: ${m.text()}`));
  await openStory(
    page,
    "material:glass",
    "foundations-surfaces--background-textures",
  );
  const read = () =>
    page.evaluate(() => {
      const source = document.querySelector<HTMLElement>(
        'div[pl-texture="fine-grid"]',
      )!;
      const bar = source.querySelector("pl-toolbar")!;
      const before = getComputedStyle(source, "::before");
      const style = getComputedStyle(bar);
      return {
        material: document.documentElement.getAttribute("pl-material"),
        vendor: navigator.vendor,
        userAgentData: "userAgentData" in navigator,
        w: bar.offsetWidth,
        h: bar.offsetHeight,
        backdropFilter: style.backdropFilter,
        webkitBackdropFilter: style.getPropertyValue("-webkit-backdrop-filter"),
        beforeContent: before.content,
        beforeImage: before.backgroundImage.slice(0, 60),
        shadowChildren: [...bar.shadowRoot!.children].map((c) => c.localName),
        inlineLens: bar.style.getPropertyValue("--pl-lens"),
      };
    });
  const first = await read();
  await page.waitForTimeout(3000);
  const later = await read();
  expect({ first, later, lensRequests, errors }).toBe("diagnostic");
});

test("textured glass uses the browser default and honors lens overrides", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "firefox");
  await openStory(
    page,
    "material:glass",
    "foundations-surfaces--background-textures",
  );
  const source = page.locator('div[pl-texture="fine-grid"]').first();
  const toolbar = source.locator("pl-toolbar");
  const copy = toolbar.locator('span[pl-texture="fine-grid"]');
  const rim = toolbar.locator("feDisplacementMap");
  const defaultCount = browserName === "chromium" ? 1 : 0;
  await expect(rim).toHaveCount(defaultCount);
  if (browserName === "webkit")
    await expect(copy).toHaveCSS("transform", /^matrix\(1\.064,/);
  expect(
    await copy.evaluate((el) => getComputedStyle(el, "::before").animationName),
  ).toBe("none");
  await source.evaluate((el) => el.setAttribute("pl-texture-lens", "center"));
  await expect(copy).toHaveCSS("transform", /^matrix\(1\.064,/);
  await expect(toolbar.locator("filter")).toHaveCount(0);
  await source.evaluate((el) => el.setAttribute("pl-texture-lens", "rim"));
  await expect(rim).toHaveCount(1);
  await source.evaluate((el) => el.removeAttribute("pl-texture-lens"));
  await expect(rim).toHaveCount(defaultCount);
  await page.emulateMedia({ contrast: "more" });
  await expect(copy).toHaveCount(0);
});

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
// midpoint between them. Glass is thin, as Apple's is, so its floor over any
// backdrop is primary text at 3.5:1 and the focus ring and selection at 3:1.
const glassForegrounds = [
  ["foreground", 3.5],
  ["ring", 3],
  ["selected", 3],
] as const;

test("glass labels stay legible over any backdrop", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await openStory(page, `material:glass;theme:${theme}`, patterned);
    for (const id of ["bar", "panel", "sheet"]) {
      const background = await page
        .locator(`#${id}`)
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      const shown = await compositeOver(page, background, [
        "#000",
        "#808080",
        "#fff",
      ]);
      // A translucent foreground is measured as it shows on each ground.
      for (const [role, need] of glassForegrounds) {
        const fgs = await compositeOver(
          page,
          `var(--pl-color-${role})`,
          shown.map((over) => `rgb(${over.join(" ")})`),
        );
        shown.forEach((over, i) =>
          expect(
            contrast(fgs[i]!, over),
            `${role} on ${id} in ${theme}`,
          ).toBeGreaterThanOrEqual(need),
        );
      }
    }
  }
});

// Over a checkerboard, glass keeps a frost (4px, light enough that shapes
// behind still read) and a highlight edge, and no stroke.
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
    ).toBeGreaterThanOrEqual(4);
    expect(style.boxShadow, `${id} edge`).toContain("inset");
    expect(style.borderBlockEndStyle, `${id} stroke`).toBe("none");
  }
});

// Clear glass dims its backdrop (brightness(70%)) under a 56% black film. Every
// label holds over the dimmed white (179) and over black, in the dark colors it
// forces, and the primary label also holds over undimmed white, for an engine
// that skips the dim.
const clearForegrounds = [
  ["foreground", 4.5],
  ["muted-foreground", 4.5],
  ["accent-text", 4.5],
  ["destructive-text", 4.5],
  ["ring", 3],
  ["selected", 3],
] as const;

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
      clearForegrounds.map(([role]) => [role, `var(--pl-color-${role})`]),
    ),
  );
  for (const id of ["clear-bar", "clear-panel"]) {
    expect(await backdropFilter(page, id), id).toMatch(
      /brightness\((0\.7|70%)\)/,
    );
    const background = await page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const shown = await compositeOver(page, background, [
      "rgb(179 179 179)",
      "#000",
    ]);
    for (const over of shown)
      for (const [role, need] of clearForegrounds)
        expect(
          contrast(colors[role]!, over),
          `${role} on ${id}`,
        ).toBeGreaterThanOrEqual(need);
    const [undimmed] = await compositeOver(page, background, ["#fff"]);
    expect(
      contrast(colors.foreground!, undimmed!),
      `foreground on ${id} without the dim`,
    ).toBeGreaterThanOrEqual(4.5);
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
