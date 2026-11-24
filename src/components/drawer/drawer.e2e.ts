import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

// Motion is measured at rest; the motion test turns it back on.
test.use({ reducedMotion: "reduce" });

const story = (name: string) => `dialogs-drawer--${name}`;

const sheet = (page: Page) => page.getByRole("dialog");
const drawerEl = (page: Page) => page.locator("pl-drawer");
const panel = (page: Page) => drawerEl(page).locator("dialog");
const grabber = (page: Page) => drawerEl(page).locator("[part=grabber]");
const isOpen = (page: Page) =>
  drawerEl(page).evaluate((el) => (el as HTMLElement & { open: boolean }).open);
const detentOf = (page: Page) =>
  drawerEl(page).evaluate(
    (el) => (el as HTMLElement & { detent: string }).detent,
  );
const panelBox = async (page: Page) => (await panel(page).boundingBox())!;
const viewport = (page: Page) => page.viewportSize()!;

/** Records what the drawer fires, as [event, detail] pairs, on window.log. */
const record = (page: Page) =>
  drawerEl(page).evaluate((el) => {
    const log: unknown[][] = [];
    (window as unknown as { log: unknown[][] }).log = log;
    for (const name of ["pl-open", "pl-cancel", "pl-close", "pl-resize"])
      el.addEventListener(name, (event) =>
        log.push([name, (event as CustomEvent).detail ?? null]),
      );
  });
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: unknown[][] }).log);

/** Opens a story that opens itself, and waits for the sheet. */
const opened = async (page: Page, name: string) => {
  const root = await gotoStory(page, story(name));
  await expect(sheet(page)).toBeVisible();
  return root;
};

/** Presses the grabber's middle, drags it `dy` px down, rests, and lets go. */
const drag = async (page: Page, dy: number) => {
  const box = (await grabber(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + dy, { steps: 6 });
  // A pause before release carries no flick.
  await page.waitForTimeout(150);
  await page.mouse.up();
};

test("aria snapshot, bottom sheet", async ({ page }) => {
  const root = await opened(page, "open-bottom");
  await expect(root).toMatchAriaSnapshot(`
    - dialog "Share this photo":
      - button "Close"
      - heading "Share this photo" [level=2]
      - paragraph: Anyone with the link can see it. You can stop sharing at any time.
      - paragraph: The photo is shared at its original size, with its location removed.
      - button "Cancel"
      - button "Share"
  `);
});

test("the drawer is named by its title and described by its description, not its body", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  await expect(sheet(page)).toHaveAccessibleName("Share this photo");
  await expect(sheet(page)).toHaveAccessibleDescription(
    "Anyone with the link can see it. You can stop sharing at any time.",
  );
});

test("without a title the label names the drawer", async ({ page }) => {
  await opened(page, "open-bottom");
  await drawerEl(page).evaluate((el) => {
    el.querySelector("[slot=title]")!.remove();
    el.setAttribute("label", "Photo sharing");
  });
  await expect(sheet(page)).toHaveAccessibleName("Photo sharing");
});

test("opening fires pl-open", async ({ page }) => {
  await gotoStory(page, story("default"));
  await record(page);
  await page.locator("#trigger").click();
  await expect(sheet(page)).toBeVisible();
  expect(await recorded(page)).toEqual([["pl-open", null]]);
});

test("a bottom sheet has a grabber button; side panels do not", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  await expect(
    page.getByRole("button", { name: "Close", exact: true }),
  ).toBeVisible();
  await expect(grabber(page)).toHaveCount(1);
  await gotoStory(page, story("open-end"));
  await expect(sheet(page)).toBeVisible();
  await expect(grabber(page)).toHaveCount(0);
});

test("the grabber of a sheet without detents closes it, after asking", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  await record(page);
  await grabber(page).click();
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["pl-cancel", null],
      ["pl-close", { returnValue: "" }],
    ]);
});

test("the grabber grows the sheet to the next detent, then closes it", async ({
  page,
}) => {
  await opened(page, "open-detents");
  await record(page);
  expect(await detentOf(page)).toBe("medium");
  await expect(grabber(page)).toHaveAccessibleName("Expand");
  await grabber(page).click();
  await expect.poll(() => detentOf(page)).toBe("large");
  await expect(grabber(page)).toHaveAccessibleName("Close");
  expect(await recorded(page)).toEqual([["pl-resize", { detent: "large" }]]);
  await grabber(page).click();
  await expect(sheet(page)).toBeHidden();
});

