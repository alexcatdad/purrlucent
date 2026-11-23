import { expect, test, type Page } from "@playwright/test";
import { expectNoOverflowAtTextZoom } from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-menubar--${name}`;

const top = (page: Page, name: string) =>
  page.getByRole("menuitem", { name, exact: true });
const menu = (page: Page, name: string) => page.getByRole("menu", { name });
const item = (page: Page, name: string) =>
  page.getByRole("menuitem", { name, exact: true });

test("the bar is a named menubar of menuitem triggers that declare a menu", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(
    page.getByRole("menubar", { name: "Application" }),
  ).toBeVisible();
  for (const name of ["File", "Edit", "View"]) {
    await expect(top(page, name)).toHaveAttribute("aria-haspopup", "menu");
    await expect(top(page, name)).toHaveAttribute("aria-expanded", "false");
  }
});

test("the bar has one tab stop", async ({ page }) => {
  await gotoStory(page, story("default"));
  const stops = await page.evaluate(
    () =>
      [...document.querySelectorAll("pl-menubar [slot=trigger]")].filter(
        (el) => (el as HTMLElement).tabIndex === 0,
      ).length,
  );
  expect(stops).toBe(1);
});

test("Left and Right move between the triggers with wrap; Home and End jump", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await top(page, "File").focus();
  await page.keyboard.press("ArrowRight");
  await expect(top(page, "Edit")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(top(page, "File")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(top(page, "View")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(top(page, "File")).toBeFocused();
  await page.keyboard.press("End");
  await expect(top(page, "View")).toBeFocused();
  await expect(menu(page, "File")).toBeHidden();
});

test("Down, Enter and Space open the menu with the first item focused", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  for (const key of ["ArrowDown", "Enter", "Space"]) {
    await top(page, "File").focus();
    await page.keyboard.press(key);
    await expect(menu(page, "File")).toBeVisible();
    await expect(item(page, "New ⌘N")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu(page, "File")).toBeHidden();
    await expect(top(page, "File")).toBeFocused();
  }
});

test("with a menu open, Right and Left switch to the adjacent menu and wrap", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await top(page, "File").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "File")).toBeHidden();
  await expect(menu(page, "Edit")).toBeVisible();
  await expect(item(page, "Undo ⌘Z")).toBeFocused();
  await expect(top(page, "Edit")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "View")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "File")).toBeVisible();
  await expect(menu(page, "View")).toBeHidden();
  await page.keyboard.press("ArrowLeft");
  await expect(menu(page, "View")).toBeVisible();
  await expect(menu(page, "File")).toBeHidden();
});

test("Right on a row with a submenu opens it; Right in the submenu moves to the next menu", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await top(page, "Edit").focus();
  await page.keyboard.press("ArrowUp");
  await expect(item(page, "Find")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "Find")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "View")).toBeVisible();
  await expect(menu(page, "Find")).toBeHidden();
  await expect(menu(page, "Edit")).toBeHidden();
});

test("Left inside a submenu closes only the submenu", async ({ page }) => {
  await gotoStory(page, story("default"));
  await top(page, "Edit").focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "Find")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(menu(page, "Find")).toBeHidden();
  await expect(menu(page, "Edit")).toBeVisible();
  await expect(item(page, "Find")).toBeFocused();
});

test("Escape closes the open menu and returns to its trigger", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await top(page, "File").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(menu(page, "Edit")).toBeHidden();
  await expect(top(page, "Edit")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(top(page, "View")).toBeFocused();
});

test("a disabled menu is skipped by the arrows and the switch", async ({
  page,
}) => {
  await gotoStory(page, story("disabled-menu"));
  await top(page, "File").focus();
  await page.keyboard.press("ArrowRight");
  await expect(top(page, "View")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "View")).toBeVisible();
  await expect(menu(page, "Edit")).toBeHidden();
});

test("choosing an item fires pl-select once, closes and returns to the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const log: string[] = [];
    document.addEventListener("pl-select", (e) =>
      log.push((e as CustomEvent<{ value: string }>).detail.value),
    );
    (window as unknown as { log: string[] }).log = log;
  });
  await top(page, "File").click();
  await item(page, "Open… ⌘O").click();
  await expect(menu(page, "File")).toBeHidden();
  await expect(top(page, "File")).toBeFocused();
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(["Open…"]);
});

test("under rtl the arrows are mirrored", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  await expect(menu(page, "File")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(menu(page, "Edit")).toBeVisible();
  await expect(menu(page, "File")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(menu(page, "File")).toBeVisible();
});

test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(top(page, "File")).toBeFocused();
  const outline = await top(page, "File").evaluate(
    (el) => getComputedStyle(el).outlineStyle,
  );
  expect(outline).not.toBe("none");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open")));
});
