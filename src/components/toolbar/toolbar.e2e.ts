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

/** Tab stops of the enabled items: exactly one should be 0. */
const enabledStops = (page: Page) =>
  page
    .locator("#toolbar purr-button")
    .evaluateAll((els) =>
      els.filter((e) => !e.hasAttribute("disabled")).map((e) => e.tabIndex),
    );

test("disabling the tab stop moves it, and enabling the item keeps one stop", async ({
  page,
}) => {
  await openStory(page);
  const first = page.locator("#toolbar purr-button").first();
  await first.evaluate((el) => ((el as HTMLButtonElement).disabled = true));
  await expect.poll(() => enabledStops(page)).toEqual([0, -1, -1]);
  await first.evaluate((el) => ((el as HTMLButtonElement).disabled = false));
  await expect.poll(() => enabledStops(page)).toEqual([0, -1, -1, -1]);
});

test("hiding the tab stop moves it to a visible item", async ({ page }) => {
  await openStory(page);
  const visibleStops = () =>
    page
      .locator("#toolbar purr-button")
      .evaluateAll((els) =>
        els.filter((e) => !e.hasAttribute("hidden")).map((e) => e.tabIndex),
      );
  const first = page.locator("#toolbar purr-button").first();
  await first.evaluate((el) => el.setAttribute("hidden", ""));
  await expect.poll(visibleStops).toEqual([0, -1, -1]);
  await first.evaluate((el) => el.removeAttribute("hidden"));
  await expect.poll(visibleStops).toEqual([0, -1, -1, -1]);
});

test("an arrow key leaves a field that has no caret, such as a number input", async ({
  page,
}) => {
  await openStory(page);
  await page
    .locator("#toolbar")
    .evaluate((el) =>
      el.insertAdjacentHTML(
        "afterbegin",
        '<input id="count" type="number" aria-label="Count" />',
      ),
    );
  await page.locator("#count").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#count")).not.toBeFocused();
});

test("controls added to or removed from a group keep one tab stop", async ({
  page,
}) => {
  await openStory(page);
  await page.locator("#toolbar purr-toolbar-group").evaluate((group) => {
    const added = document.createElement("purr-button");
    added.setAttribute("aria-label", "Extra");
    group.append(added);
  });
  await expect.poll(() => enabledStops(page)).toEqual([0, -1, -1, -1, -1]);
  await page
    .locator("#toolbar purr-button")
    .first()
    .evaluate((el) => el.remove());
  await expect.poll(() => enabledStops(page)).toEqual([0, -1, -1, -1]);
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

test("warns when an item has no accessible name", async ({ page }) => {
  const logged = await warnings(page, "default");
  const unnamed = () =>
    logged.filter((text) => text.includes("needs an accessible name"));
  expect(unnamed()).toEqual([]);
  await page.locator("#toolbar").evaluate((toolbar) => {
    const add = (name: string | null, text: string) => {
      const button = document.createElement("purr-button");
      if (name) button.setAttribute("aria-label", name);
      button.innerHTML = text;
      toolbar.append(button);
    };
    add("Named", "<svg viewBox='0 0 24 24' aria-hidden='true'></svg>");
    add(null, "Text");
    add(null, "<svg viewBox='0 0 24 24' aria-hidden='true'></svg>");
    const hidden = toolbar.lastElementChild as HTMLElement;
    hidden.setAttribute("aria-label", "  ");
    hidden.setAttribute("disabled", "");
  });
  await expect
    .poll(unnamed)
    .toEqual([
      "purr-toolbar: an item needs an accessible name (aria-label or text).",
    ]);
  // Another update does not repeat the warning for the same element.
  await page.locator("#toolbar").evaluate((toolbar) => {
    toolbar.lastElementChild!.setAttribute("data-touched", "");
    (toolbar as never as { requestUpdate(): void }).requestUpdate();
  });
  await page
    .locator("#toolbar")
    .evaluate(
      (toolbar) =>
        (toolbar as never as { updateComplete: Promise<unknown> })
          .updateComplete,
    );
  expect(unnamed()).toHaveLength(1);
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

/** The accessible name of the focused item; a text field is named by its label. */
const focusedName = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return (
      el?.getAttribute("aria-label") ??
      el?.getAttribute("label") ??
      el?.textContent?.trim()
    );
  });

/** What `value`, written with tokens, computes to as the given property. */
const resolve = (page: Page, property: "color" | "width", value: string) =>
  page.evaluate(
    ([name, css]) => {
      const probe = document.createElement("div");
      probe.style.setProperty(name!, css!);
      document.body.append(probe);
      const result = getComputedStyle(probe).getPropertyValue(name!);
      probe.remove();
      return result;
    },
    [property, value],
  );

const searchField = (page: Page) =>
  page.locator("#search").evaluate((el) => {
    const style = getComputedStyle(
      el.shadowRoot!.querySelector("[part=field]")!,
    );
    return {
      background: style.backgroundColor,
      height: style.height,
      borderStyle: style.borderTopStyle,
    };
  });

test("the chrome toolbar announces its groups, separator, search field and prominent item", async ({
  page,
}) => {
  const root = await openStory(page, "chrome");
  await expect(root).toMatchAriaSnapshot(`
    - toolbar "Window":
      - group:
        - button "Back"
        - button "Forward"
      - text: Window Title Subtitle, edited
      - group:
        - button "Add"
        - separator
        - button "More"
      - searchbox "Search"
      - button "Done"
  `);
});

test("a separator is vertical, one pixel wide and drawn in the muted tone", async ({
  page,
}) => {
  await openStory(page, "chrome");
  const rule = page.locator("purr-toolbar-separator");
  await expect(rule).toHaveAttribute("role", "separator");
  await expect(rule).toHaveAttribute("aria-orientation", "vertical");
  const look = await rule.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      width: style.width,
      height: parseFloat(style.height),
      background: style.backgroundColor,
    };
  });
  expect(look.width).toBe("1px");
  expect(look.height).toBeGreaterThan(8);
  expect(look.background).toBe(
    await resolve(page, "color", "var(--purr-color-muted-3)"),
  );
});

