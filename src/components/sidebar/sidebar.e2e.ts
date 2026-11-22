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

/** Shows the sidebar where it collapses on its own (600px or less). */
const expand = async (page: Page) => {
  if ((page.viewportSize()?.width ?? Infinity) <= 600)
    await page.getByRole("button", { name: /^Library sidebar$/ }).click();
};

/** Widens the window and waits until the page has handled the width change. */
const widen = async (page: Page) => {
  await page.evaluate(() => {
    (window as unknown as { widened: Promise<void> }).widened = new Promise(
      (resolve) =>
        matchMedia("(max-width: 600px)").addEventListener(
          "change",
          () => requestAnimationFrame(() => resolve()),
          { once: true },
        ),
    );
  });
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.evaluate(
    () => (window as unknown as { widened: Promise<void> }).widened,
  );
};

/** The id of the item that holds focus. */
const focusedId = (page: Page) =>
  page.evaluate(() => document.activeElement?.id);

test("is a navigation landmark named by its label", async ({ page }) => {
  const root = await open(page);
  await expect(root.getByRole("navigation", { name: "Library" })).toBeVisible();
});

test("toggle-label names the toggle button", async ({ page }) => {
  await open(page, "default");
  await page
    .locator("purr-sidebar")
    .evaluate((el) => el.setAttribute("toggle-label", "Barre latérale"));
  await expect(
    page.getByRole("button", { name: "Barre latérale" }),
  ).toBeVisible();
});

test("aria snapshot", async ({ page }) => {
  const root = await open(page, "group-open");
  await expect(root).toMatchAriaSnapshot(`
    - button "Library sidebar" [expanded]
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
  await page.getByRole("button", { name: "Library sidebar" }).focus();
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
  const toggle = page.getByRole("button", { name: "Library sidebar" });
  await toggle.click();
  await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
  await expect(page.locator("#home")).toBeHidden();
  await page.getByRole("button", { name: "Library sidebar" }).click();
  await expect(page.locator("#home")).toBeVisible();
});

test("the toggle keeps its name and controls the navigation", async ({
  page,
}) => {
  await open(page);
  const toggle = page.getByRole("button", { name: "Library sidebar" });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.locator("#sidebar").evaluate((el) => {
      const id = el.shadowRoot
        ?.querySelector(".toggle")
        ?.getAttribute("aria-controls");
      return el.shadowRoot?.getElementById(id ?? "")?.localName;
    }),
  ).toBe("nav");
});

test("collapsing from outside moves focus from the hidden navigation to the toggle", async ({
  page,
}) => {
  await open(page);
  await page.locator("#settings a").focus();
  await page
    .locator("#sidebar")
    .evaluate((el: HTMLElement & { collapsed: boolean }) => {
      el.collapsed = true;
    });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.querySelector("#sidebar")?.shadowRoot?.activeElement
            ?.className,
      ),
    )
    .toBe("toggle");
});

type Item = HTMLElement & {
  expanded: boolean;
  selected: boolean;
  level: number;
};

test("a group opened or closed from outside shows or hides its children", async ({
  page,
}) => {
  await open(page);
  const albums = page.locator("#albums");
  await albums.evaluate((el: Item) => (el.expanded = true));
  await expect(page.locator("#recent")).toBeVisible();
  await albums.evaluate((el: Item) => (el.expanded = false));
  await expect(page.locator("#recent")).toBeHidden();
});

test("selecting a hidden child from outside opens its group", async ({
  page,
}) => {
  await open(page);
  await page.locator("#home").evaluate((el: Item) => (el.selected = false));
  await page.locator("#favorites").evaluate((el: Item) => (el.selected = true));
  await expect(page.locator("#albums button")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator("#favorites")).toBeVisible();
});

test("changing levels from outside re-derives the disclosure", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator("#albums button[aria-expanded]")).toHaveCount(1);
  for (const id of ["recent", "favorites"])
    await page.locator(`#${id}`).evaluate((el: Item) => (el.level = 1));
  await expect(page.locator("#albums button[aria-expanded]")).toHaveCount(0);
  await expect(page.locator("#recent")).toBeVisible();
});

test("removing the level attribute returns the item to level 1", async ({
  page,
}) => {
  await open(page);
  for (const id of ["recent", "favorites"])
    await page.locator(`#${id}`).evaluate((el) => el.removeAttribute("level"));
  await expect
    .poll(() => page.locator("#recent").evaluate((el: Item) => el.level))
    .toBe(1);
  await expect(page.locator("#albums button[aria-expanded]")).toHaveCount(0);
});

test("a parent row with href is a link that selects, and its chevron button expands it", async ({
  page,
}) => {
  await open(page, "parent-link");
  const link = page.locator("#albums a");
  const button = page.getByRole("button", { name: "Albums, show items" });
  await expect(link).toHaveAttribute("href", "#albums");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  // Browsers without element reflection have no aria-controls to read.
  const controls = await button.evaluate((el) =>
    "ariaControlsElements" in el
      ? (el.ariaControlsElements as Element[] | null)?.map((c) => c.id)
      : null,
  );
  if (controls) expect(controls).toEqual(["recent", "favorites"]);
  await expect(page.locator("#recent")).toBeHidden();

  await link.click();
  await expect(link).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[aria-current]")).toHaveCount(1);
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#recent")).toBeHidden();

  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#recent")).toBeVisible();
  await expect(link).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[aria-current]")).toHaveCount(1);
});

test("toggle-label names a parent row's chevron button", async ({ page }) => {
  await open(page, "parent-link");
  await page
    .locator("#albums")
    .evaluate((el) => el.setAttribute("toggle-label", "Afficher les albums"));
  await expect(
    page.getByRole("button", { name: "Afficher les albums" }),
  ).toBeVisible();
});

test("a parent row's link and chevron button are both tab stops, and arrows pass over them", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "WebKit on macOS skips links on Tab");
  await open(page, "parent-link");
  const part = () =>
    page
      .locator("#albums")
      .evaluate((el) => el.shadowRoot?.activeElement?.className);
  await page.locator("#home a").focus();
  await page.keyboard.press("Tab");
  expect(await focusedId(page)).toBe("albums");
  expect(await part()).toBe("disclosure");
  await page.keyboard.press("Tab");
  expect(await part()).toBe("control");
  await page.keyboard.press("Tab");
  expect(await focusedId(page)).toBe("settings");
  await page.keyboard.press("ArrowUp");
  expect(await focusedId(page)).toBe("albums");
  await page.locator("#albums a").focus();
  await page.keyboard.press("ArrowDown");
  expect(await focusedId(page)).toBe("settings");
});

