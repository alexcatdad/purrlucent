import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

// The machine's own settings leak into the browser, so pin both to no preference.
// Chromium only: Playwright's emulateMedia has no reduced-transparency option.
const open = async (page: Page, story = "default", globals = "") => {
  await page.emulateMedia({ contrast: "no-preference" });
  if (test.info().project.name === "chromium") {
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-reduced-transparency", value: "no-preference" },
      ],
    });
  }
  return gotoStory(page, `components-sidebar--${story}`, globals);
};

/** Shows the sidebar if it collapsed on its own at phone width. */
const expand = async (page: Page) => {
  const show = page.getByRole("button", { name: /^Show / });
  if (await show.isVisible()) await show.click();
};

/** The id of the item that holds focus. */
const focusedId = (page: Page) =>
  page.evaluate(() => document.activeElement?.id);

test("is a navigation landmark named by its label", async ({ page }) => {
  const root = await open(page);
  await expect(root.getByRole("navigation", { name: "Library" })).toBeVisible();
});

test("aria snapshot", async ({ page }) => {
  const root = await open(page, "group-open");
  await expect(root).toMatchAriaSnapshot(`
    - button "Hide Library" [expanded]
    - navigation "Library":
      - link "Home"
      - button "Albums" [expanded]
      - link "Recently added"
      - link "Favorites"
      - link "Settings"
  `);
});

test("the selected item is marked current and stays highlighted", async ({
  page,
}) => {
  await open(page);
  const home = page.locator("#home a");
  await expect(home).toHaveAttribute("aria-current", "page");
  const fill = (id: string) =>
    page
      .locator(`#${id} a`)
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  expect(await fill("home")).not.toBe(await fill("settings"));
  await page.locator("#settings a").click();
  await expect(page.locator("#settings a")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(home).not.toHaveAttribute("aria-current");
  expect(await fill("settings")).not.toBe(await fill("home"));
});

test("selecting an item fires purr-change once", async ({ page }) => {
  await open(page);
  const changes = await page.evaluate(async () => {
    let count = 0;
    document
      .querySelector("#sidebar")
      ?.addEventListener("purr-change", () => count++);
    document
      .querySelector<HTMLElement>("#settings")
      ?.shadowRoot?.querySelector("a")
      ?.click();
    return count;
  });
  expect(changes).toBe(1);
});

test("a group is a disclosure button that Enter and Space toggle", async ({
  page,
}) => {
  await open(page);
  const button = page.locator("#albums button");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#recent")).toBeHidden();
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#recent")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#recent")).toBeHidden();
});

test("a selected child opens its group", async ({ page }) => {
  await open(page, "child-selected");
  await expect(page.locator("#albums button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator("#favorites a")).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("Tab and Shift+Tab visit every button and visible link", async ({
  page,
  browserName,
}) => {
  // WebKit on macOS does not Tab to links by default (system setting).
  test.skip(browserName === "webkit", "WebKit on macOS skips links on Tab");
  await open(page, "group-open");
  await page.getByRole("button", { name: "Hide Library" }).focus();
  const forward = ["home", "albums", "recent", "favorites", "settings"];
  for (const id of forward) {
    await page.keyboard.press("Tab");
    expect(await focusedId(page)).toBe(id);
  }
  for (const id of forward.slice(0, -1).reverse()) {
    await page.keyboard.press("Shift+Tab");
    expect(await focusedId(page)).toBe(id);
  }
});

test("Tab skips the links of a closed group", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "WebKit on macOS skips links on Tab");
  await open(page);
  await page.locator("#albums button").focus();
  await page.keyboard.press("Tab");
  expect(await focusedId(page)).toBe("settings");
});

test("Space and Enter on a link select it and move aria-current", async ({
  page,
}) => {
  await open(page, "group-open");
  for (const [key, id] of [
    ["Space", "recent"],
    ["Enter", "settings"],
  ] as const) {
    await page.locator(`#${id} a`).focus();
    await page.keyboard.press(key);
    await expect(page.locator(`#${id} a`)).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.locator("[aria-current]")).toHaveCount(1);
  }
  await expect(page.locator("#home a")).not.toHaveAttribute("aria-current");
});

test("arrows, Home and End move among visible items", async ({ page }) => {
  await open(page, "group-open");
  // WebKit on macOS does not Tab to links or buttons, so start with focus().
  await page.locator("#home a").focus();
  expect(await focusedId(page)).toBe("home");
  await page.keyboard.press("ArrowDown");
  expect(await focusedId(page)).toBe("albums");
  await page.keyboard.press("ArrowDown");
  expect(await focusedId(page)).toBe("recent");
  await page.keyboard.press("End");
  expect(await focusedId(page)).toBe("settings");
  await page.keyboard.press("ArrowUp");
  expect(await focusedId(page)).toBe("favorites");
  await page.keyboard.press("Home");
  expect(await focusedId(page)).toBe("home");
});

test("arrows skip the items of a closed group", async ({ page }) => {
  await open(page);
  await page.locator("#home a").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  expect(await focusedId(page)).toBe("settings");
});

test("Escape inside a group closes it and focuses its button", async ({
  page,
}) => {
  await open(page, "group-open");
  await page.locator("#recent a").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#albums button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(await focusedId(page)).toBe("albums");
});