test("separators and the title are not tab stops, and the search field is one", async ({
  page,
}) => {
  await openStory(page, "chrome");
  await page.keyboard.press("Tab");
  const names: (string | undefined)[] = [await focusedName(page)];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("ArrowRight");
    names.push(await focusedName(page));
  }
  expect(names).toEqual(["Back", "Forward", "Add", "More", "Search", "Done"]);
  await page.keyboard.press("ArrowRight");
  expect(await focusedName(page)).toBe("Done");
  await page.keyboard.press("Home");
  expect(await focusedName(page)).toBe("Back");
});

test("in the search field the caret keys edit and an arrow at the edge moves on", async ({
  page,
}) => {
  await openStory(page, "chrome");
  const input = page.locator("#search input");
  const caret = () =>
    input.evaluate((el) => (el as HTMLInputElement).selectionStart);
  await input.focus();
  await page.keyboard.type("ab");
  const moveCaret = (position: number) =>
    input.evaluate(
      (el, at) => (el as HTMLInputElement).setSelectionRange(at, at),
      position,
    );
  await page.keyboard.press("ArrowLeft");
  expect(await caret()).toBe(1);
  // Home and End belong to the text, so focus stays.
  await page.keyboard.press("Home");
  await page.keyboard.press("End");
  await expect(input).toBeFocused();
  await moveCaret(2);
  await page.keyboard.press("ArrowRight");
  expect(await focusedName(page)).toBe("Done");
  await page.keyboard.press("ArrowLeft");
  expect(await focusedName(page)).toBe("Search");
  await moveCaret(0);
  await page.keyboard.press("ArrowLeft");
  expect(await focusedName(page)).toBe("More");
});

test("under rtl the arrow toward the end of the text leads out of the field", async ({
  page,
}) => {
  await openStory(page, "chrome-glass-dark-rtl");
  const input = page.locator("#search input");
  await input.focus();
  await page.keyboard.type("ab");
  await page.keyboard.press("ArrowRight");
  await expect(input).toBeFocused();
  await input.evaluate((el) =>
    (el as HTMLInputElement).setSelectionRange(2, 2),
  );
  await page.keyboard.press("ArrowLeft");
  expect(await focusedName(page)).toBe("Done");
});

