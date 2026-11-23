import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `containers-resizable--${name}`;

const now = (handle: Locator) => handle.getAttribute("aria-valuenow");

/** Every panel's size in percent, as the group reports it. */
const sizes = (page: Page) =>
  page
    .locator("#group")
    .evaluate((el) => (el as unknown as { sizes: number[] }).sizes);

/** Logs the detail of every pl-resize the group fires into `window.log`. */
const logResizes = (page: Page) =>
  page.locator("#group").evaluate((el) => {
    const log: number[][] = [];
    (window as unknown as { log: number[][] }).log = log;
    el.addEventListener("pl-resize", (event) =>
      log.push((event as CustomEvent<{ sizes: number[] }>).detail.sizes),
    );
  });

const resizes = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: number[][] }).log);

/** Drags the handle by a fraction of the group's length along its axis. */
async function drag(
  page: Page,
  handle: Locator,
  fraction: number,
  vertical = false,
) {
  const group = (await page.locator("#group").boundingBox())!;
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const length = vertical ? group.height : group.width;
  await page.mouse.move(
    vertical ? x : x + length * fraction,
    vertical ? y + length * fraction : y,
    { steps: 5 },
  );
  await page.mouse.up();
}

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("three-panels"));
  await expect(root).toMatchAriaSnapshot(`
    - separator "Resize folders"
    - separator "Resize messages"
  `);
});

test("the divider carries the window splitter attributes", async ({ page }) => {
  await gotoStory(page, story("default"));
  const handle = page.getByRole("separator", { name: "Resize library" });
  await expect(handle).toHaveAttribute("aria-orientation", "vertical");
  await expect(handle).toHaveAttribute("aria-valuenow", "30");
  await expect(handle).toHaveAttribute("aria-valuemin", "15");
  await expect(handle).toHaveAttribute("aria-valuemax", "85");
  await expect(handle).toHaveAttribute("tabindex", "0");
  const controlled = await handle.getAttribute("aria-controls");
  expect(controlled).toBeTruthy();
  expect(
    await page.locator("pl-resizable-panel").first().getAttribute("id"),
  ).toBe(controlled);
});

test("panels without a size share what the others leave", async ({ page }) => {
  await gotoStory(page, story("three-panels"));
  expect(await sizes(page)).toEqual([25, 45, 30]);
});

test("arrow, Home and End keys move the divider within the limits", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const handle = page.getByRole("separator", { name: "Resize library" });
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  expect(await now(handle)).toBe("31");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  expect(await now(handle)).toBe("29");
  await page.keyboard.press("End");
  expect(await sizes(page)).toEqual([85, 15]);
  await page.keyboard.press("ArrowRight");
  expect(await sizes(page)).toEqual([85, 15]);
  await page.keyboard.press("Home");
  expect(await sizes(page)).toEqual([15, 85]);
});

test("dragging the divider moves it and fires pl-resize with the sizes", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await logResizes(page);
  await drag(
    page,
    page.getByRole("separator", { name: "Resize library" }),
    0.1,
  );
  const [first, second] = await sizes(page);
  expect(first).toBeCloseTo(40, 0);
  expect(first! + second!).toBeCloseTo(100, 1);
  const log = await resizes(page);
  expect(log.length).toBeGreaterThan(1);
  expect(log.at(-1)).toEqual([first, second]);
  await expect(page.getByRole("separator")).toBeFocused();
});

test("a drag stops at the limits of both panels", async ({ page }) => {
  await gotoStory(page, story("limits"));
  const handle = page.getByRole("separator", { name: "Resize panel" });
  await drag(page, handle, 0.8);
  expect(await sizes(page)).toEqual([60, 40]);
  await drag(page, handle, -0.9);
  expect(await sizes(page)).toEqual([20, 80]);
});

test("a vertical group stacks its panels and answers the up and down keys", async ({
  page,
}) => {
  await gotoStory(page, story("vertical"));
  const handle = page.getByRole("separator", { name: "Resize editor" });
  await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
  const [top, bottom] = await page
    .locator("pl-resizable-panel")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
  expect(bottom!).toBeGreaterThan(top!);
  await handle.focus();
  await page.keyboard.press("ArrowDown");
  expect(await now(handle)).toBe("41");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect(await now(handle)).toBe("39");
  await page.keyboard.press("ArrowRight");
  expect(await now(handle)).toBe("39");
  await drag(page, handle, 0.1, true);
  expect(Number(await now(handle))).toBeGreaterThan(45);
});