test("a section heading that wraps grows instead of overflowing", async ({
  page,
}) => {
  await open(page, "sections");
  await expand(page);
  const heading = page.locator("#folders").locator(".heading");
  const before = await heading.evaluate((el) => el.clientHeight);
  await page.locator("#folders").evaluate((el) => {
    el.setAttribute(
      "label",
      "Recently opened documents and shared projects of the whole team",
    );
  });
  // Engines round the two heights differently; a pixel is not an overflow.
  await expect
    .poll(() => heading.evaluate((el) => el.scrollHeight - el.clientHeight))
    .toBeLessThanOrEqual(1);
  await expect
    .poll(() => heading.evaluate((el) => el.clientHeight))
    .toBeGreaterThan(before);
});

test("closing a group with Escape fires purr-toggle", async ({ page }) => {
  await open(page, "group-open");
  await page.evaluate(() => {
    const events: boolean[] = [];
    (window as unknown as { toggles: boolean[] }).toggles = events;
    document
      .querySelector("#sidebar")
      ?.addEventListener("purr-toggle", (e) =>
        events.push((e as CustomEvent).detail.expanded),
      );
  });
  await page.locator("#recent a").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#albums button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { toggles: boolean[] }).toggles,
    ),
  ).toEqual([false]);
});

test("an item without href is a focusable control that arrows reach", async ({
  page,
}) => {
  await open(page);
  await page
    .locator("#settings")
    .evaluate((el) =>
      el.insertAdjacentHTML(
        "afterend",
        '<purr-sidebar-item id="plain">Plain</purr-sidebar-item>',
      ),
    );
  await page.locator("#home a").focus();
  await page.keyboard.press("End");
  expect(await focusedId(page)).toBe("plain");
});