// A search field with text also shows a Clear button, which is a stop of its own.
test("Tab leaves the toolbar from the search field", async ({ page }) => {
  await openStory(page, "chrome");
  await addNeighbors(page);
  await page.locator("#search input").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#after")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#search input")).toBeFocused();
});

test("typing in the search field does not move focus", async ({ page }) => {
  await openStory(page, "search-field");
  const input = page.locator("#search input");
  await input.focus();
  await page.keyboard.type("x y");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue(/x y/);
});

test("the search field takes the capsule material and the toolbar height", async ({
  page,
}) => {
  await openStory(page, "chrome");
  const field = await searchField(page);
  expect(field.background).toBe(
    await resolve(page, "color", "var(--purr-color-overlay)"),
  );
  expect(field.height).toBe(
    await resolve(page, "width", "var(--purr-size-xl)"),
  );
});

test("a compact toolbar is shorter and uses md controls", async ({ page }) => {
  const measure = async (name: string) => {
    await openStory(page, name);
    return page.evaluate(() => {
      const height = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect().height;
      const field = document
        .querySelector("#search")!
        .shadowRoot!.querySelector("[part=field]")!;
      return {
        bar: height("#toolbar"),
        group: height("purr-toolbar-group"),
        field: field.getBoundingClientRect().height,
      };
    });
  };
  const [xl, md] = [await measure("chrome"), await measure("compact")];
  expect(md.bar).toBeLessThan(xl.bar);
  expect(md.group).toBeLessThan(xl.group);
  expect(md.field).toBeLessThan(xl.field);
  expect(`${md.field}px`).toBe(
    await resolve(page, "width", "var(--purr-size-md)"),
  );
});

test("the title stacks its subtitle, and the compact title puts it beside", async ({
  page,
}) => {
  const layout = async (name: string) => {
    await openStory(page, name);
    return page.locator("purr-toolbar-title").evaluate((el) => {
      const box = (part: string) =>
        el.shadowRoot!.querySelector(`[part=${part}]`)!.getBoundingClientRect();
      return { title: box("title"), subtitle: box("subtitle") };
    });
  };
  const xl = await layout("chrome");
  expect(xl.subtitle.top).toBeGreaterThanOrEqual(xl.title.bottom - 1);
  const md = await layout("compact");
  expect(md.subtitle.top).toBeLessThan(md.title.bottom);
  expect(md.subtitle.left).toBeGreaterThanOrEqual(md.title.right - 1);
});

test("a title without a subtitle shows only the title", async ({ page }) => {
  await openStory(page, "chrome");
  await page
    .locator("purr-toolbar-title [slot=subtitle]")
    .evaluate((el) => el.remove());
  await expect
    .poll(() =>
      page
        .locator("purr-toolbar-title")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector("[part=subtitle]")!)
              .display,
        ),
    )
    .toBe("none");
});

for (const name of [
  "chrome",
  "compact",
  "search-field",
  "chrome-glass-dark-rtl",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await openStory(page, name));
  });
}

test("no horizontal overflow at 200% text zoom in the compact toolbar", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await openStory(page, "compact"));
});

test("virtual screen reader speaks the title and the toolbar items", async ({
  page,
}) => {
  await openStory(page, "chrome");
  const spoken = (await spokenPhrases(page)).join(" | ");
  for (const text of ["toolbar", "Window", "Window Title", "Done"])
    expect(spoken).toContain(text);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every control, including the search field, is at least 44 by 44", async ({
    page,
  }) => {
    await openStory(page, "compact");
    const boxes = await page
      .locator("#toolbar purr-button, #search")
      .evaluateAll((els) =>
        els.map((el) => {
          const box = el.getBoundingClientRect();
          return [box.width, box.height];
        }),
      );
    expect(boxes).toHaveLength(6);
    for (const [width, height] of boxes) {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });
});

test("the search field shows an outline under forced colors", async ({
  page,
}) => {
  await openStory(page, "search-field");
  await page.emulateMedia({ forcedColors: "active" });
  expect((await searchField(page)).borderStyle).toBe("solid");
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
