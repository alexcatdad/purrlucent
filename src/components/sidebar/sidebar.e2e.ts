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
  return gotoStory(page, `navigation-sidebar--${story}`, globals);
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
    .locator("pl-sidebar")
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

test("selecting an item fires pl-change once", async ({ page }) => {
  await open(page);
  const changes = await page.evaluate(async () => {
    let count = 0;
    document
      .querySelector("#sidebar")
      ?.addEventListener("pl-change", () => count++);
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

test("selecting the already selected item fires no pl-change", async ({
  page,
}) => {
  await open(page);
  const changes = await page.evaluate(() => {
    let count = 0;
    document
      .querySelector("#sidebar")
      ?.addEventListener("pl-change", () => count++);
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
  // The chevron trails the label, so under rtl it sits on the left.
  expect(albums.chevronAtEnd).toBe(false);
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
  expect(await part()).toBe("control");
  await page.keyboard.press("Tab");
  expect(await part()).toBe("disclosure");
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

test("closing a group with Escape fires pl-toggle", async ({ page }) => {
  await open(page, "group-open");
  await page.evaluate(() => {
    const events: boolean[] = [];
    (window as unknown as { toggles: boolean[] }).toggles = events;
    document
      .querySelector("#sidebar")
      ?.addEventListener("pl-toggle", (e) =>
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
        '<pl-sidebar-item id="plain">Plain</pl-sidebar-item>',
      ),
    );
  await page.locator("#home a").focus();
  await page.keyboard.press("End");
  expect(await focusedId(page)).toBe("plain");
});

test("clicking a row without href selects it and fires pl-change", async ({
  page,
}) => {
  await open(page);
  await page
    .locator("#settings")
    .evaluate((el) =>
      el.insertAdjacentHTML(
        "afterend",
        '<pl-sidebar-item id="plain">Plain</pl-sidebar-item>',
      ),
    );
  await page.evaluate(() => {
    const w = window as unknown as { changes: string[] };
    w.changes = [];
    document
      .querySelector("#sidebar")
      ?.addEventListener("pl-change", (e) =>
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
      ?.addEventListener("pl-change", () => count++);
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

test("pl-change fires again after the app moved the selection", async ({
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
      ?.addEventListener("pl-change", () => count++);
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
  await gotoStory(page, "navigation-sidebar--default");
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

  test("the sidebar collapses on a narrow screen and opens as a panel", async ({
    page,
  }) => {
    await open(page);
    expect(
      await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
    ).toBe(true);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await expect(page.locator("#home")).toBeHidden();
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.locator("#home")).toBeVisible();
    const panel = await page
      .getByRole("dialog", { name: "Library" })
      .boundingBox();
    // A panel on the start edge, narrower than the screen, not a full-width bar.
    expect(panel?.x).toBe(0);
    expect(panel?.width).toBeLessThan(390);
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
    await resolve(page, "color", "var(--pl-color-accent-text)"),
  );
  expect(await style(page, icon, "width")).toBe(
    await resolve(page, "width", "var(--pl-icon-md)"),
  );
});

test("item detail text is muted and sits at the trailing end", async ({
  page,
}) => {
  await open(page, "sections");
  const detail = "#today [slot=detail]";
  expect(await style(page, detail, "color")).toBe(
    await resolve(page, "color", "var(--pl-color-muted-foreground)"),
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
        '<pl-sidebar-item id="child" level="2" href="#child">Child</pl-sidebar-item>',
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
        '<pl-sidebar-item id="orphan" level="2" href="#orphan">Orphan</pl-sidebar-item>',
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

/** The ids of the items in the page, in order. */
const order = (page: Page) =>
  page
    .locator("pl-sidebar-item")
    .evaluateAll((items) => items.map((item) => item.id));

/** Collects the `detail` of `name` events on the sidebar in `window.heard`. */
const listen = (page: Page, name: string) =>
  page.evaluate((type) => {
    const events: unknown[] = [];
    (window as unknown as { heard: unknown[] }).heard = events;
    document
      .querySelector("#sidebar")
      ?.addEventListener(type, (event) =>
        events.push((event as CustomEvent).detail),
      );
  }, name);

const heard = (page: Page) =>
  page.evaluate(() => (window as unknown as { heard: unknown[] }).heard);

type Controlled = HTMLElement & { collapsed: boolean; hide(): void };

test.describe("header and footer", () => {
  test("sit outside the navigation landmark, above and below it", async ({
    page,
  }) => {
    await open(page, "header-footer");
    const nav = page.getByRole("navigation", { name: "Library" });
    await expect(nav).toBeVisible();
    // The items are slotted into the landmark; header and footer are not.
    for (const id of ["home", "settings"])
      expect(
        await page
          .locator(`#${id}`)
          .evaluate((el) => !!el.assignedSlot?.closest("nav")),
      ).toBe(true);
    for (const id of ["brand", "version"]) {
      await expect(page.locator(`#${id}`)).toBeVisible();
      expect(
        await page
          .locator(`#${id}`)
          .evaluate((el) => el.assignedSlot?.closest("nav") ?? null),
      ).toBeNull();
    }
    const [head, list, foot] = await Promise.all([
      page.locator("#brand").boundingBox(),
      nav.boundingBox(),
      page.locator("#version").boundingBox(),
    ]);
    expect(head!.y + head!.height).toBeLessThanOrEqual(list!.y + 1);
    expect(foot!.y).toBeGreaterThanOrEqual(list!.y + list!.height - 1);
  });

  test("the footer stays at the bottom of a tall sidebar", async ({ page }) => {
    await open(page, "header-footer");
    await page
      .locator("#sidebar")
      .evaluate((el) => (el.style.height = "400px"));
    const [sidebar, foot] = await Promise.all([
      page.locator("#sidebar").boundingBox(),
      page.locator("#version").boundingBox(),
    ]);
    const gap = sidebar!.y + sidebar!.height - (foot!.y + foot!.height);
    expect(gap).toBeLessThan(48);
  });

  test("collapsing hides them with the navigation", async ({ page }) => {
    await open(page, "header-footer");
    await page.locator("#sidebar").evaluate((el: Controlled) => el.hide());
    await expect(page.locator("#brand")).toBeHidden();
    await expect(page.locator("#version")).toBeHidden();
  });

  test("an empty header and footer take no room", async ({ page }) => {
    await open(page, "default");
    const heights = await page
      .locator("#sidebar")
      .evaluate((el) =>
        [
          ...el.shadowRoot!.querySelectorAll("[part=header], [part=footer]"),
        ].map((part) => part.getBoundingClientRect().height),
      );
    expect(heights).toEqual([0, 0]);
  });

  test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
    await expectAccessible(await open(page, "header-footer"));
  });
});

test.describe("narrow screen as a modal panel", () => {
  test.use({ viewport: { width: 500, height: 800 } });

  test("opening shows a dialog and moves focus to the selected item", async ({
    page,
  }) => {
    await open(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog", { name: "Library" })).toBeVisible();
    await expect.poll(() => focusedId(page)).toBe("home");
  });

  test("the page behind the panel is inert", async ({ page }) => {
    await open(page);
    await page
      .locator("#sidebar")
      .evaluate((el) =>
        el.insertAdjacentHTML(
          "afterend",
          '<button id="outside">Outside</button>',
        ),
      );
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const reached = await page.locator("#outside").evaluate((el) => {
      el.focus();
      return document.activeElement === el;
    });
    expect(reached).toBe(false);
  });

  test("Escape closes the panel, fires pl-collapse and focuses the toggle", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await listen(page, "pl-collapse");
    await page.keyboard.press("Escape");
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Library sidebar" }),
    ).toBeFocused();
    expect(await heard(page)).toEqual([{ collapsed: true }]);
  });

  test("a press on the scrim closes the panel", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // The panel is 256px wide; the scrim covers the rest of the 500px screen.
    await page.mouse.click(450, 400);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Library sidebar" }),
    ).toBeFocused();
  });

  test("a press inside the panel keeps it open", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await page.locator("#settings a").click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Escape inside an open group closes the group, not the panel", async ({
    page,
  }) => {
    await open(page, "group-open");
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator("#recent a").focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("#albums button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("the toggle in the panel closes it and focus returns to the toggle", async ({
    page,
  }) => {
    await open(page);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Library sidebar" }),
    ).toBeFocused();
  });

  test("pl-collapse fires for the first automatic collapse", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const events: boolean[] = [];
      (window as unknown as { collapses: boolean[] }).collapses = events;
      document.addEventListener("pl-collapse", (event) =>
        events.push((event as CustomEvent).detail.collapsed),
      );
    });
    await open(page);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { collapses: boolean[] }).collapses,
        ),
      )
      .toEqual([true]);
  });

  test("collapse-below=0 keeps a narrow sidebar open and inline", async ({
    page,
  }) => {
    await open(page, "external-control");
    await expect(page.locator("#sidebar")).not.toHaveAttribute("collapsed");
    await expect(page.locator("#home")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("collapse-below", () => {
  test.use({ viewport: { width: 800, height: 800 } });

  test("collapses at its own width and reopens when the screen widens", async ({
    page,
  }) => {
    await open(page, "collapse-below");
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(page.locator("#home")).toBeVisible();
  });

  test("the default stays 600: the same width does not collapse it", async ({
    page,
  }) => {
    await open(page);
    await expect(page.locator("#sidebar")).not.toHaveAttribute("collapsed");
    await expect(page.locator("#home")).toBeVisible();
  });

  test("changing collapse-below applies at once", async ({ page }) => {
    await open(page);
    await page
      .locator("#sidebar")
      .evaluate((el) => el.setAttribute("collapse-below", "900"));
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await page
      .locator("#sidebar")
      .evaluate((el) => el.setAttribute("collapse-below", "0"));
    await expect(page.locator("#home")).toBeVisible();
  });
});

test.describe("external control", () => {
  test("no-toggle hides the built-in button", async ({ page }) => {
    await open(page, "external-control");
    await expect(
      page.getByRole("button", { name: /Library sidebar/ }),
    ).toHaveCount(0);
    await expect(page.locator("#home")).toBeVisible();
  });

  test("toggle(), show() and hide() change the state and fire pl-collapse", async ({
    page,
  }) => {
    await open(page, "external-control");
    await listen(page, "pl-collapse");
    await page.locator("#toggle").click();
    await expect(page.locator("#home")).toBeHidden();
    await page.locator("#hide").click();
    await expect(page.locator("#home")).toBeHidden();
    await page.locator("#show").click();
    await expect(page.locator("#home")).toBeVisible();
    await page.locator("#show").click();
    await page.locator("#hide").click();
    await expect(page.locator("#home")).toBeHidden();
    // Hiding a hidden sidebar and showing a shown one change nothing.
    expect(await heard(page)).toEqual([
      { collapsed: true },
      { collapsed: false },
      { collapsed: true },
    ]);
  });

  test("setting collapsed fires no pl-collapse", async ({ page }) => {
    await open(page, "external-control");
    await listen(page, "pl-collapse");
    await page.locator("#sidebar").evaluate((el: Controlled) => {
      el.collapsed = true;
    });
    await expect(page.locator("#home")).toBeHidden();
    expect(await heard(page)).toEqual([]);
  });

  test("the shortcut toggles from anywhere in the page", async ({ page }) => {
    await open(page, "external-control");
    await page.locator("#show").focus();
    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.locator("#home")).toBeHidden();
    await page.keyboard.press("ControlOrMeta+b");
    await expect(page.locator("#home")).toBeVisible();
  });

  test("another key, or the same key without the modifier, does nothing", async ({
    page,
  }) => {
    await open(page, "external-control");
    await page.locator("#show").focus();
    await page.keyboard.press("b");
    await page.keyboard.press("ControlOrMeta+n");
    await expect(page.locator("#home")).toBeVisible();
  });
});

test.describe("router-aware links", () => {
  test("a plain click fires a cancelable pl-navigate that can stop the navigation", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      const events: string[] = [];
      (window as unknown as { heard: string[] }).heard = events;
      document
        .querySelector("#sidebar")
        ?.addEventListener("pl-navigate", (event) => {
          events.push((event as CustomEvent).detail.href);
          event.preventDefault();
        });
    });
    await page.locator("#settings a").click();
    expect(await heard(page)).toEqual(["#settings"]);
    expect(await page.evaluate(() => location.hash)).toBe("");
    // The item still takes the selection.
    await expect(page.locator("#settings a")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("without preventDefault the browser navigates", async ({ page }) => {
    await open(page);
    await listen(page, "pl-navigate");
    await page.locator("#settings a").click();
    expect(await heard(page)).toEqual([{ href: "#settings" }]);
    expect(await page.evaluate(() => location.hash)).toBe("#settings");
  });

  test("Enter on a link fires it too", async ({ page }) => {
    await open(page);
    await listen(page, "pl-navigate");
    await page.locator("#settings a").focus();
    await page.keyboard.press("Enter");
    expect(await heard(page)).toEqual([{ href: "#settings" }]);
  });

  test("a modified click is left to the browser", async ({ page }) => {
    await open(page);
    await listen(page, "pl-navigate");
    await page.locator("#settings a").evaluate((link) => {
      // The page stays put whatever the click would have done.
      document.addEventListener("click", (event) => event.preventDefault());
      link.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          composed: true,
          cancelable: true,
          ctrlKey: true,
        }),
      );
    });
    expect(await heard(page)).toEqual([]);
  });
});

test.describe("rows", () => {
  test("an action item is a button that never takes the selection", async ({
    page,
  }) => {
    await open(page, "rows");
    await expect(page.locator("#new button")).toBeVisible();
    await expect(page.locator("#new a")).toHaveCount(0);
    await listen(page, "pl-change");
    await page.locator("#new button").click();
    await page.locator("#account button").click();
    expect(await heard(page)).toEqual([]);
    await expect(page.locator("#new button")).not.toHaveAttribute(
      "aria-current",
    );
    await expect(page.locator("#new")).not.toHaveAttribute("selected");
  });

  test("an action item's click reaches the app", async ({ page }) => {
    await open(page, "rows");
    await page.evaluate(() => {
      const clicks: string[] = [];
      (window as unknown as { clicks: string[] }).clicks = clicks;
      document
        .querySelector("#new")
        ?.addEventListener("click", () => clicks.push("new"));
    });
    await page.locator("#new button").click();
    expect(
      await page.evaluate(
        () => (window as unknown as { clicks: string[] }).clicks,
      ),
    ).toEqual(["new"]);
  });

  test("selected on an action item is dropped", async ({ page }) => {
    await open(page, "rows");
    await page
      .locator("#new")
      .evaluate((el) => el.setAttribute("selected", ""));
    await expect(page.locator("#new")).not.toHaveAttribute("selected");
  });

  test("an item's own size overrides the sidebar's", async ({ page }) => {
    await open(page, "rows");
    const measure = (id: string) =>
      page.locator(`#${id}`).evaluate((el) => ({
        row: el.getBoundingClientRect().height,
        text: parseFloat(
          getComputedStyle(el.shadowRoot!.querySelector(".control")!).fontSize,
        ),
      }));
    const [md, lg] = [await measure("inbox"), await measure("big")];
    expect(lg.text).toBeGreaterThan(md.text);
    expect(lg.row).toBeGreaterThan(md.row);
  });

  test("a description shows as a smaller muted line under the label", async ({
    page,
  }) => {
    await open(page, "rows");
    const labelBottom = await page.locator("#inbox").evaluate((el) => {
      const text = [...el.childNodes].find(
        (node) =>
          node.nodeType === Node.TEXT_NODE &&
          node.textContent?.trim() === "Inbox",
      )!;
      const range = document.createRange();
      range.selectNodeContents(text);
      return range.getBoundingClientRect().bottom;
    });
    const description = await page
      .locator("#inbox [slot=description]")
      .boundingBox();
    expect(description!.y).toBeGreaterThanOrEqual(labelBottom - 1);
    const style = (selector: string, property: string) =>
      page
        .locator(selector)
        .evaluate(
          (el, name) => getComputedStyle(el).getPropertyValue(name),
          property,
        );
    expect(
      parseFloat(await style("#inbox [slot=description]", "font-size")),
    ).toBeLessThan(
      await page
        .locator("#inbox")
        .evaluate((el) =>
          parseFloat(
            getComputedStyle(el.shadowRoot!.querySelector(".control")!)
              .fontSize,
          ),
        ),
    );
    expect(await style("#inbox [slot=description]", "color")).toBe(
      await resolve(page, "color", "var(--pl-color-muted-foreground)"),
    );
  });

  test("the description is part of the link's name", async ({ page }) => {
    await open(page, "rows");
    await expect(
      page.getByRole("link", { name: /Inbox\s*3 unread/ }),
    ).toBeVisible();
  });

  test("an avatar in the icon slot is sized to the row", async ({ page }) => {
    await open(page, "rows");
    const [avatar, glyph, row] = await Promise.all([
      page.locator("#account pl-avatar").boundingBox(),
      page.locator("#inbox svg").boundingBox(),
      page.locator("#account button").boundingBox(),
    ]);
    expect(avatar!.width).toBeCloseTo(avatar!.height, 0);
    expect(avatar!.width).toBeGreaterThan(glyph!.width);
    expect(avatar!.height).toBeLessThanOrEqual(row!.height);
    expect(avatar!.width).toBeCloseTo(
      parseFloat(await resolve(page, "width", "calc(var(--pl-icon-md) * 1.5)")),
      0,
    );
  });

  for (const globals of ["", "material:glass"]) {
    test(`axe finds no WCAG 2.2 AA violations in rows (${globals || "solid"})`, async ({
      page,
    }) => {
      await expectAccessible(await open(page, "rows", globals));
    });
  }
});

test.describe("reorderable", () => {
  test("level 1 items show a grip only while the sidebar is reorderable", async ({
    page,
  }) => {
    await open(page, "reorderable");
    await expect(page.locator("pl-sidebar-item [part=handle]")).toHaveCount(3);
    await open(page);
    await expect(page.locator("pl-sidebar-item [part=handle]")).toHaveCount(0);
  });

  test("level 2 items have no grip", async ({ page }) => {
    await open(page, "group-open");
    await page
      .locator("#sidebar")
      .evaluate((el) => el.setAttribute("reorderable", ""));
    await expect(page.locator("#home [part=handle]")).toHaveCount(1);
    await expect(page.locator("#recent [part=handle]")).toHaveCount(0);
  });

  test("Alt with an arrow key asks to move the item and moves nothing", async ({
    page,
  }) => {
    await open(page, "reorderable");
    // Use the same items without the story's application-level event handler.
    await page
      .locator("#sidebar")
      .evaluate((el) => el.replaceWith(el.cloneNode(true)));
    await listen(page, "pl-reorder");
    await page.locator("#second a").focus();
    await page.keyboard.press("Alt+ArrowUp");
    await page.keyboard.press("Alt+ArrowDown");
    await expect
      .poll(() => heard(page))
      .toEqual([
        { from: 1, to: 0 },
        { from: 1, to: 2 },
      ]);
    expect(await order(page)).toEqual(["first", "second", "third"]);
  });

  test("it does not go past either end", async ({ page }) => {
    await open(page, "reorderable");
    await listen(page, "pl-reorder");
    await page.locator("#first a").focus();
    await page.keyboard.press("Alt+ArrowUp");
    await page.locator("#third a").focus();
    await page.keyboard.press("Alt+ArrowDown");
    expect(await heard(page)).toEqual([]);
  });

  test("focus stays on the item when the app moves it", async ({ page }) => {
    await open(page, "reorderable");
    await page.locator("#second a").focus();
    await page.keyboard.press("Alt+ArrowUp");
    await expect.poll(() => order(page)).toEqual(["second", "first", "third"]);
    await expect.poll(() => focusedId(page)).toBe("second");
  });

  test("dragging the grip past other items fires pl-reorder with the new place", async ({
    page,
  }) => {
    await open(page, "reorderable");
    await listen(page, "pl-reorder");
    const grip = (await page.locator("#first [part=handle]").boundingBox())!;
    const third = (await page.locator("#third").boundingBox())!;
    const x = grip.x + grip.width / 2;
    await page.mouse.move(x, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, third.y + third.height / 2 + 4, { steps: 6 });
    await expect(page.locator("#first")).toHaveAttribute("data-dragging", "");
    await page.mouse.up();
    await expect(page.locator("#first")).not.toHaveAttribute("data-dragging");
    expect(await heard(page)).toEqual([{ from: 0, to: 2 }]);
    expect(await order(page)).toEqual(["second", "third", "first"]);
    await expect(page.getByRole("menu")).toHaveCount(0);
    expect(
      await page.locator("#first").evaluate((el) => el.style.translate),
    ).toBe("");
  });

  test("a drag that ends where it began fires nothing", async ({ page }) => {
    await open(page, "reorderable");
    await listen(page, "pl-reorder");
    const grip = (await page.locator("#second [part=handle]").boundingBox())!;
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 6, { steps: 3 });
    await page.mouse.up();
    expect(await heard(page)).toEqual([]);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("pressing the grip does not select the item", async ({ page }) => {
    await open(page, "reorderable");
    await listen(page, "pl-change");
    const item = page.locator("#second");
    await item.evaluate((el) => {
      el.addEventListener("click", () => el.setAttribute("data-activated", ""));
    });
    await page.locator("#second [part=handle]").click();
    await expect(page.getByRole("menuitem", { name: "Move up" })).toBeVisible();
    expect(await heard(page)).toEqual([]);
    await expect(item).not.toHaveAttribute("data-activated");
    await expect(page.locator("#second a")).not.toHaveAttribute("aria-current");
  });

  test("the keyboard can open the move menu and dismiss it without moving", async ({
    page,
  }) => {
    await open(page, "reorderable");
    const grip = page.getByRole("button", { name: "Second, show options" });
    await page.locator("#second a").focus();
    await page.keyboard.press("Tab");
    await expect(grip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Move up" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(grip).toBeFocused();
    expect(await order(page)).toEqual(["first", "second", "third"]);
  });

  test("move command availability respects section boundaries", async ({
    page,
  }) => {
    await open(page, "sections");
    await page
      .locator("#sidebar")
      .evaluate((el) => el.setAttribute("reorderable", ""));
    const firstFolder = page.locator("#work [part=handle]");
    await firstFolder.click();
    await expect(
      page.getByRole("menuitem", { name: "Move up" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("menuitem", { name: "Move down" }),
    ).toBeEnabled();
    await page.keyboard.press("Escape");
    await page.locator("#archive [part=handle]").click();
    await expect(
      page.getByRole("menuitem", { name: "Move down" }),
    ).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "Move up" })).toBeEnabled();
  });

  test("loose rows on either side of a section can move past each other", async ({
    page,
  }) => {
    await open(page, "reorderable");
    await page.locator("#sidebar").evaluate((sidebar) => {
      const section = document.createElement("pl-sidebar-section");
      section.label = "Folders";
      section.innerHTML =
        '<pl-sidebar-item id="folder">Folder</pl-sidebar-item>';
      sidebar.querySelector("#second")!.before(section);
      sidebar.querySelector("#third")!.remove();
    });
    await listen(page, "pl-reorder");
    await page.locator("#first [part=handle]").click();
    await page.getByRole("menuitem", { name: "Move down" }).click();
    expect(await heard(page)).toEqual([{ from: 0, to: 1 }]);
    expect(await order(page)).toEqual(["folder", "second", "first"]);
  });

  test("a reorderable item tells assistive technology about the keys", async ({
    page,
  }) => {
    await open(page, "reorderable");
    await expect(page.locator("#second a")).toHaveAttribute(
      "aria-keyshortcuts",
      "Alt+ArrowUp Alt+ArrowDown",
    );
  });

  test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
    await expectAccessible(await open(page, "reorderable"));
  });
});

/** Page width beyond the viewport; 0 when nothing overflows sideways. */
const overflowX = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test.describe("narrow screen beside content", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("the page does not overflow sideways right after load", async ({
    page,
  }) => {
    await open(page, "beside-content");
    expect(await overflowX(page)).toBeLessThanOrEqual(0);
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
  });

  test("the page does not overflow sideways when the window narrows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await open(page, "beside-content");
    await expect(page.locator("#sidebar")).not.toHaveAttribute("collapsed");
    // Read in the same task as the width change, before anything is drawn.
    await page.evaluate(() => {
      const seen: number[] = [];
      (window as unknown as { seen: number[] }).seen = seen;
      matchMedia("(max-width: 600px)").addEventListener("change", () =>
        seen.push(document.documentElement.scrollWidth - innerWidth),
      );
    });
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    const seen = await page.evaluate(
      () => (window as unknown as { seen: number[] }).seen,
    );
    expect(seen.length).toBeGreaterThan(0);
    for (const overflow of seen) expect(overflow).toBeLessThanOrEqual(0);
    expect(await overflowX(page)).toBeLessThanOrEqual(0);
  });

  test("the open panel's host takes no place in the page", async ({ page }) => {
    await open(page, "beside-content");
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.getByRole("dialog", { name: "Library" })).toBeVisible();
    expect(
      await page
        .locator("#sidebar")
        .evaluate((el) => getComputedStyle(el).position),
    ).toBe("fixed");
    const [app, main] = await Promise.all([
      page.locator("#app").evaluate((el) => el.getBoundingClientRect().left),
      page.locator("#main").evaluate((el) => el.getBoundingClientRect().left),
    ]);
    expect(Math.abs(main - app)).toBeLessThanOrEqual(1);
  });
});

test.describe("collapse animation", () => {
  const durations = (page: Page) =>
    page
      .locator("#sidebar")
      .evaluate((el) =>
        getComputedStyle(el).transitionDuration.split(", ").map(parseFloat),
      );

  const width = (page: Page) =>
    page.locator("#sidebar").evaluate((el) => el.getBoundingClientRect().width);

  test("the width follows the duration token", async ({ page }) => {
    await open(page);
    const token = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.transitionDuration = "var(--pl-duration)";
      document.body.append(probe);
      const duration = parseFloat(getComputedStyle(probe).transitionDuration);
      probe.remove();
      return duration;
    });
    expect(token).toBeGreaterThan(0);
    expect(await durations(page)).toContain(token);
    await page.getByRole("button", { name: "Library sidebar" }).click();
    await expect(page.locator("#sidebar")).toHaveAttribute("collapsed", "");
    await expect.poll(() => width(page)).toBeLessThan(100);
  });

  test("nothing animates under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    expect(Math.max(...(await durations(page)))).toBe(0);
    expect(await width(page)).toBeGreaterThan(200);
    // The width is already the collapsed one when the update has finished.
    const collapsed = await page
      .locator("#sidebar")
      .evaluate(
        (
          el: HTMLElement & { hide(): void; updateComplete: Promise<boolean> },
        ) => {
          el.hide();
          return el.updateComplete.then(() => el.getBoundingClientRect().width);
        },
      );
    expect(collapsed).toBeLessThan(100);
  });
});