test("Enter collapses a collapsible panel and restores it", async ({
  page,
}) => {
  await gotoStory(page, story("collapsible"));
  await logResizes(page);
  const handle = page.getByRole("separator", { name: "Resize library" });
  const library = page.locator("#library");
  await handle.focus();
  await page.keyboard.press("Enter");
  await expect(library).toHaveAttribute("collapsed", "");
  await expect(library).toBeHidden();
  expect(await sizes(page)).toEqual([0, 100]);
  expect(await now(handle)).toBe("0");
  // A divider next to a collapsed panel moves nothing.
  await page.keyboard.press("ArrowRight");
  expect(await sizes(page)).toEqual([0, 100]);
  await page.keyboard.press("Enter");
  await expect(library).not.toHaveAttribute("collapsed");
  await expect(library).toBeVisible();
  expect(await sizes(page)).toEqual([25, 75]);
  expect(await resizes(page)).toEqual([
    [0, 100],
    [25, 75],
  ]);
});

test("Enter does nothing when no panel beside the divider is collapsible", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.getByRole("separator", { name: "Resize library" }).focus();
  await page.keyboard.press("Enter");
  expect(await sizes(page)).toEqual([30, 70]);
});

test("setting collapsed from script collapses and restores the panel without an event", async ({
  page,
}) => {
  await gotoStory(page, story("collapsible"));
  await logResizes(page);
  const library = page.locator("#library");
  await library.evaluate((el) => {
    (el as HTMLElement & { collapsed: boolean }).collapsed = true;
  });
  await expect(library).toBeHidden();
  expect(await sizes(page)).toEqual([0, 100]);
  await library.evaluate((el) => {
    (el as HTMLElement & { collapsed: boolean }).collapsed = false;
  });
  await expect(library).toBeVisible();
  expect(await sizes(page)).toEqual([25, 75]);
  expect(await resizes(page)).toEqual([]);
});

test("the last open panel does not collapse", async ({ page }) => {
  await gotoStory(page, story("collapsible"));
  const panels = page.locator("pl-resizable-panel");
  await panels.first().evaluate((el) => {
    (el as HTMLElement & { collapsed: boolean }).collapsed = true;
  });
  await panels.last().evaluate((el) => {
    (el as HTMLElement & { collapsed: boolean }).collapsed = true;
  });
  await expect(panels.last()).not.toHaveAttribute("collapsed");
  expect(await sizes(page)).toEqual([0, 100]);
});

test("a disabled divider takes no focus and does not move", async ({
  page,
}) => {
  await gotoStory(page, story("disabled"));
  const handle = page.getByRole("separator", { name: "Resize fixed" });
  await expect(handle).toHaveAttribute("aria-disabled", "true");
  expect(await handle.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
  await drag(page, handle, 0.2);
  expect(await sizes(page)).toEqual([30, 70]);
});

test("under rtl the first panel is at the right and the keys swap", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const handle = page.getByRole("separator", { name: "Resize library" });
  const [first, second] = await page
    .locator("pl-resizable-panel")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
  expect(first!).toBeGreaterThan(second!);
  await handle.focus();
  await page.keyboard.press("ArrowLeft");
  expect(await now(handle)).toBe("31");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  expect(await now(handle)).toBe("29");
  await drag(page, handle, -0.1);
  expect(Number((await sizes(page))[0])).toBeGreaterThan(35);
});

test("the divider is a thin line with a larger hit region", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const handle = page.getByRole("separator", { name: "Resize library" });
  const line = await handle.evaluate((el) =>
    parseFloat(getComputedStyle(el, "::before").width),
  );
  expect(line).toBeLessThanOrEqual(2);
  expect((await handle.boundingBox())!.width).toBeGreaterThanOrEqual(24);
});

test("the divider shows a focus ring, also under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const handle = page.getByRole("separator", { name: "Resize library" });
  await page.keyboard.press("Tab");
  await expect(handle).toBeFocused();
  expect(
    await handle.evaluate(
      (el) => getComputedStyle(el, "::before").outlineStyle,
    ),
  ).not.toBe("none");
});

test("under reduced motion the divider changes color without a transition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  const handle = page.getByRole("separator", { name: "Resize library" });
  expect(
    await handle.evaluate(
      (el) => getComputedStyle(el, "::before").transitionDuration,
    ),
  ).toBe("0s");
});

test("a split view has no axe violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("three-panels")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the role and name", async ({ page }) => {
  await gotoStory(page, story("default"));
  const spoken = await spokenPhrases(page);
  const phrase = spoken.find((p) => p.includes("Resize library"));
  expect(phrase).toContain("separator");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the hit region of the divider is at least 44 points wide", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const hit = await page
      .getByRole("separator", { name: "Resize library" })
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(hit).toBeGreaterThanOrEqual(44);
  });
});
