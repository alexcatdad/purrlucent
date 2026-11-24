import { expect, test, type Page } from "@playwright/test";
import {
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import {
  compositeOver,
  contrast,
  resolveColors,
} from "../../../e2e/helpers/color.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `menus-menu--${name}`;

const trigger = (page: Page, name = "Edit") =>
  page.getByRole("button", { name });
const menu = (page: Page, name = "Edit") => page.getByRole("menu", { name });
const item = (page: Page, name: string) =>
  page.getByRole("menuitem", { name, exact: true });
const check = (page: Page, name: string, role = "menuitemcheckbox") =>
  page.getByRole(role as "menuitem", { name, exact: false });

/** Records every pl-select on the page as the item values, in order. */
const recordSelects = (page: Page) =>
  page.evaluate(() => {
    const log: string[] = [];
    document.addEventListener("pl-select", (e) =>
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
    document.querySelector("pl-menu")!.after(next);
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

test("a click on an item fires pl-select once and closes", async ({ page }) => {
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
  const undo = page.locator("pl-menu-item").first();
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

  test("Escape closes only a hover-opened submenu and keeps the menu open", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    await item(page, "Find").hover();
    await expect(menu(page, "Find")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page, "Find")).toBeHidden();
    await expect(menu(page)).toBeVisible();
    await expect(item(page, "Find")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("choosing a submenu item fires pl-select once and closes every level", async ({
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

test("submenu text meets contrast", async ({ page }) => {
  for (const theme of ["light", "dark"])
    for (const material of ["solid", "glass"]) {
      await gotoStory(
        page,
        story("submenu"),
        `material:${material};theme:${theme}`,
      );
      await expect(menu(page, "Find")).toBeVisible();
      // A row that is not highlighted; the submenu's second row has focus.
      const row = item(page, "Find…");
      const text = await row.evaluate((el) => getComputedStyle(el).color);
      const { page: base, text: ink } = await resolveColors(page, {
        page: "var(--pl-color-background)",
        text,
      });
      const [surface] = await compositeOver(page, "var(--pl-material-panel)", [
        `rgb(${base!.join(",")})`,
      ]);
      expect(
        contrast(ink!, surface!),
        `${material} ${theme}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
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

test.describe("link items", () => {
  test("a link item renders a real anchor and keeps the menuitem role on the row", async ({
    page,
  }) => {
    await gotoStory(page, story("links"));
    const profile = item(page, "Profile");
    await expect(profile).toHaveAttribute("role", "menuitem");
    const anchors = await page.locator("pl-menu-item").evaluateAll((rows) =>
      rows.map((row) => {
        const a = row.shadowRoot!.querySelector("a");
        // Attributes, not properties: Firefox reports the page's <base target> as `target`.
        return (
          a && [
            a.getAttribute("href"),
            a.getAttribute("target") ?? "",
            a.getAttribute("rel") ?? "",
          ]
        );
      }),
    );
    expect(anchors).toEqual([
      ["#profile", "", ""],
      ["#billing", "", ""],
      ["https://example.com/help", "_blank", "noopener"],
      null, // disabled: no link
      null, // Sign Out is a plain command
    ]);
  });

  test("a click follows the link, fires pl-select and closes the menu", async ({
    page,
  }) => {
    await gotoStory(page, story("links"));
    await recordSelects(page);
    await item(page, "Profile").click();
    await expect(menu(page, "Account")).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => location.hash))
      .toBe("#profile");
    expect(await selects(page)).toEqual(["Profile"]);
  });

  test("Enter on a link item follows it once and closes the menu", async ({
    page,
  }) => {
    await gotoStory(page, story("links"));
    await recordSelects(page);
    await expect(item(page, "Profile")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(menu(page, "Account")).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => location.hash))
      .toBe("#billing");
    expect(await selects(page)).toEqual(["Billing"]);
  });

  test("a disabled link item does not follow its link", async ({ page }) => {
    await gotoStory(page, story("links"));
    await recordSelects(page);
    await item(page, "Archive").click({ force: true });
    await expect(menu(page, "Account")).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe("");
    expect(await selects(page)).toEqual([]);
  });
});

test.describe("description", () => {
  // The name and description are wired through ElementInternals, which
  // Playwright's accessible-name computation does not read, so these check
  // the parts the references point at.
  test("a described row keeps its label and description in separate parts", async ({
    page,
  }) => {
    await gotoStory(page, story("description"));
    await expect(page.getByText("Anyone with the link can view")).toBeVisible();
    const parts = await page.locator("pl-menu-item").evaluateAll((rows) =>
      rows.map((row) => {
        // The text a part shows: what its slot holds, or the slot's fallback.
        const text = (name: string) => {
          const part = row.shadowRoot!.querySelector<HTMLElement>(
            `[part=${name}]`,
          )!;
          if (part.hidden) return "";
          return part
            .querySelector("slot")!
            .assignedNodes({ flatten: true })
            .map((node) => node.textContent)
            .join("")
            .trim();
        };
        return [text("label"), text("description")];
      }),
    );
    expect(parts.slice(0, 3)).toEqual([
      ["Public", "Anyone with the link can view"],
      ["Team", "Only people in your team"],
      ["Private", "Only you"],
    ]);
  });

  test("a described row grows to two lines", async ({ page }) => {
    await gotoStory(page, story("description"));
    await expect(page.getByText("Anyone with the link can view")).toBeVisible();
    const fits = await page
      .locator("pl-menu-item")
      .first()
      .evaluate((row) => {
        const box = (name: string) =>
          row
            .shadowRoot!.querySelector(`[part=${name}]`)!
            .getBoundingClientRect();
        const label = box("label");
        const description = box("description");
        return (
          description.top >= label.bottom - 1 &&
          row.getBoundingClientRect().height >=
            label.height + description.height
        );
      });
    expect(fits).toBe(true);
  });

  test("a plain row has no description", async ({ page }) => {
    await gotoStory(page, story("default"));
    await trigger(page).click();
    await expect(item(page, "Undo ⌘Z")).toHaveAccessibleDescription("");
  });
});

test.describe("header", () => {
  test("it shows above the items and is skipped by the keyboard", async ({
    page,
  }) => {
    await gotoStory(page, story("header"));
    await expect(page.getByText("alex@example.com")).toBeVisible();
    const head = (await page.locator("#header").boundingBox())!;
    const first = (await item(page, "Profile").boundingBox())!;
    expect(head.y + head.height).toBeLessThanOrEqual(first.y);
    await expect(item(page, "Profile")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(item(page, "Sign Out")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Profile")).toBeFocused();
  });

  test("a menu without header content shows no header", async ({ page }) => {
    await gotoStory(page, story("default"));
    await trigger(page).click();
    await expect(page.getByRole("group")).toHaveCount(0);
  });

  test("clicking the header does not activate anything or close the menu", async ({
    page,
  }) => {
    await gotoStory(page, story("header"));
    await recordSelects(page);
    await page.getByText("Alex Doe").click();
    await expect(menu(page, "Account")).toBeVisible();
    expect(await selects(page)).toEqual([]);
  });
});

test.describe("placement", () => {
  test("bottom-end aligns the menu's end edge with the trigger", async ({
    page,
  }) => {
    // The centred story leaves room on both sides, so the viewport clamp stays out of it.
    await gotoStory(page, story("placement-end"));
    await expect(menu(page)).toBeVisible();
    await page.locator("#menu").evaluate((el) => {
      (el as unknown as { placement: string }).placement = "bottom-end";
    });
    const control = (await trigger(page).boundingBox())!;
    // Within a pixel: subpixel centring differs between engines.
    await expect
      .poll(async () => {
        const box = (await menu(page).boundingBox())!;
        return Math.abs(box.x + box.width - (control.x + control.width));
      })
      .toBeLessThanOrEqual(1);
    const box = (await menu(page).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(control.y + control.height);
  });

  test("end opens beside the trigger", async ({ page }) => {
    await gotoStory(page, story("placement-end"));
    await expect(menu(page)).toBeVisible();
    const box = (await menu(page).boundingBox())!;
    const control = (await trigger(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(control.x + control.width);
  });

  test("it flips to the other side when there is no room", async ({ page }) => {
    await gotoStory(page, story("default"));
    await page.locator("#menu").evaluate((el) => {
      (el as unknown as { placement: string }).placement = "top-start";
    });
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    const box = (await menu(page).boundingBox())!;
    const control = (await trigger(page).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(control.y + control.height);
  });

  test("changing placement while open moves the menu", async ({ page }) => {
    await gotoStory(page, story("placement-end"));
    await expect(menu(page)).toBeVisible();
    const before = (await menu(page).boundingBox())!;
    await page.locator("#menu").evaluate((el) => {
      (el as unknown as { placement: string }).placement = "bottom-end";
    });
    await expect
      .poll(async () => (await menu(page).boundingBox())!.x)
      .not.toBe(before.x);
  });
});

test.describe("pl-toggle", () => {
  const recordToggles = (page: Page) =>
    page.evaluate(() => {
      const log: boolean[] = [];
      document.addEventListener("pl-toggle", (e) =>
        log.push((e as CustomEvent<{ open: boolean }>).detail.open),
      );
      (window as unknown as { toggles: boolean[] }).toggles = log;
    });
  const toggles = (page: Page) =>
    page.evaluate(() => (window as unknown as { toggles: boolean[] }).toggles);

  test("fires with detail.open when it opens and when it closes", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await recordToggles(page);
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    expect(await toggles(page)).toEqual([true]);
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    expect(await toggles(page)).toEqual([true, false]);
  });

  test("a submenu's own toggles do not bubble to the page", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    await recordToggles(page);
    await item(page, "Find").hover();
    await expect(menu(page, "Find")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page, "Find")).toBeHidden();
    expect(await toggles(page)).toEqual([]);
  });
});

test.describe("opening from code", () => {
  test("show() opens with the first item focused and hide() returns focus to the trigger", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = page.locator("#menu");
    await el.evaluate((m) => (m as unknown as { show(): void }).show());
    await expect(menu(page)).toBeVisible();
    await expect(item(page, "Undo ⌘Z")).toBeFocused();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await el.evaluate((m) => (m as unknown as { hide(): void }).hide());
    await expect(menu(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("the open property and attribute open it with the first item focused", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const el = page.locator("#menu");
    await el.evaluate((m) => {
      (m as unknown as { open: boolean }).open = true;
    });
    await expect(menu(page)).toBeVisible();
    await expect(item(page, "Undo ⌘Z")).toBeFocused();
    await el.evaluate((m) => m.removeAttribute("open"));
    await expect(menu(page)).toBeHidden();
    await el.evaluate((m) => m.setAttribute("open", ""));
    await expect(menu(page)).toBeVisible();
    await expect(item(page, "Undo ⌘Z")).toBeFocused();
  });

  test("show() on an open menu focuses its first item again", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await trigger(page).click();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Redo ⇧⌘Z")).toBeFocused();
    await page
      .locator("#menu")
      .evaluate((m) => (m as unknown as { show(): void }).show());
    await expect(item(page, "Undo ⌘Z")).toBeFocused();
  });

  test("the story opened by show() is open", async ({ page }) => {
    await gotoStory(page, story("from-code"));
    await expect(menu(page)).toBeVisible();
    await expect(item(page, "Undo ⌘Z")).toBeFocused();
  });
});

test.describe("item icons", () => {
  // Page resets such as `* { margin: 0 }` reach a slotted svg, so the gap must
  // live in the shadow tree. Each kind of item is measured with one injected.
  test("every kind of item sizes its icon and keeps the icon gap from the label", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await page.addStyleTag({ content: "* { margin: 0 }" });
    const rows = await page.evaluate(async () => {
      const icon = `<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16" /></svg>`;
      const host = document.createElement("div");
      host.innerHTML = `
        <pl-menu id="kinds" label="Kinds">
          <pl-menu-item id="plain">${icon}Plain</pl-menu-item>
          <pl-menu-item id="link" href="#x">${icon}Link</pl-menu-item>
          <pl-menu-item id="checkbox" type="checkbox" checked>${icon}Checkbox</pl-menu-item>
          <pl-menu-item id="radio" type="radio" checked>${icon}Radio</pl-menu-item>
          <pl-menu-item id="parent">${icon}Parent
            <pl-menu slot="submenu" label="Sub"><pl-menu-item>One</pl-menu-item></pl-menu>
          </pl-menu-item>
        </pl-menu>`;
      document.body.append(host);
      const menu = host.querySelector<HTMLElement & { open: boolean }>(
        "#kinds",
      )!;
      menu.open = true;
      await (menu as unknown as { updateComplete: Promise<unknown> })
        .updateComplete;
      const probe = document.createElement("div");
      probe.style.inlineSize = "var(--pl-gap-icon)";
      document.body.append(probe);
      const gap = probe.getBoundingClientRect().width;
      probe.remove();
      return [...menu.children].map((row) => {
        const svg = row.querySelector(":scope > svg")!.getBoundingClientRect();
        const label = row
          .shadowRoot!.querySelector("[part=label]")!
          .getBoundingClientRect();
        return {
          id: row.id,
          width: svg.width,
          gap: label.left - svg.right,
          expected: gap,
        };
      });
    });
    expect(rows.map((row) => row.id)).toEqual([
      "plain",
      "link",
      "checkbox",
      "radio",
      "parent",
    ]);
    for (const row of rows) {
      expect(row.expected, `${row.id} token`).toBeGreaterThan(0);
      expect(Math.abs(row.width - 16), `${row.id} width`).toBeLessThanOrEqual(
        1,
      );
      expect(row.gap, `${row.id} gap`).toBeGreaterThanOrEqual(row.expected - 1);
    }
  });
});

test.describe("choosing an item", () => {
  test("dispatches click on the item, then pl-select with the item in its detail", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await page.evaluate(() => {
      const log: string[] = [];
      (window as unknown as { order: string[] }).order = log;
      const copy = document.querySelector("pl-menu-item:nth-of-type(3)")!;
      copy.addEventListener("click", () => log.push("click"));
      document.addEventListener("pl-select", (e) => {
        const { item, value } = (
          e as CustomEvent<{ item: Element; value: string }>
        ).detail;
        log.push(`select ${value} ${item === copy}`);
      });
    });
    await openByKey(page, "ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Copy ⌘C")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(menu(page)).toBeHidden();
    expect(
      await page.evaluate(
        () => (window as unknown as { order: string[] }).order,
      ),
    ).toEqual(["click", "select Copy true"]);
  });
});