test("Escape on an open group button closes it", async ({ page }) => {
  await open(page, "group-open");
  await page.locator("#albums button").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#albums button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(await focusedId(page)).toBe("albums");
});

test("selecting the already selected item fires no purr-change", async ({
  page,
}) => {
  await open(page);
  const changes = await page.evaluate(() => {
    let count = 0;
    document
      .querySelector("#sidebar")
      ?.addEventListener("purr-change", () => count++);
    document
      .querySelector<HTMLElement>("#home")
      ?.shadowRoot?.querySelector("a")
      ?.click();
    return count;
  });
  expect(changes).toBe(0);
});

test("right-to-left mirrors the chevron and the indent", async ({ page }) => {
  await open(page, "group-open", "dir:rtl");
  const side = (id: string) =>
    page.locator(`#${id}`).evaluate((host) => {
      const control = host.shadowRoot?.querySelector(".control");
      const chevron = host.shadowRoot?.querySelector(".chevron");
      const box = (control ?? host).getBoundingClientRect();
      const mid = box.left + box.width / 2;
      return {
        chevronAtEnd: chevron
          ? chevron.getBoundingClientRect().left > mid
          : null,
        paddingRight: control ? getComputedStyle(control).paddingRight : null,
        paddingLeft: control ? getComputedStyle(control).paddingLeft : null,
      };
    });
  const albums = await side("albums");
  expect(albums.chevronAtEnd).toBe(true);
  const recent = await side("recent");
  expect(parseFloat(recent.paddingRight ?? "0")).toBeGreaterThan(
    parseFloat(recent.paddingLeft ?? "0"),
  );
});

test("people can hide and show the sidebar", async ({ page }) => {
  await open(page);
  const toggle = page.getByRole("button", { name: "Hide Library" });
  await toggle.click();
  await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
  await expect(page.locator("#home")).toBeHidden();
  await page.getByRole("button", { name: "Show Library" }).click();
  await expect(page.locator("#home")).toBeVisible();
});

for (const [name, story] of [
  ["closed group", "default"],
  ["open group", "group-open"],
  ["collapsed", "collapsed"],
] as const) {
  for (const globals of ["", "material:glass"]) {
    test(`axe finds no WCAG 2.2 AA violations (${name}, ${globals || "solid"})`, async ({
      page,
    }) => {
      await expectAccessible(await open(page, story, globals));
    });
  }
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page, "group-open"));
});

test("focus ring and selected item stay visible under forced colors", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  await page.locator("#home a").focus();
  await page.keyboard.press("ArrowDown");
  const outline = await page
    .locator("#albums button")
    .evaluate((el) => getComputedStyle(el, "::before").outlineStyle);
  expect(outline).not.toBe("none");
  const selected = await page
    .locator("#home a")
    .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  expect(selected).not.toBe("rgba(0, 0, 0, 0)");
});

test("virtual screen reader speaks every item", async ({ page }) => {
  await open(page, "group-open");
  expect(await spokenPhrases(page)).toEqual([
    "document",
    "Home",
    "Albums",
    "Recently added",
    "Favorites",
    "Settings",
    "end of document",
  ]);
});

test.describe("phone width with a coarse pointer", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the sidebar collapses on a narrow screen and opens full width", async ({
    page,
  }) => {
    const root = await open(page);
    expect(
      await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ).toBe(true);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await expect(page.locator("#home")).toBeHidden();
    await page.getByRole("button", { name: "Show Library" }).click();
    await expect(page.locator("#home")).toBeVisible();
    const sidebar = await page.locator("#sidebar").boundingBox();
    const rootBox = await root.boundingBox();
    expect(sidebar?.width).toBeCloseTo(rootBox?.width ?? 0, 0);
  });
});

for (const [theme, material] of [
  ["dark", "glass"],
  ["light", "solid"],
] as const) {
  test(`screenshot right-to-left in ${theme} ${material}`, async ({ page }) => {
    const root = await open(
      page,
      "group-open",
      `dir:rtl;theme:${theme};material:${material}`,
    );
    await expect(root).toHaveScreenshot(`rtl-${theme}-${material}.png`);
  });
}

forEachViewport(({ name, pointer, width }) => {
  test(`items are at least 44 by 44 with a coarse pointer at ${name}`, async ({
    page,
  }) => {
    await open(page);
    await expand(page);
    const box = await page.locator("#home a").boundingBox();
    if (pointer === "coarse") {
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });

  test(`${name} layout`, async ({ page }) => {
    await open(page);
    // Only phone width with a coarse pointer collapses on its own.
    const narrow = width <= 600 && pointer === "coarse";
    await expect(page.locator("#home")).toBeVisible({ visible: !narrow });
    await expect(page.getByRole("button", { name: /Library/ })).toBeVisible();
  });

  for (const material of ["solid", "glass"]) {
    test(`screenshot at ${name} in ${material}`, async ({ page }) => {
      const root = await open(page, "group-open", `material:${material}`);
      await expand(page);
      // The pixels barely differ, so also check the glass really is on.
      const filter = await page
        .locator("#sidebar")
        .evaluate((el) => getComputedStyle(el).backdropFilter);
      if (material === "glass") expect(filter).not.toBe("none");
      else expect(filter).toBe("none");
      await expect(root).toHaveScreenshot(`${material}-${name}.png`);
    });
  }
});
