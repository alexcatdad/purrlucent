import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-context-menu--${name}`;

const area = (page: Page) => page.locator("#area");
const file = (page: Page) => page.getByRole("button", { name: "Report.pdf" });
const menu = (page: Page, name = "File actions") =>
  page.getByRole("menu", { name });
const item = (page: Page, name: string) =>
  page.getByRole("menuitem", { name, exact: true });

/** Dispatches a contextmenu event on the area and answers whether the page left it alone (false: something prevented the default). */
const contextmenuAt = (page: Page, x: number, y: number) =>
  area(page).evaluate(
    (el, point) =>
      el.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          composed: true,
          cancelable: true,
          clientX: point.x,
          clientY: point.y,
        }),
      ),
    { x, y },
  );

/** Presses a finger on the area, as a touch screen reports it. */
const touch = (page: Page, type: string, x: number, y: number) =>
  area(page).evaluate(
    (el, args) =>
      el.dispatchEvent(
        new PointerEvent(args.type, {
          bubbles: true,
          composed: true,
          pointerType: "touch",
          pointerId: 7,
          isPrimary: true,
          clientX: args.x,
          clientY: args.y,
        }),
      ),
    { type, x, y },
  );

const longPress = async (page: Page) => {
  const box = (await area(page).boundingBox())!;
  await touch(page, "pointerdown", box.x + 40, box.y + 40);
  return box;
};

test("a right-click opens the menu at the pointer with the first item focused", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(menu(page)).toBeHidden();
  await area(page).click({ button: "right", position: { x: 60, y: 40 } });
  await expect(menu(page)).toBeVisible();
  const box = (await area(page).boundingBox())!;
  const list = (await menu(page).boundingBox())!;
  // The click position is measured from the area's padding box, inside its 1px border.
  expect(list.x).toBeCloseTo(box.x + 61, 0);
  expect(list.y).toBeCloseTo(box.y + 41, 0);
  await expect(item(page, "Open")).toBeFocused();
});

test("the browser's own menu is suppressed while the region handles it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  expect(await contextmenuAt(page, 100, 100)).toBe(false);
  await expect(menu(page)).toBeVisible();
});

test("a disabled region leaves the browser's menu alone and never opens", async ({
  page,
}) => {
  await gotoStory(page, story("disabled"));
  expect(await contextmenuAt(page, 100, 100)).toBe(true);
  await file(page).focus();
  await page.keyboard.press("Shift+F10");
  await page.keyboard.press("ContextMenu");
  await expect(menu(page)).toBeHidden();
});

test("a contextmenu event something inside already handled is left to it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const prevented = await area(page).evaluate((el) => {
    const inner = document.createElement("span");
    inner.addEventListener("contextmenu", (e) => e.preventDefault());
    el.append(inner);
    return !inner.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
  });
  expect(prevented).toBe(true);
  await expect(menu(page)).toBeHidden();
});

test("Escape closes the menu and focus returns to where it came from", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await file(page).focus();
  await area(page).click({ button: "right", position: { x: 60, y: 40 } });
  await expect(menu(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeHidden();
  await expect(file(page)).toBeFocused();
});

test("a press outside closes the menu", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(menu(page)).toBeVisible();
  await page.mouse.click(700, 500);
  await expect(menu(page)).toBeHidden();
});

test("a second right-click moves the menu to the new point", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  // The menu opens to the end of its point, so the second point is clear of it.
  await area(page).click({ button: "right", position: { x: 300, y: 60 } });
  await expect(menu(page)).toBeVisible();
  await area(page).click({ button: "right", position: { x: 20, y: 10 } });
  const box = (await area(page).boundingBox())!;
  await expect
    .poll(async () => (await menu(page).boundingBox())?.x)
    .toBeCloseTo(box.x + 21, 0);
  await expect(item(page, "Open")).toBeFocused();
});

for (const key of ["Shift+F10", "ContextMenu"]) {
  test(`${key} opens the menu below the focused element and Escape returns focus to it`, async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await file(page).focus();
    await page.keyboard.press(key);
    await expect(menu(page)).toBeVisible();
    await expect(item(page, "Open")).toBeFocused();
    const list = (await menu(page).boundingBox())!;
    const target = (await file(page).boundingBox())!;
    expect(list.x).toBeCloseTo(target.x, 0);
    expect(list.y).toBeCloseTo(target.y + target.height, 0);
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(file(page)).toBeFocused();
  });
}

test("under rtl a keyboard-opened menu hangs from the end edge of the focused element", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeHidden();
  await file(page).focus();
  await page.keyboard.press("Shift+F10");
  await expect(menu(page)).toBeVisible();
  const list = (await menu(page).boundingBox())!;
  const target = (await file(page).boundingBox())!;
  expect(list.x + list.width).toBeCloseTo(target.x + target.width, 0);
});

test("choosing an item fires pl-select from the context menu and closes it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const log: string[] = [];
    document
      .querySelector("pl-context-menu")!
      .addEventListener("pl-select", (e) =>
        log.push((e as CustomEvent<{ value: string }>).detail.value),
      );
    (window as unknown as { log: string[] }).log = log;
  });
  await area(page).click({ button: "right", position: { x: 60, y: 40 } });
  await item(page, "Rename").click();
  await expect(menu(page)).toBeHidden();
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(["Rename"]);
});

test("a submenu item opens its submenu with ArrowRight", async ({ page }) => {
  await gotoStory(page, story("default"));
  await area(page).click({ button: "right", position: { x: 60, y: 40 } });
  await item(page, "Share").focus();
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "Share")).toBeVisible();
  await expect(item(page, "Mail")).toBeFocused();
});

test("pl-open and pl-close report each open and close, however it happens", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const log: string[] = [];
    const host = document.querySelector("pl-context-menu")!;
    host.addEventListener("pl-open", (e) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      log.push(`open ${x} ${y}`);
    });
    host.addEventListener("pl-close", () => log.push("close"));
    (window as unknown as { log: string[] }).log = log;
  });
  const log = () =>
    page.evaluate(() => (window as unknown as { log: string[] }).log);
  const box = (await area(page).boundingBox())!;
  await area(page).click({ button: "right", position: { x: 60, y: 40 } });
  await expect.poll(async () => (await log()).length).toBe(1);
  const [, x, y] = (await log())[0]!.split(" ");
  expect(Number(x)).toBeCloseTo(box.x + 61, 0);
  expect(Number(y)).toBeCloseTo(box.y + 41, 0);
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await log()).length).toBe(2);
  expect((await log())[1]).toBe("close");
  await area(page).click({ button: "right", position: { x: 60, y: 40 } });
  await expect(menu(page)).toBeVisible();
  await page.mouse.click(700, 500);
  await expect(menu(page)).toBeHidden();
  expect((await log()).filter((entry) => entry === "close")).toHaveLength(2);
  expect(
    (await log()).filter((entry) => entry.startsWith("open")),
  ).toHaveLength(2);
});

test("setting disabled while the menu is open closes it", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(menu(page)).toBeVisible();
  await page
    .locator("pl-context-menu")
    .evaluate((el) => el.setAttribute("disabled", ""));
  await expect(menu(page)).toBeHidden();
});

test.describe("long press", () => {
  test("holding a finger still opens the menu at the finger", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const box = await longPress(page);
    await page.waitForTimeout(250);
    await expect(menu(page)).toBeHidden();
    await expect(menu(page)).toBeVisible();
    const list = (await menu(page).boundingBox())!;
    expect(list.x).toBeCloseTo(box.x + 40, 0);
    expect(list.y).toBeCloseTo(box.y + 40, 0);
  });

  test("lifting the finger early does not open it", async ({ page }) => {
    await gotoStory(page, story("default"));
    const box = await longPress(page);
    await page.waitForTimeout(100);
    await touch(page, "pointerup", box.x + 40, box.y + 40);
    await page.waitForTimeout(700);
    await expect(menu(page)).toBeHidden();
  });

  test("moving the finger away does not open it", async ({ page }) => {
    await gotoStory(page, story("default"));
    const box = await longPress(page);
    await touch(page, "pointermove", box.x + 80, box.y + 80);
    await page.waitForTimeout(700);
    await expect(menu(page)).toBeHidden();
  });

  test("a disabled region ignores it", async ({ page }) => {
    await gotoStory(page, story("disabled"));
    await longPress(page);
    await page.waitForTimeout(700);
    await expect(menu(page)).toBeHidden();
  });
});

test.describe("near the bottom right corner of a small viewport", () => {
  test.use({ viewport: { width: 420, height: 300 } });

  test("the menu stays inside the viewport", async ({ page }) => {
    await gotoStory(page, story("default"));
    await contextmenuAt(page, 415, 295);
    await expect(menu(page)).toBeVisible();
    const box = (await menu(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(420);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(295);
  });
});

test("under reduced motion the menu shows without a fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("open"));
  await expect(menu(page)).toBeVisible();
  const duration = await page
    .locator("pl-context-menu > pl-menu")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector("[part=menu]")!)
          .transitionDuration,
    );
  expect(duration).toMatch(/^0s(, 0s)*$/);
});

test("the menu keeps its edge under forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await gotoStory(page, story("open"));
  await expect(menu(page)).toBeVisible();
  const border = await page
    .locator("pl-context-menu > pl-menu")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector("[part=menu]")!)
          .borderTopWidth,
    );
  expect(border).not.toBe("0px");
});

for (const name of ["default", "open", "disabled", "rtl", "glass"]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    // Axe reads colours: zero durations, so no highlight is caught mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const root = await gotoStory(page, story(name));
    await expectAccessible(root);
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the region's control and every item are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    await expect(menu(page)).toBeVisible();
    const target = (await file(page).boundingBox())!;
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
    for (const row of await menu(page).getByRole("menuitem").all()) {
      const box = (await row.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