test("clicking a row without href selects it and fires purr-change", async ({
  page,
}) => {
  await open(page);
  await page
    .locator("#settings")
    .evaluate((el) =>
      el.insertAdjacentHTML(
        "afterend",
        '<purr-sidebar-item id="plain">Plain</purr-sidebar-item>',
      ),
    );
  await page.evaluate(() => {
    const w = window as unknown as { changes: string[] };
    w.changes = [];
    document
      .querySelector("#sidebar")
      ?.addEventListener("purr-change", (e) =>
        w.changes.push(
          (e as CustomEvent<{ selected: Element[] }>).detail.selected[0]!.id,
        ),
      );
  });
  await page.locator("#plain button").click();
  await expect(page.locator("#plain button")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator("#home a")).not.toHaveAttribute("aria-current");
  expect(
    await page.evaluate(
      () => (window as unknown as { changes: string[] }).changes,
    ),
  ).toEqual(["plain"]);
});

test("a modified click does not select", async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    let count = 0;
    document
      .querySelector("#sidebar")
      ?.addEventListener("purr-change", () => count++);
    const link = document
      .querySelector("#settings")!
      .shadowRoot!.querySelector("a")!;
    link.addEventListener("click", (e) => e.preventDefault());
    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        composed: true,
        cancelable: true,
        ctrlKey: true,
      }),
    );
    return { count, current: link.hasAttribute("aria-current") };
  });
  expect(result).toEqual({ count: 0, current: false });
});

test("purr-change fires again after the app moved the selection", async ({
  page,
}) => {
  await open(page);
  await page.locator("#settings a").click();
  await page.evaluate(() => {
    const get = (id: string) => document.querySelector<Item>(`#${id}`)!;
    get("home").selected = true;
    get("settings").selected = false;
  });
  const changes = await page.evaluate(async () => {
    let count = 0;
    document
      .querySelector("#sidebar")
      ?.addEventListener("purr-change", () => count++);
    await new Promise((done) => requestAnimationFrame(done));
    document
      .querySelector("#settings")!
      .shadowRoot!.querySelector("a")!
      .click();
    return count;
  });
  expect(changes).toBe(1);
});

test("the selected item gets a stroke under increased contrast", async ({
  page,
}) => {
  await open(page);
  // Set before a load: Firefox does not restyle a loaded page for it.
  await page.emulateMedia({ contrast: "more" });
  await gotoStory(page, "components-sidebar--default");
  const edge = (id: string) =>
    page
      .locator(`#${id} a`)
      .evaluate((el) => getComputedStyle(el, "::before").boxShadow);
  await expect.poll(() => edge("home")).not.toBe("none");
  expect(await edge("settings")).toBe("none");
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
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.locator("#home")).toBeVisible();
    const sidebar = await page.locator("#sidebar").boundingBox();
    const rootBox = await root.boundingBox();
    expect(sidebar?.width).toBeCloseTo(rootBox?.width ?? 0, 0);
  });
});

test.describe("narrow window with a fine pointer", () => {
  test.use({ viewport: { width: 500, height: 800 } });

  test("the sidebar collapses on a narrow window too", async ({ page }) => {
    await open(page);
    expect(
      await page.evaluate(() => matchMedia("(pointer: fine)").matches),
    ).toBe(true);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
  });

  test("widening the window again restores a sidebar that collapsed on its own", async ({
    page,
  }) => {
    await open(page);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(page.locator("#home")).toBeVisible();
  });

  test("a sidebar the person opened stays open when it moves in the page", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await page
      .locator("#sidebar")
      .evaluate((el) => el.parentElement!.append(el));
    await expect(page.locator("#home")).toBeVisible();
  });

  test("a sidebar the person closed stays closed when the window widens", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await widen(page);
    await expect(page.locator("#home")).toBeHidden();
  });

  test("a sidebar the app closed stays closed when the window widens", async ({
    page,
  }) => {
    await open(page);
    const sidebar = page.locator("#sidebar");
    await expect(sidebar).toHaveAttribute("collapsed", "");
    await sidebar.evaluate((el: HTMLElement & { collapsed: boolean }) => {
      el.collapsed = false;
    });
    await expect(page.locator("#home")).toBeVisible();
    await sidebar.evaluate((el: HTMLElement & { collapsed: boolean }) => {
      el.collapsed = true;
    });
    await widen(page);
    await expect(page.locator("#home")).toBeHidden();
  });

  test("a sidebar detached while the window widens reopens when it returns", async ({
    page,
  }) => {
    await open(page);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await page.evaluate(() => {
      const el = document.querySelector("#sidebar")!;
      (window as unknown as { parked: [Element, Element] }).parked = [
        el.parentElement!,
        el,
      ];
      el.remove();
    });
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.evaluate(() => {
      const [parent, el] = (window as unknown as { parked: [Element, Element] })
        .parked;
      parent.append(el);
    });
    await expect(page.locator("#home")).toBeVisible();
  });
});