test("the medium detent is half the screen and the large one nearly all of it", async ({
  page,
}) => {
  await opened(page, "open-detents");
  const { height: screen } = viewport(page);
  await expect
    .poll(async () => Math.round((await panelBox(page)).height))
    .toBe(Math.round(screen / 2));
  await grabber(page).click();
  await expect
    .poll(async () => (await panelBox(page)).height)
    .toBeGreaterThan(screen * 0.8);
  expect((await panelBox(page)).height).toBeLessThan(screen);
});

test("a detent attribute starts the sheet at that height", async ({ page }) => {
  await opened(page, "open-large-detent");
  expect(await detentOf(page)).toBe("large");
  await expect(grabber(page)).toHaveAccessibleName("Close");
});

test("the arrow keys on the grabber step between detents, and Down at the smallest closes", async ({
  page,
}) => {
  await opened(page, "open-detents");
  await record(page);
  await grabber(page).focus();
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => detentOf(page)).toBe("large");
  await page.keyboard.press("ArrowUp");
  expect(await detentOf(page)).toBe("large");
  await page.keyboard.press("ArrowDown");
  await expect.poll(() => detentOf(page)).toBe("medium");
  await page.keyboard.press("ArrowDown");
  await expect(sheet(page)).toBeHidden();
  expect(await recorded(page)).toEqual([
    ["pl-resize", { detent: "large" }],
    ["pl-resize", { detent: "medium" }],
    ["pl-cancel", null],
    ["pl-close", { returnValue: "" }],
  ]);
});

test("dragging a sheet down far enough closes it", async ({ page }) => {
  await opened(page, "open-bottom");
  await record(page);
  await drag(page, (await panelBox(page)).height * 0.6);
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["pl-cancel", null],
      ["pl-close", { returnValue: "" }],
    ]);
});

test("a short drag snaps the sheet back and is not a tap on the grabber", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  await record(page);
  const before = await panelBox(page);
  await drag(page, 10);
  await expect
    .poll(async () => (await panelBox(page)).y)
    .toBeCloseTo(before.y, 0);
  await expect(sheet(page)).toBeVisible();
  expect(await recorded(page)).toEqual([]);
});

test("a drag cancelled by pl-cancel returns the sheet to rest", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  await drawerEl(page).evaluate((el) =>
    el.addEventListener("pl-cancel", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  const before = await panelBox(page);
  await drag(page, before.height * 0.6);
  await expect
    .poll(async () => (await panelBox(page)).y)
    .toBeCloseTo(before.y, 0);
  await expect(sheet(page)).toBeVisible();
  expect(await isOpen(page)).toBe(true);
});

test("dragging up from medium grows the sheet to large", async ({ page }) => {
  await opened(page, "open-detents");
  await record(page);
  await drag(page, -(await panelBox(page)).height * 0.2);
  await expect.poll(() => detentOf(page)).toBe("large");
  expect(await recorded(page)).toEqual([["pl-resize", { detent: "large" }]]);
});

test("dragging down from large steps back to medium and does not close", async ({
  page,
}) => {
  await opened(page, "open-large-detent");
  await record(page);
  await drag(page, (await panelBox(page)).height * 0.3);
  await expect.poll(() => detentOf(page)).toBe("medium");
  await expect(sheet(page)).toBeVisible();
  expect(await recorded(page)).toEqual([["pl-resize", { detent: "medium" }]]);
});

test("Escape asks to cancel, closes, and returns focus to the opener", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await page.locator("#trigger").click();
  await expect(sheet(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();
  // The native close event is queued after the dialog hides.
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["pl-open", null],
      ["pl-cancel", null],
      ["pl-close", { returnValue: "" }],
    ]);
  await expect(page.locator("#trigger")).toBeFocused();
});

