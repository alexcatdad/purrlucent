import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-toolbar--${name}`;

// The machine's own settings leak into the browser, so pin both to no preference.
// Chromium only: Playwright's emulateMedia has no reduced-transparency option.
const openStory = async (page: Page, name = "default", globals = "") => {
  await page.emulateMedia({ contrast: "no-preference" });
  if (test.info().project.name === "chromium") {
    const session = await page.context().newCDPSession(page);
    await session.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-reduced-transparency", value: "no-preference" },
      ],
    });
  }
  return gotoStory(page, story(name), globals);
};

const focusedLabel = (page: Page) =>
  page.evaluate(
    () =>
      document.activeElement?.getAttribute("aria-label") ??
      document.activeElement?.textContent?.trim(),
  );

test("the toolbar has the toolbar role and the given label", async ({
  page,
}) => {
  await openStory(page);
  const toolbar = page.locator("#toolbar");
  await expect(toolbar).toHaveAttribute("role", "toolbar");
  await expect(toolbar).toHaveAttribute("aria-label", "Document actions");
});

test("aria snapshot", async ({ page }) => {
  const root = await openStory(page);
  await expect(root).toMatchAriaSnapshot(`
    - toolbar "Document actions":
      - group:
        - button "Search"
        - button "Add"
        - button "More"
      - button "Done"
  `);
});

// Puts a focusable control on each side so Tab has somewhere to go.
const addNeighbors = (page: Page) =>
  page.locator("#toolbar").evaluate((el) => {
    // WebKit's Tab skips plain buttons, so the neighbors set tabindex.
    el.insertAdjacentHTML(
      "beforebegin",
      '<button id="before" tabindex="0">Before</button>',
    );
    el.insertAdjacentHTML(
      "afterend",
      '<button id="after" tabindex="0">After</button>',
    );
  });

test("the toolbar is one tab stop", async ({ page }) => {
  await openStory(page);
  await addNeighbors(page);
  const items = page.locator("#toolbar purr-button");
  await expect(items).toHaveCount(4);
  expect(await items.evaluateAll((els) => els.map((e) => e.tabIndex))).toEqual([
    0, -1, -1, -1,
  ]);
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  expect(await focusedLabel(page)).toBe("Search");
  await page.keyboard.press("Tab");
  await expect(page.locator("#after")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await focusedLabel(page)).toBe("Search");
});

test("arrow keys move between items and Home and End jump to the ends", async ({
  page,
}) => {
  await openStory(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  expect(await focusedLabel(page)).toBe("Add");
  await page.keyboard.press("ArrowRight");
  expect(await focusedLabel(page)).toBe("More");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedLabel(page)).toBe("Add");
  await page.keyboard.press("End");
  expect(await focusedLabel(page)).toBe("Done");
  await page.keyboard.press("ArrowRight");
  expect(await focusedLabel(page)).toBe("Done");
  await page.keyboard.press("Home");
  expect(await focusedLabel(page)).toBe("Search");
});

test("tabbing back into the toolbar returns to the last focused item", async ({
  page,
}) => {
  await openStory(page);
  await addNeighbors(page);
  await page.locator("#before").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  await expect(page.locator("#after")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await focusedLabel(page)).toBe("Add");
});

test("disabled items are skipped", async ({ page }) => {
  await openStory(page, "disabled-item");
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  expect(await focusedLabel(page)).toBe("More");
});

test("under rtl, ArrowRight moves to the previous item", async ({ page }) => {
  await openStory(page, "rtl");
  await page.keyboard.press("Tab");
  await page.keyboard.press("End");
  expect(await focusedLabel(page)).toBe("Done");
  await page.keyboard.press("ArrowRight");
  expect(await focusedLabel(page)).toBe("More");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedLabel(page)).toBe("Done");
});

test("every item has an accessible name and is reached in reading order", async ({
  page,
}) => {
  await openStory(page);
  await page.keyboard.press("Tab");
  const names: (string | undefined)[] = [await focusedLabel(page)];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
    names.push(await focusedLabel(page));
  }
  expect(names).toEqual(["Search", "Add", "More", "Done"]);
  await expectAccessible(page.locator("#toolbar"));
});

const rects = (page: Page) =>
  page.evaluate(() => {
    const box = (e: Element) => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top };
    };
    const toolbar = document.querySelector("#toolbar")!;
    const style = getComputedStyle(toolbar);
    const bar = box(toolbar);
    return {
      // The content box: the bar minus its padding.
      left:
        bar.left +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.paddingLeft),
      right:
        bar.right -
        parseFloat(style.borderRightWidth) -
        parseFloat(style.paddingRight),
      items: [...toolbar.querySelectorAll("purr-button")].map(box),
    };
  });

for (const [dir, name] of [
  ["ltr", "default"],
  ["rtl", "rtl"],
] as const) {
  forEachViewport(({ name: viewport }) => {
    test(`the prominent item sits at the trailing edge (${dir}, ${viewport})`, async ({
      page,
    }) => {
      await openStory(page, name);
      const { left, right, items } = await rects(page);
      const prominent = await page
        .locator("#toolbar purr-button")
        .evaluateAll((els) =>
          els.map((e) => e.getAttribute("variant") === "primary"),
        );
      expect(prominent).toEqual([false, false, false, true]);
      const last = items.at(-1)!;
      expect(
        Math.abs(dir === "ltr" ? right - last.right : last.left - left),
      ).toBeLessThan(1);
      // The others stay at the leading edge, so a gap opens before the prominent item.
      const before = items.at(-2)!;
      expect(
        dir === "ltr" ? last.left - before.right : before.left - last.right,
      ).toBeGreaterThan(8);
    });
  });
}

// pointing-devices/6: adjacent items in a group leave no dead space between hit areas.
for (const [dir, name] of [
  ["ltr", "default"],
  ["rtl", "rtl"],
] as const) {
  forEachViewport(({ name: viewport }) => {
    test(`adjacent group items have no gap between hit areas (${dir}, ${viewport})`, async ({
      page,
    }) => {
      await openStory(page, name);
      const { items } = await rects(page);
      const bar = items.slice(0, -1);
      expect(bar).toHaveLength(3);
      for (const [a, b] of bar.slice(1).map((r, i) => [bar[i]!, r] as const)) {
        expect(a.top).toBe(b.top);
        expect(
          Math.abs(dir === "ltr" ? b.left - a.right : a.left - b.right),
        ).toBeLessThan(0.5);
      }
    });
  });
}

const warnings = async (page: Page, name: string) => {
  const logged: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "warning") logged.push(m.text());
  });
  await openStory(page, name);
  await page.locator("#toolbar").waitFor();
  return logged;
};

test("the default toolbar logs no warning", async ({ page }) => {
  expect(await warnings(page, "default")).toEqual([]);
});

test("two prominent items log a warning", async ({ page }) => {
  expect(await warnings(page, "two-prominent")).toContain(
    "purr-toolbar: A toolbar has at most one prominent item, found 2.",
  );
});

test("a prominent item that is not last logs a warning", async ({ page }) => {
  expect(await warnings(page, "prominent-first")).toContain(
    "purr-toolbar: The prominent item belongs at the trailing end of the toolbar.",
  );
});

test("a toolbar without a label logs a warning and has no aria-label", async ({
  page,
}) => {
  expect(await warnings(page, "no-label")).toContain(
    "purr-toolbar needs a label.",
  );
  await expect(page.locator("#toolbar")).not.toHaveAttribute("aria-label");
});

test("a disabled first item is skipped on first entry", async ({ page }) => {
  await openStory(page, "disabled-first-item");
  await page.keyboard.press("Tab");
  expect(await focusedLabel(page)).toBe("Add");
});

test("the toolbar surface has a backdrop blur under glass and none when solid", async ({
  page,
}) => {
  const filter = () =>
    page
      .locator("#toolbar")
      .evaluate((el) => getComputedStyle(el).backdropFilter);
  await openStory(page);
  expect(await filter()).toBe("none");
  await openStory(page, "default", "material:glass");
  expect(await filter()).toMatch(/^blur\([\d.]+px\) saturate\(/);
});

for (const globals of ["", "material:glass"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "solid"})`, async ({
    page,
  }) => {
    await expectAccessible(await openStory(page, "default", globals));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await openStory(page));
});

test("virtual screen reader speaks the toolbar and every item", async ({
  page,
}) => {
  await openStory(page);
  const spoken = (await spokenPhrases(page)).join(" | ");
  for (const text of [
    "toolbar",
    "Document actions",
    "Search",
    "Add",
    "More",
    "Done",
  ])
    expect(spoken).toContain(text);
});

forEachViewport(({ name, pointer }) => {
  for (const material of ["solid", "glass"]) {
    test(`screenshot at ${name} in ${material}`, async ({ page }) => {
      const root = await openStory(page, "default", `material:${material}`);
      expect(
        await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
      ).toBe(pointer === "coarse");
      await expect(root).toHaveScreenshot(`${material}-${name}.png`);
    });
  }
});