test("with no-toggle a collapsed sidebar takes no space", async ({ page }) => {
  await open(page, "no-toggle-collapsed");
  expect(
    await page
      .locator("#sidebar")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(1);
  const [app, main] = await Promise.all([
    page.locator("#app").evaluate((el) => el.getBoundingClientRect().left),
    page.locator("#main").evaluate((el) => el.getBoundingClientRect().left),
  ]);
  expect(Math.abs(main - app)).toBeLessThanOrEqual(1);
});

test.describe("reorder grips", () => {
  const grip = (page: Page, id: string) => page.locator(`#${id} [part=handle]`);

  test("a fine pointer sees a grip on hover and on focus only", async ({
    page,
  }) => {
    await open(page, "reorderable");
    expect(
      await page.evaluate(() => matchMedia("(hover: hover)").matches),
    ).toBe(true);
    await page.mouse.move(0, 0);
    await expect(grip(page, "second")).toHaveCSS("opacity", "0");
    await page.locator("#second").hover();
    await expect(grip(page, "second")).toHaveCSS("opacity", "1");
    await expect(grip(page, "third")).toHaveCSS("opacity", "0");
    await page.mouse.move(0, 0);
    await expect(grip(page, "second")).toHaveCSS("opacity", "0");
    await page.locator("#third a").focus();
    await expect(grip(page, "third")).toHaveCSS("opacity", "1");
    await expect(grip(page, "first")).toHaveCSS("opacity", "0");
  });

  test.describe("touch screen", () => {
    test.use({ viewport: { width: 800, height: 800 }, hasTouch: true });

    test("every grip is shown", async ({ page }) => {
      await open(page, "reorderable");
      expect(
        await page.evaluate(
          () =>
            matchMedia("(pointer: coarse)").matches ||
            matchMedia("(hover: none)").matches,
        ),
      ).toBe(true);
      for (const id of ["first", "second", "third"])
        await expect(grip(page, id)).toHaveCSS("opacity", "1");
    });

    test("tapping move commands reorders without selecting the row in RTL", async ({
      page,
    }) => {
      await open(page, "reorderable", "dir:rtl");
      await listen(page, "pl-reorder");
      const handle = grip(page, "second");
      await handle.tap();
      const up = page.getByRole("menuitem", { name: "Move up" });
      const down = page.getByRole("menuitem", { name: "Move down" });
      await up.tap();
      await expect
        .poll(() => order(page))
        .toEqual(["second", "first", "third"]);
      expect(await heard(page)).toEqual([{ from: 1, to: 0 }]);
      await expect(page.locator("#first a")).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(handle).toBeFocused();
      await handle.tap();
      await expect(up).toBeDisabled();
      await down.tap();
      await expect
        .poll(() => order(page))
        .toEqual(["first", "second", "third"]);
    });
  });
});

test.describe("chevron placement", () => {
  /** Left and right edges of the part `selector` inside an item's shadow tree or the item. */
  const edges = (page: Page, id: string, selector: string) =>
    page.locator(`#${id}`).evaluate((host, sel) => {
      const el = host.shadowRoot!.querySelector(sel) ?? host;
      const box = el.getBoundingClientRect();
      return { left: box.left, right: box.right };
    }, selector);
  const iconLeft = (page: Page, id: string) =>
    page.locator(`#${id} svg[slot=icon]`).evaluate((el) => {
      return el.getBoundingClientRect().left;
    });

  test("the icon of a group and of a plain row share an edge", async ({
    page,
  }) => {
    await open(page, "sections");
    expect(
      Math.abs(
        (await iconLeft(page, "work")) - (await iconLeft(page, "archive")),
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("the chevron follows the label", async ({ page }) => {
    await open(page, "sections");
    const [label, chevron] = await Promise.all([
      edges(page, "work", ".label"),
      edges(page, "work", ".chevron"),
    ]);
    expect(chevron.left).toBeGreaterThanOrEqual(label.right - 1);
  });

  test("under rtl the chevron is on the left, after the label", async ({
    page,
  }) => {
    await open(page, "sections", "dir:rtl");
    const [label, chevron] = await Promise.all([
      edges(page, "work", ".label"),
      edges(page, "work", ".chevron"),
    ]);
    expect(chevron.right).toBeLessThanOrEqual(label.left + 1);
  });

  test("the grip does not cover the chevron", async ({ page }) => {
    await open(page, "sections");
    await page
      .locator("#sidebar")
      .evaluate((el) => el.setAttribute("reorderable", ""));
    const [grip, chevron] = await Promise.all([
      edges(page, "work", ".handle"),
      edges(page, "work", ".chevron"),
    ]);
    expect(grip.right).toBeLessThanOrEqual(chevron.left + 1);
  });

  test("the disclosure button of a link follows the link in the tab order", async ({
    page,
  }) => {
    await open(page, "parent-link");
    const [link, button] = await Promise.all([
      edges(page, "albums", ".control"),
      edges(page, "albums", ".disclosure"),
    ]);
    expect(button.left).toBeGreaterThanOrEqual(link.left);
    expect(button.right).toBeLessThanOrEqual(link.right + 1);
    expect(
      await page
        .locator("#albums")
        .evaluate((el) =>
          [...el.shadowRoot!.querySelectorAll("a, button")].map(
            (c) => c.className,
          ),
        ),
    ).toEqual(["control", "disclosure"]);
  });

  test("chevron=start keeps the chevron before the icon", async ({ page }) => {
    await open(page, "chevron-start");
    const [chevron, icon] = await Promise.all([
      edges(page, "work", ".chevron"),
      page
        .locator("#work svg[slot=icon]")
        .evaluate((el) => el.getBoundingClientRect().left),
    ]);
    expect(chevron.right).toBeLessThanOrEqual(icon + 1);
    // Every row reserves the leading chevron column, so icons still align.
    expect(
      Math.abs(
        (await iconLeft(page, "work")) - (await iconLeft(page, "archive")),
      ),
    ).toBeLessThanOrEqual(1);
  });
});

test.describe("truncated labels", () => {
  const long = "Compliance Analytics and Regulatory Reporting for Every Region";
  const control = (page: Page, id: string) => page.locator(`#${id} .control`);
  /** The width the label has, from the shadow tree of an item. */
  const labelWidth = (page: Page, id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => el.shadowRoot!.querySelector(".label")!.clientWidth);

  test("a long label stays on one line with an ellipsis and keeps its full name", async ({
    page,
  }) => {
    await open(page, "truncated-labels");
    const label = page.locator("#long .label");
    await expect(label).toHaveCSS("text-overflow", "ellipsis");
    await expect(label).toHaveCSS("white-space", "nowrap");
    expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    const lines = await page.locator("#long").evaluate((el) => {
      const text = [...el.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE,
      )!;
      const range = document.createRange();
      range.selectNodeContents(text);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
        .size;
    });
    expect(lines).toBe(1);
    await expect(
      page.locator("#long").getByRole("link", { name: new RegExp(`^${long}`) }),
    ).toBeVisible();
  });

  test("the description truncates too", async ({ page }) => {
    await open(page, "truncated-labels");
    const description = page.locator("#long [slot=description]");
    await expect(description).toHaveCSS("text-overflow", "ellipsis");
    expect(
      await description.evaluate((el) => el.scrollWidth > el.clientWidth),
    ).toBe(true);
  });

  test("the full text is a title only while the label is truncated", async ({
    page,
  }) => {
    await open(page, "truncated-labels");
    await page.locator("#long").hover();
    await expect(control(page, "long")).toHaveAttribute(
      "title",
      new RegExp(`^${long}`),
    );
    await page.locator("#short").hover();
    await expect(control(page, "short")).not.toHaveAttribute("title");
  });

  test.describe("reorder grip at a 36px row", () => {
    test.beforeEach(async ({ page }) => {
      await open(page, "truncated-labels");
      await page
        .locator("pl-sidebar")
        .evaluateAll((all) =>
          all.forEach((el) =>
            (el as HTMLElement).style.setProperty("--pl-size-hit-min", "36px"),
          ),
        );
    });

    test("is a fixed width that does not follow the row", async ({ page }) => {
      const row = await page.locator("#sortable-short .control").boundingBox();
      expect(row!.height).toBeGreaterThanOrEqual(35);
      const grip = await page
        .locator("#sortable-short [part=handle]")
        .boundingBox();
      expect(grip!.width).toBeCloseTo(
        parseFloat(
          await resolve(
            page,
            "width",
            "calc(var(--pl-icon-md) + var(--pl-space-2))",
          ),
        ),
        0,
      );
    });

    test("takes no room from the label while hidden", async ({ page }) => {
      await page.mouse.move(0, 0);
      await expect(page.locator("#sortable-long [part=handle]")).toHaveCSS(
        "opacity",
        "0",
      );
      const [plain, sortable] = await Promise.all([
        labelWidth(page, "long"),
        labelWidth(page, "sortable-long"),
      ]);
      expect(Math.abs(plain - sortable)).toBeLessThanOrEqual(1);
    });
  });
});

test.describe("icon gap", () => {
  /** The space between an item's icon and its label, in px. */
  const gap = (page: Page, id: string, icon: string) =>
    page.locator(`#${id}`).evaluate((el, selector) => {
      const end = el.querySelector(selector)!.getBoundingClientRect().right;
      const start = el
        .shadowRoot!.querySelector(".label")!
        .getBoundingClientRect().left;
      return start - end;
    }, icon);

  test("an svg icon keeps the icon gap token from its label, with page margins reset too", async ({
    page,
  }) => {
    await open(page, "sections");
    // Page CSS such as a reset reaches slotted elements, never the shadow tree.
    await page.addStyleTag({ content: "* { margin: 0; }" });
    const token = parseFloat(
      await resolve(page, "width", "var(--pl-gap-icon)"),
    );
    expect(token).toBeGreaterThan(0);
    for (const id of ["today", "work"])
      expect(await gap(page, id, "svg")).toBeGreaterThanOrEqual(token - 1);
  });

  test("an avatar icon keeps it too", async ({ page }) => {
    await open(page, "rows");
    await page.addStyleTag({ content: "* { margin: 0; }" });
    const token = parseFloat(
      await resolve(page, "width", "var(--pl-gap-icon)"),
    );
    expect(await gap(page, "account", "pl-avatar")).toBeGreaterThanOrEqual(
      token - 1,
    );
  });
});

test.describe("an action item as a menu trigger", () => {
  const control = (page: Page) => page.locator("#account button");

  test("the focused control exposes the menu's expanded state", async ({
    page,
  }) => {
    await open(page, "menu-trigger");
    await expect(control(page)).toHaveAttribute("aria-haspopup", "menu");
    await expect(control(page)).toHaveAttribute("aria-expanded", "false");
    await control(page).click();
    await expect(page.locator("#menu")).toHaveAttribute("open", "");
    await expect(control(page)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.locator("#menu")).not.toHaveAttribute("open");
    await expect(control(page)).toHaveAttribute("aria-expanded", "false");
    await expect(control(page)).toBeFocused();
  });

  test("aria-controls points at an element where the browser allows it", async ({
    page,
  }) => {
    await open(page, "menu-trigger");
    await page.locator("#account").evaluate((el) => {
      el.setAttribute("aria-controls", "home");
    });
    await expect
      .poll(() =>
        control(page).evaluate((button) =>
          "ariaControlsElements" in button
            ? ((button.ariaControlsElements as Element[] | null)?.[0]?.id ??
              "none")
            : "unsupported",
        ),
      )
      .toMatch(/^(home|unsupported)$/);
    // No id is copied: one would name nothing inside the item's own tree.
    // (Element reflection itself shows as an empty attribute.)
    expect(
      await control(page).evaluate((button) =>
        button.getAttribute("aria-controls"),
      ),
    ).not.toBe("home");
  });
});

test.describe("a side placement from a sidebar row", () => {
  for (const [dir, globals] of [
    ["ltr", ""],
    ["rtl", "dir:rtl"],
  ] as const)
    test(`the menu clears the sidebar's inline-end edge in ${dir}`, async ({
      page,
    }) => {
      await open(page, "menu-beside-sidebar", globals);
      await page.locator("#account button").click();
      const popup = page.getByRole("menu", { name: "Account" });
      await expect(popup).toBeVisible();
      const edge = (await page.locator("#sidebar").boundingBox())!;
      const box = (await popup.boundingBox())!;
      if (dir === "ltr")
        expect(box.x).toBeGreaterThanOrEqual(edge.x + edge.width - 1);
      else expect(box.x + box.width).toBeLessThanOrEqual(edge.x + 1);
    });
});