test("a cancel handler can keep the drawer open", async ({ page }) => {
  await opened(page, "open-bottom");
  await drawerEl(page).evaluate((el) =>
    el.addEventListener("pl-cancel", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeVisible();
  expect(await isOpen(page)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();
});

test("pressing the backdrop does not close a drawer that is not dismissible", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  await page.mouse.click(5, 5);
  await expect(sheet(page)).toBeVisible();
});

test("pressing the backdrop closes a dismissible drawer and can be cancelled", async ({
  page,
}) => {
  await opened(page, "open-detents");
  await record(page);
  await drawerEl(page).evaluate((el) =>
    el.addEventListener("pl-cancel", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await page.mouse.click(5, 5);
  await expect(sheet(page)).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["pl-cancel", null],
      ["pl-cancel", null],
      ["pl-close", { returnValue: "" }],
    ]);
});

test("a drag that starts inside a dismissible drawer and ends on the backdrop keeps it open", async ({
  page,
}) => {
  await opened(page, "open-long-content");
  const box = (await drawerEl(page).locator("p").first().boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.down();
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect(sheet(page)).toBeVisible();
});

test("an element with data-close closes the drawer with its value", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await page.locator("#trigger").click();
  await page.getByRole("button", { name: "Share" }).click();
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(async () => (await recorded(page)).at(-1))
    .toEqual(["pl-close", { returnValue: "share" }]);
  await expect(page.locator("#trigger")).toBeFocused();
});

test("show() and close(value) work from script, and removing open closes", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await drawerEl(page).evaluate((el) =>
    (el as HTMLElement & { show(): void }).show(),
  );
  await expect(sheet(page)).toBeVisible();
  await drawerEl(page).evaluate((el) =>
    (el as HTMLElement & { close(v?: string): void }).close("done"),
  );
  await expect(sheet(page)).toBeHidden();
  expect(await isOpen(page)).toBe(false);
  // The native close event is queued; a reopen before it ran would hide it.
  await expect.poll(async () => (await recorded(page)).length).toBe(2);
  await drawerEl(page).evaluate((el) => el.setAttribute("open", ""));
  await expect(sheet(page)).toBeVisible();
  await drawerEl(page).evaluate((el) => el.removeAttribute("open"));
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["pl-open", null],
      ["pl-close", { returnValue: "done" }],
      ["pl-open", null],
      ["pl-close", { returnValue: "" }],
    ]);
});

test("the page behind is inert", async ({ page }) => {
  await opened(page, "open-bottom");
  await expect(page.locator("#trigger")).not.toBeFocused();
  await page.locator("#trigger").click({ force: true });
  await expect(sheet(page)).toBeVisible();
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("pl-drawer")),
  ).toBe(true);
});

test("the page does not scroll while a drawer is open", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const filler = document.createElement("div");
    filler.style.blockSize = "300vh";
    document.body.append(filler);
  });
  const locked = () =>
    page.evaluate(() =>
      document.documentElement.hasAttribute("data-pl-drawer-lock"),
    );
  expect(await locked()).toBe(false);
  await page.locator("#trigger").click();
  await expect(sheet(page)).toBeVisible();
  expect(await locked()).toBe(true);
  await page.mouse.wheel(0, 400);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();
  await expect.poll(locked).toBe(false);
});

test("removing an open drawer releases the scroll lock", async ({ page }) => {
  await opened(page, "open-bottom");
  await drawerEl(page).evaluate((el) => el.remove());
  expect(
    await page.evaluate(() =>
      document.documentElement.hasAttribute("data-pl-drawer-lock"),
    ),
  ).toBe(false);
});

test("a re-inserted open drawer is modal again", async ({ page }) => {
  await opened(page, "open-bottom");
  await drawerEl(page).evaluate((el) => el.parentElement!.append(el));
  await expect
    .poll(() =>
      panel(page).evaluate((el) => (el as HTMLDialogElement).matches(":modal")),
    )
    .toBe(true);
  expect(await isOpen(page)).toBe(true);
});

test("a removed side attribute falls back to the bottom", async ({ page }) => {
  await opened(page, "open-start");
  await drawerEl(page).evaluate((el) => el.removeAttribute("side"));
  await expect(grabber(page)).toHaveCount(1);
  await expect(drawerEl(page)).toHaveJSProperty("side", "bottom");
});

test("removing the detents attribute makes the sheet fit its content", async ({
  page,
}) => {
  await opened(page, "open-detents");
  await drawerEl(page).evaluate((el) => el.removeAttribute("detents"));
  await expect.poll(() => detentOf(page)).toBe("");
  await expect(grabber(page)).toHaveAccessibleName("Close");
});

test("a long body scrolls inside the drawer and is reachable by keyboard", async ({
  page,
}) => {
  await opened(page, "open-long-content");
  const body = drawerEl(page).locator("[part=body]");
  const { scroll, client } = await body.evaluate((el) => ({
    scroll: el.scrollHeight,
    client: el.clientHeight,
  }));
  expect(scroll).toBeGreaterThan(client);
  await expect(body).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("button", { name: "Accept" })).toBeInViewport();
  await expect(grabber(page)).toBeInViewport();
  await body.focus();
  await page.keyboard.press("End");
  await expect
    .poll(() => body.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
});