/** What `value` (a color or length using tokens) computes to on the page. */
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

const style = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate(
      (el, name) => getComputedStyle(el).getPropertyValue(name),
      property,
    );

test("sections are named groups and their items are links", async ({
  page,
}) => {
  const root = await open(page, "sections");
  await expect(root).toMatchAriaSnapshot(`
    - button "Library sidebar" [expanded]
    - navigation "Library":
      - group "Library":
        - link "Inbox Detail"
        - link "Today 12"
        - link "Plain"
      - group "Folders":
        - button "Work" [expanded]
        - link "Reports"
        - link "Archive 3"
  `);
});

test("a section heading is drawn but not read a second time", async ({
  page,
}) => {
  await open(page, "sections");
  const heading = page.locator("#folders").locator(".heading");
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText("Folders");
  await expect(heading).toHaveAttribute("aria-hidden", "true");
});

test("an item icon takes the accent text color and the icon size token", async ({
  page,
}) => {
  await open(page, "sections");
  const icon = "#inbox svg";
  expect(await style(page, icon, "color")).toBe(
    await resolve(page, "color", "var(--purr-color-accent-text)"),
  );
  expect(await style(page, icon, "width")).toBe(
    await resolve(page, "width", "var(--purr-icon-md)"),
  );
});

test("item detail text is muted and sits at the trailing end", async ({
  page,
}) => {
  await open(page, "sections");
  const detail = "#today [slot=detail]";
  expect(await style(page, detail, "color")).toBe(
    await resolve(page, "color", "var(--purr-color-muted-foreground)"),
  );
  const [row, text] = await Promise.all([
    page.locator("#today a").boundingBox(),
    page.locator(detail).boundingBox(),
  ]);
  expect(row!.x + row!.width - (text!.x + text!.width)).toBeLessThan(16);
});

test("an item without an icon keeps the label where the icon column ends", async ({
  page,
}) => {
  await open(page, "sections");
  const left = (selector: string) =>
    page.locator(selector).evaluate((el) => el.getBoundingClientRect().left);
  // Plain has no icon, so its label starts before Today's.
  expect(await left("#plain .label")).toBeLessThan(await left("#today .label"));
});

test("large rows, headings and icons are bigger than the default", async ({
  page,
}) => {
  const measure = async (name: string) => {
    await open(page, name);
    return page.evaluate(() => {
      const item = document.querySelector("#today")!;
      return {
        row: item.getBoundingClientRect().height,
        icon: item.querySelector("svg")!.getBoundingClientRect().width,
        heading: parseFloat(
          getComputedStyle(
            document
              .querySelector("#library")!
              .shadowRoot!.querySelector(".heading")!,
          ).fontSize,
        ),
        text: parseFloat(
          getComputedStyle(item.shadowRoot!.querySelector("a")!).fontSize,
        ),
      };
    });
  };
  const [md, lg] = [await measure("sections"), await measure("large")];
  expect(lg.row).toBeGreaterThan(md.row);
  expect(lg.icon).toBeGreaterThan(md.icon);
  expect(lg.heading).toBeGreaterThan(md.heading);
  expect(lg.text).toBeGreaterThan(md.text);
  await expect(page.locator("#sidebar")).toHaveAttribute("size", "lg");
});

test("arrows, Home and End cross section boundaries", async ({ page }) => {
  await open(page, "sections");
  await page.locator("#inbox a").focus();
  for (const id of ["today", "plain", "work", "reports", "archive"]) {
    await page.keyboard.press("ArrowDown");
    expect(await focusedId(page)).toBe(id);
  }
  await page.keyboard.press("Home");
  expect(await focusedId(page)).toBe("inbox");
  await page.keyboard.press("End");
  expect(await focusedId(page)).toBe("archive");
});

