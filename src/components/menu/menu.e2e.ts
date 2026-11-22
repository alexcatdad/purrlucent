import { expect, test, type Page } from "@playwright/test";
import {
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-menu--${name}`;

const trigger = (page: Page, name = "Edit") =>
  page.getByRole("button", { name });
const menu = (page: Page, name = "Edit") => page.getByRole("menu", { name });
const item = (page: Page, name: string) =>
  page.getByRole("menuitem", { name, exact: true });
const check = (page: Page, name: string, role = "menuitemcheckbox") =>
  page.getByRole(role as "menuitem", { name, exact: false });

/** Records every purr-select on the page as the item values, in order. */
const recordSelects = (page: Page) =>
  page.evaluate(() => {
    const log: string[] = [];
    document.addEventListener("purr-select", (e) =>
      log.push((e as CustomEvent<{ value: string }>).detail.value),
    );
    (window as unknown as { log: string[] }).log = log;
  });
const selects = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

const openByKey = async (page: Page, key: string) => {
  await trigger(page).focus();
  await page.keyboard.press(key);
  await expect(menu(page)).toBeVisible();
};

test("aria snapshot, open", async ({ page }) => {
  const root = await gotoStory(page, story("checked"));
  await expect(root).toMatchAriaSnapshot(`
    - button "View" [expanded]
    - menu "View":
      - menuitemcheckbox "as Icons ⌘1" [checked]
      - menuitemcheckbox "as List ⌘2"
      - menuitemcheckbox "Show Path Bar" [checked] [disabled]
      - separator
      - text: Sort By
      - menuitemradio "Name" [checked]
      - menuitemradio "Date Modified"
      - menuitemradio "Size"
  `);
});

test("the trigger declares a menu and tracks whether it is open", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const button = trigger(page);
  await expect(button).toHaveAttribute("aria-haspopup", "menu");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
});

test("a click opens the menu with the first item focused and a second click closes it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).click();
  await expect(menu(page)).toBeVisible();
  await expect(item(page, "Undo ⌘Z")).toBeFocused();
  await trigger(page).click();
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("Enter, Space and ArrowDown focus the first item, ArrowUp the last", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  for (const key of ["Enter", "Space", "ArrowDown"]) {
    await openByKey(page, key);
    await expect(item(page, "Undo ⌘Z")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
  }
  await openByKey(page, "ArrowUp");
  await expect(item(page, "Find")).toBeFocused();
});

test("arrows wrap and skip disabled items; Home and End jump", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await openByKey(page, "ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(item(page, "Find")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Undo ⌘Z")).toBeFocused();
  await page.keyboard.press("End");
  await expect(item(page, "Find")).toBeFocused();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Redo ⇧⌘Z")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Copy ⌘C")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Delete")).toBeFocused();
});

test("typing jumps to the matching item", async ({ page }) => {
  await gotoStory(page, story("default"));
  await openByKey(page, "ArrowDown");
  await page.keyboard.type("d");
  await expect(item(page, "Delete")).toBeFocused();
  await page.waitForTimeout(700);
  await page.keyboard.type("r");
  await expect(item(page, "Redo ⇧⌘Z")).toBeFocused();
});

test("Escape closes and returns focus to the trigger", async ({ page }) => {
  await gotoStory(page, story("default"));
  await openByKey(page, "ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

test("Tab closes the menu and moves on", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    // An input: WebKit's Tab order skips buttons and links by default.
    const next = document.createElement("input");
    next.id = "next";
    document.querySelector("purr-menu")!.after(next);
  });
  await openByKey(page, "ArrowDown");
  await page.keyboard.press("Tab");
  await expect(menu(page)).toBeHidden();
  await expect(page.locator("#next")).toBeFocused();
});

test("Enter and Space activate once, close and return focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await recordSelects(page);
  await openByKey(page, "ArrowDown");
  await page.keyboard.press("Enter");
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await openByKey(page, "ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(menu(page)).toBeHidden();
  expect(await selects(page)).toEqual(["Undo", "Redo"]);
});

test("a click on an item fires purr-select once and closes", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await recordSelects(page);
  await trigger(page).click();
  await item(page, "Copy ⌘C").click();
  await expect(menu(page)).toBeHidden();
  expect(await selects(page)).toEqual(["Copy"]);
});

test("a disabled item cannot be activated or focused", async ({ page }) => {
  await gotoStory(page, story("default"));
  await recordSelects(page);
  await trigger(page).click();
  await item(page, "Paste ⌘V").click({ force: true });
  await expect(menu(page)).toBeVisible();
  expect(await selects(page)).toEqual([]);
});

test("arrows keep working after the pointer passes a disabled item", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).click();
  const paste = (await item(page, "Paste ⌘V").boundingBox())!;
  await page.mouse.move(paste.x + paste.width / 2, paste.y + paste.height / 2);
  await page.waitForTimeout(300);
  await expect(item(page, "Paste ⌘V")).not.toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(item(page, "Redo ⇧⌘Z")).toBeFocused();
});

test("an item that becomes checkable or plain later updates the check column", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const undo = page.locator("purr-menu-item").first();
  await expect(undo).not.toHaveAttribute("indent", "");
  await undo.evaluate((el) => {
    (el as unknown as { type: string }).type = "checkbox";
  });
  await expect(undo).toHaveAttribute("indent", "");
  await undo.evaluate((el) => {
    (el as unknown as { type: string }).type = "";
  });
  await expect(undo).not.toHaveAttribute("indent", "");
});

test("a trigger marked aria-disabled does not open from the keyboard", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).evaluate((el) => {
    el.setAttribute("aria-disabled", "true");
    el.focus();
  });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(menu(page)).toBeHidden();
});

test("closing the menu with open=false returns focus to the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).click();
  await expect(item(page, "Undo ⌘Z")).toBeFocused();
  await page.locator("#menu").evaluate((el) => {
    (el as unknown as { open: boolean }).open = false;
  });
  await expect(menu(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
});

for (const id of ["open", "rtl"]) {
  test(`the shortcut keeps a gap from the label in ${id}`, async ({ page }) => {
    await gotoStory(page, story(id));
    const gap = await item(page, "Undo ⌘Z").evaluate((el) => {
      const label = el.shadowRoot!.querySelector("[part=label]")!;
      const detail = el.shadowRoot!.querySelector("[part=detail]")!;
      const l = label.getBoundingClientRect();
      const d = detail.getBoundingClientRect();
      return Math.max(l.left - d.right, d.left - l.right);
    });
    expect(gap).toBeGreaterThanOrEqual(4);
  });
}

test("a press outside closes every level", async ({ page }) => {
  await gotoStory(page, story("submenu"));
  await expect(menu(page, "Find")).toBeVisible();
  await page.mouse.click(700, 500);
  await expect(menu(page, "Find")).toBeHidden();
  await expect(menu(page)).toBeHidden();
});

test.describe("submenu", () => {
  test("ArrowRight, Enter and Space open it with the first item focused", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await openByKey(page, "ArrowUp");
    const parent = item(page, "Find");
    await expect(parent).toHaveAttribute("aria-haspopup", "menu");
    await expect(parent).toHaveAttribute("aria-expanded", "false");
    for (const key of ["ArrowRight", "Enter", "Space"]) {
      await page.keyboard.press(key);
      await expect(menu(page, "Find")).toBeVisible();
      await expect(parent).toHaveAttribute("aria-expanded", "true");
      await expect(item(page, "Find…")).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(menu(page, "Find")).toBeHidden();
      await expect(parent).toBeFocused();
    }
  });

  test("Escape closes only the submenu and returns focus to its row", async ({
    page,
  }) => {
    await gotoStory(page, story("submenu"));
    // The story's play function opens the submenu; Escape must not beat it.
    await expect(item(page, "Find Next")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu(page, "Find")).toBeHidden();
    await expect(item(page, "Find")).toBeFocused();
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("arrows move inside the submenu only", async ({ page }) => {
    await gotoStory(page, story("submenu"));
    await expect(item(page, "Find Next")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Find Previous")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Find…")).toBeFocused();
  });

  test("hovering the row opens it after a short delay and keeps focus on the row", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    await item(page, "Find").hover();
    await expect(menu(page, "Find")).toBeVisible();
    await expect(item(page, "Find")).toBeFocused();
    await item(page, "Undo ⌘Z").hover();
    await expect(menu(page, "Find")).toBeHidden();
  });

  test("choosing a submenu item fires purr-select once and closes every level", async ({
    page,
  }) => {
    await gotoStory(page, story("submenu"));
    await recordSelects(page);
    await item(page, "Find Previous").click();
    await expect(menu(page, "Find")).toBeHidden();
    await expect(menu(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
    expect(await selects(page)).toEqual(["Find Previous"]);
  });

  test("it sits beside its row and does not overlap the parent menu", async ({
    page,
  }) => {
    await gotoStory(page, story("submenu"));
    const parent = (await menu(page).boundingBox())!;
    const sub = (await menu(page, "Find").boundingBox())!;
    const row = (await item(page, "Find").boundingBox())!;
    expect(sub.x).toBeGreaterThanOrEqual(parent.x + parent.width);
    expect(sub.y).toBeCloseTo(row.y - 4, 0);
  });

  test.describe("near the right edge", () => {
    test.use({ viewport: { width: 420, height: 400 } });

    test("it moves to the left of the parent menu", async ({ page }) => {
      await gotoStory(page, story("default"));
      await page.locator("#menu").evaluate((el) => {
        el.style.position = "fixed";
        el.style.insetBlockStart = "10px";
        el.style.insetInlineEnd = "10px";
      });
      await trigger(page).click();
      await item(page, "Find").hover();
      await expect(menu(page, "Find")).toBeVisible();
      const parent = (await menu(page).boundingBox())!;
      const sub = (await menu(page, "Find").boundingBox())!;
      expect(sub.x).toBeGreaterThanOrEqual(0);
      expect(sub.x + sub.width).toBeLessThanOrEqual(parent.x);
    });
  });

  test("under rtl it opens on ArrowLeft, to the left of its row", async ({
    page,
  }) => {
    await gotoStory(page, story("rtl"));
    const parent = (await menu(page).boundingBox())!;
    const sub = (await menu(page, "Find").boundingBox())!;
    expect(sub.x + sub.width).toBeLessThanOrEqual(parent.x);
    await page.keyboard.press("ArrowRight");
    await expect(menu(page, "Find")).toBeHidden();
    await expect(item(page, "Find")).toBeFocused();
  });
});

test("a checkbox item toggles and closes the menu", async ({ page }) => {
  await gotoStory(page, story("checked"));
  await recordSelects(page);
  await check(page, "as List").click();
  await expect(menu(page, "View")).toBeHidden();
  await trigger(page, "View").click();
  await expect(check(page, "as List")).toBeChecked();
  await expect(check(page, "as Icons")).toBeChecked();
  await check(page, "as Icons").click();
  await trigger(page, "View").click();
  await expect(check(page, "as Icons")).not.toBeChecked();
  expect(await selects(page)).toEqual(["as List", "as Icons"]);
});

test("choosing a radio item unchecks the others in its group only", async ({
  page,
}) => {
  await gotoStory(page, story("checked"));
  await check(page, "Size", "menuitemradio").click();
  await trigger(page, "View").click();
  await expect(check(page, "Size", "menuitemradio")).toBeChecked();
  await expect(check(page, "Name", "menuitemradio")).not.toBeChecked();
  await expect(check(page, "as Icons")).toBeChecked();
});

test.describe("context menu", () => {
  test("opens at the pointer and Escape returns focus to where it came from", async ({
    page,
  }) => {
    await gotoStory(page, story("context-menu"));
    await page.keyboard.press("Escape");
    await expect(menu(page, "File actions")).toBeHidden();
    await page
      .locator("#area")
      .click({ button: "right", position: { x: 60, y: 40 } });
    const list = menu(page, "File actions");
    await expect(list).toBeVisible();
    const area = (await page.locator("#area").boundingBox())!;
    const box = (await list.boundingBox())!;
    // The click position is measured from the area's padding box, inside its 1px border.
    expect(box.x).toBeCloseTo(area.x + 61, 0);
    expect(box.y).toBeCloseTo(area.y + 41, 0);
    await expect(item(page, "Open")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(list).toBeHidden();
    await expect(page.locator("#area")).toBeFocused();
  });

  test("hide() closes it and showAt() reopens it elsewhere", async ({
    page,
  }) => {
    await gotoStory(page, story("context-menu"));
    const el = page.locator("#menu");
    await el.evaluate((m) => (m as unknown as { hide(): void }).hide());
    await expect(menu(page, "File actions")).toBeHidden();
    await el.evaluate((m) =>
      (m as unknown as { showAt(x: number, y: number): void }).showAt(30, 30),
    );
    await expect(menu(page, "File actions")).toBeVisible();
    expect((await menu(page, "File actions").boundingBox())!.x).toBeCloseTo(
      30,
      0,
    );
  });
});

test.describe("near the bottom right corner", () => {
  test.use({ viewport: { width: 420, height: 300 } });

  test("the menu stays inside the viewport", async ({ page }) => {
    await gotoStory(page, story("default"));
    await page.locator("#menu").evaluate((el) => {
      el.style.position = "fixed";
      el.style.insetBlockEnd = "10px";
      el.style.insetInlineEnd = "10px";
    });
    await trigger(page).click();
    const box = (await menu(page).boundingBox())!;
    const control = (await trigger(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(420);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(control.y);
  });
});

test("the focus ring and the highlight stay visible under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  const colors = await item(page, "Undo ⌘Z").evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.backgroundColor, style.color, style.outlineStyle];
  });
  expect(colors[0]).not.toBe(colors[1]);
  expect(colors[2]).not.toBe("none");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open")));
});

test("virtual screen reader speaks the items of the open menu", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("menuitem, Undo");
  expect(spoken).toContain("menuitem, Copy");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the trigger and every item are at least 44 tall", async ({ page }) => {
    await gotoStory(page, story("submenu"));
    expect((await trigger(page).boundingBox())!.height).toBeGreaterThanOrEqual(
      44,
    );
    for (const row of await page.getByRole("menuitem").all())
      expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});