test("a short body is not a tab stop", async ({ page }) => {
  await opened(page, "open-bottom");
  await expect(drawerEl(page).locator("[part=body]")).not.toHaveAttribute(
    "tabindex",
  );
});

test("a drawer without a description or footer leaves no gap for them", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  const hidden = await drawerEl(page).evaluate((el) => {
    el.querySelector("[slot=description]")!.remove();
    el.querySelectorAll("[slot=footer]").forEach((button) => button.remove());
    return new Promise<boolean[]>((resolve) =>
      requestAnimationFrame(() =>
        resolve(
          ["description", "footer"].map((part) =>
            el
              .shadowRoot!.querySelector(`[part=${part}]`)!
              .hasAttribute("hidden"),
          ),
        ),
      ),
    );
  });
  expect(hidden).toEqual([true, true]);
});

test("a bottom sheet is pinned to the bottom edge, as wide as the screen", async ({
  page,
}) => {
  await opened(page, "open-bottom");
  const { width, height } = viewport(page);
  const box = await panelBox(page);
  expect(box.y + box.height).toBeCloseTo(height, 0);
  expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
  expect(box.width).toBeLessThanOrEqual(width);
});

test("start and end panels sit on the matching edges and fill the height", async ({
  page,
}) => {
  const { width, height } = viewport(page);
  await opened(page, "open-start");
  let box = await panelBox(page);
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.height).toBeCloseTo(height, 0);
  await opened(page, "open-end");
  box = await panelBox(page);
  expect(box.x + box.width).toBeCloseTo(width, 0);
  expect(box.height).toBeCloseTo(height, 0);
});

test("under rtl the start panel sits at the right edge", async ({ page }) => {
  await opened(page, "rtl");
  const box = await panelBox(page);
  expect(box.x + box.width).toBeCloseTo(viewport(page).width, 0);
});

test("--pl-drawer-width sets a side panel's width", async ({ page }) => {
  await opened(page, "open-end");
  const initial = (await panelBox(page)).width;
  await drawerEl(page).evaluate((el) =>
    el.setAttribute("style", "--pl-drawer-width: 500px"),
  );
  await expect.poll(async () => (await panelBox(page)).width).toBe(500);
  expect(initial).not.toBe(500);
});

test("pressing the backdrop of a dismissible side panel closes it", async ({
  page,
}) => {
  await opened(page, "open-end");
  await page.mouse.click(5, 5);
  await expect(sheet(page)).toBeHidden();
});

test("the sheet slides unless motion is reduced", async ({ page }) => {
  const durations = () =>
    panel(page).evaluate((el) => getComputedStyle(el).transitionDuration);
  await opened(page, "open-bottom");
  expect(
    (await durations()).split(",").every((value) => value.trim() === "0s"),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(
    (await durations()).split(",").some((value) => value.trim() !== "0s"),
  ).toBe(true);
});

test("the edge and the focus ring stay visible under forced colors", async ({
  page,
}) => {
  await opened(page, "open-detents");
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await panel(page).evaluate((el) => getComputedStyle(el).borderTopStyle),
  ).toBe("solid");
  expect(
    await grabber(page).evaluate((el) => {
      const bar = el.querySelector("[part=bar]")!;
      return (
        getComputedStyle(bar).backgroundColor === getComputedStyle(el).color
      );
    }),
  ).toBe(true);
  await grabber(page).focus();
  await page.keyboard.press("ArrowUp");
  expect(
    await grabber(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  for (const name of ["open-detents", "open-start"]) {
    await expectNoOverflowAtTextZoom(await opened(page, name));
  }
});

for (const name of [
  "open-bottom",
  "open-detents",
  "open-start",
  "rtl",
  "glass",
  "glass-panel",
])
  test(`axe finds no violations in ${name}`, async ({ page }) => {
    await expectAccessible(await opened(page, name));
  });

test.describe("coarse pointer on a wide screen", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
    reducedMotion: "reduce",
  });

  test("the grabber and every action are at least 44 by 44", async ({
    page,
  }) => {
    await opened(page, "open-detents");
    for (const button of await page.getByRole("button").all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});