test("Escape in a section closes the group of that section only", async ({
  page,
}) => {
  await open(page, "sections");
  await page.locator("#reports a").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#work button")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(await focusedId(page)).toBe("work");
  await page.locator("#plain a").focus();
  await page.keyboard.press("Escape");
  expect(await focusedId(page)).toBe("plain");
});

test("a level 2 item added to a section makes the item before it a group", async ({
  page,
}) => {
  await open(page, "sections");
  await page
    .locator("#plain")
    .evaluate((el) =>
      el.insertAdjacentHTML(
        "afterend",
        '<purr-sidebar-item id="child" level="2" href="#child">Child</purr-sidebar-item>',
      ),
    );
  await expect(page.locator("#plain button[aria-expanded]")).toHaveCount(1);
  await expect(page.locator("#child")).toBeHidden();
});

test("a level 2 item first in a section does not join the section before it", async ({
  page,
}) => {
  await open(page, "sections");
  await page
    .locator("#folders")
    .evaluate((el) =>
      el.insertAdjacentHTML(
        "afterbegin",
        '<purr-sidebar-item id="orphan" level="2" href="#orphan">Orphan</purr-sidebar-item>',
      ),
    );
  await expect(page.locator("#orphan")).toBeVisible();
  await expect(page.locator("#plain button[aria-expanded]")).toHaveCount(0);
});

test("under rtl the icon sits at the leading edge on the right", async ({
  page,
}) => {
  await open(page, "sections", "dir:rtl");
  const [row, icon, detail] = await Promise.all([
    page.locator("#today a").boundingBox(),
    page.locator("#today svg").boundingBox(),
    page.locator("#today [slot=detail]").boundingBox(),
  ]);
  expect(icon!.x).toBeGreaterThan(row!.x + row!.width / 2);
  expect(detail!.x).toBeLessThan(row!.x + row!.width / 2);
});

test("the selected row keeps its icon and detail readable under forced colors", async ({
  page,
}) => {
  await open(page, "sections");
  await page.emulateMedia({ forcedColors: "active" });
  const color = (selector: string) => style(page, selector, "color");
  const row = await color("#inbox a");
  expect(await color("#inbox svg")).toBe(row);
  expect(await color("#inbox [slot=detail]")).toBe(row);
});

for (const [name, story] of [
  ["sections", "sections"],
  ["large", "large"],
] as const) {
  for (const globals of ["", "material:glass"]) {
    test(`axe finds no WCAG 2.2 AA violations (${name}, ${globals || "solid"})`, async ({
      page,
    }) => {
      await expectAccessible(await open(page, story, globals));
    });
  }
}

test("no horizontal overflow at 200% text zoom with sections", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await open(page, "large"));
});

test("the virtual screen reader speaks the sections as groups", async ({
  page,
}) => {
  await open(page, "sections");
  // The helper does not enter shadow roots, so the groups are checked by role.
  expect(await spokenPhrases(page)).toContain("Inbox");
  await expect(page.getByRole("group", { name: "Folders" })).toBeVisible();
});

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

  test(`large items are at least 44 by 44 with a coarse pointer at ${name}`, async ({
    page,
  }) => {
    await open(page, "large");
    await expand(page);
    const box = await page.locator("#today a").boundingBox();
    if (pointer === "coarse") {
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });

  test(`${name} layout`, async ({ page }) => {
    await open(page);
    // Only a narrow screen collapses on its own, whatever the pointer.
    const narrow = width <= 600;
    await expect(page.locator("#home")).toBeVisible({ visible: !narrow });
    await expect(page.getByRole("button", { name: /Library/ })).toBeVisible();
  });

  for (const material of ["solid", "glass"]) {
    test(`${material} material sets its backdrop filter at ${name}`, async ({
      page,
    }) => {
      await open(page, "group-open", `material:${material}`);
      await expand(page);
      const filter = await page
        .locator("#sidebar")
        .evaluate((el) => getComputedStyle(el).backdropFilter);
      if (material === "glass") expect(filter).not.toBe("none");
      else expect(filter).toBe("none");
    });
  }
});
