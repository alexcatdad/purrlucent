import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-command--${name}`;

const search = (page: Page) => page.getByRole("combobox", { name: "Commands" });
const item = (page: Page, value: string) =>
  page.locator(`pl-command-item[value="${value}"]`);

/** The value of the item the field's active descendant points at. */
const activeDescendant = (page: Page) =>
  search(page).evaluate(
    (input) =>
      (
        input as HTMLInputElement & { ariaActiveDescendantElement: Element }
      ).ariaActiveDescendantElement?.getAttribute("value") ?? null,
  );

/** The value of the item the command marks active. */
const active = (page: Page) =>
  page
    .locator("pl-command")
    .evaluate((el) => el.querySelector("[data-active]")?.getAttribute("value"));

/** Records the detail of each pl-select on the command in window.log. */
const record = (page: Page) =>
  page.locator("pl-command").evaluate((el) => {
    const log: unknown[] = [];
    (window as unknown as { log: unknown[] }).log = log;
    el.addEventListener("pl-select", (e) =>
      log.push((e as CustomEvent).detail),
    );
  });
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: unknown[] }).log);

const mount = (page: Page, markup: string) =>
  page.evaluate((markup) => {
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
  }, markup);

test("aria snapshot, no results", async ({ page }) => {
  const root = await gotoStory(page, story("no-results"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Commands" [expanded]: zzz
    - listbox "Commands":
      - option "No results" [disabled]
  `);
});

test("the list is always showing, and its first item is the active descendant", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(search(page)).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("option")).toHaveCount(6);
  expect(await activeDescendant(page)).toBe("new");
  expect(await active(page)).toBe("new");
});

test("groups are named by their label", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("group", { name: "Files" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Settings" })).toBeVisible();
});

test("typing hides items that do not match, and a group left with none", async ({
  page,
}) => {
  await gotoStory(page, story("filtered"));
  await expect(item(page, "new")).toBeVisible();
  await expect(item(page, "open")).toBeVisible();
  await expect(item(page, "prefs")).toBeHidden();
  await expect(page.getByRole("group", { name: "Files" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Settings" })).toHaveCount(0);
  expect(await active(page)).toBe("new");
});

test("a no results row shows while nothing matches, and leaves when something does", async ({
  page,
}) => {
  await gotoStory(page, story("no-results"));
  await expect(page.getByRole("option", { name: "No results" })).toBeVisible();
  expect(await active(page)).toBeUndefined();
  expect(await activeDescendant(page)).toBeNull();
  await search(page).fill("pref");
  await expect(page.getByRole("option", { name: "No results" })).toHaveCount(0);
  await expect(item(page, "prefs")).toBeVisible();
});

test("Down and Up move the active item, skip a disabled one and wrap", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await search(page).focus();
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("open");
  // "save" is disabled.
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("prefs");
  await page.keyboard.press("ArrowUp");
  expect(await activeDescendant(page)).toBe("open");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect(await activeDescendant(page)).toBe("out");
  await page.keyboard.press("ArrowDown");
  expect(await activeDescendant(page)).toBe("new");
  await expect(search(page)).toBeFocused();
});

test("Home and End jump to the first and last item", async ({ page }) => {
  await gotoStory(page, story("default"));
  await search(page).focus();
  await page.keyboard.press("End");
  expect(await activeDescendant(page)).toBe("out");
  await page.keyboard.press("Home");
  expect(await activeDescendant(page)).toBe("new");
});

test("Enter activates the active item and fires pl-select with its value", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await search(page).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  expect(await recorded(page)).toEqual([{ value: "open" }]);
  await expect(search(page)).toBeFocused();
});

test("an item without a value reports its label", async ({ page }) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<pl-command id="probe" label="Probe"><pl-command-item>Alpha</pl-command-item></pl-command>`,
  );
  await page.locator("#probe").evaluate((el) => {
    const log: unknown[] = [];
    (window as unknown as { log: unknown[] }).log = log;
    el.addEventListener("pl-select", (e) =>
      log.push((e as CustomEvent).detail),
    );
  });
  await page.getByRole("combobox", { name: "Probe" }).focus();
  await page.keyboard.press("Enter");
  expect(await recorded(page)).toEqual([{ value: "Alpha" }]);
});

test("clicking an item fires pl-select, and a disabled item does not", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await item(page, "keys").click();
  await item(page, "save").click({ force: true });
  expect(await recorded(page)).toEqual([{ value: "keys" }]);
  await expect(search(page)).toBeFocused();
});

test("pointing at an item makes it the active one", async ({ page }) => {
  await gotoStory(page, story("default"));
  await item(page, "out").hover();
  expect(await active(page)).toBe("out");
  await item(page, "save").hover({ force: true });
  expect(await active(page)).toBe("out");
});

test("a search narrows the list as people type and Enter takes the first match", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await search(page).focus();
  await page.keyboard.type("sign");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  expect(await recorded(page)).toEqual([{ value: "out" }]);
});

test("Escape clears a search with text and does nothing to an empty one", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await search(page).fill("file");
  await expect(item(page, "prefs")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(search(page)).toHaveValue("");
  await expect(item(page, "prefs")).toBeVisible();
  expect(await active(page)).toBe("new");
});

test("the clear button shows only while the field has text and clears it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const clear = page.getByRole("button", { name: "Clear" });
  await expect(clear).toHaveCount(0);
  await search(page).fill("file");
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(search(page)).toHaveValue("");
  await expect(search(page)).toBeFocused();
  await expect(clear).toHaveCount(0);
});

test("pl-input reports the text, and a clear also fires the native input event", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("pl-command").evaluate((el) => {
    const log: unknown[] = [];
    (window as unknown as { log: unknown[] }).log = log;
    el.addEventListener("pl-input", (e) =>
      log.push((e as CustomEvent).detail.query),
    );
    el.addEventListener("input", () => log.push("input"));
  });
  await search(page).focus();
  await page.keyboard.type("a");
  await page.keyboard.press("Escape");
  expect(await recorded(page)).toEqual(["a", "input", "", "input"]);
});

test("an item added later is listed, searched and can be active", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page
    .locator("pl-command-group")
    .first()
    .evaluate((group) => {
      group.insertAdjacentHTML(
        "beforeend",
        '<pl-command-item value="zip">Compress archive</pl-command-item>',
      );
    });
  await expect(item(page, "zip")).toBeVisible();
  await search(page).fill("compress");
  await expect(page.getByRole("option")).toHaveCount(1);
  expect(await active(page)).toBe("zip");
});

test("a disabled first item is skipped for the starting active item", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await item(page, "new").evaluate((el) => el.setAttribute("disabled", ""));
  await expect(item(page, "new")).toHaveAttribute("aria-disabled", "true");
  await search(page).fill("e");
  await expect.poll(() => active(page)).toBe("open");
});

test("empty-label and clear-label replace the built-in strings", async ({
  page,
}) => {
  await gotoStory(page, story("no-results"));
  await page.locator("pl-command").evaluate((el) => {
    el.setAttribute("clear-label", "Effacer");
    el.setAttribute("empty-label", "Aucun résultat");
  });
  await expect(page.getByRole("button", { name: "Effacer" })).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Aucun résultat" }),
  ).toBeVisible();
});

test("the placeholder tells people what they can search", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(search(page)).toHaveAttribute("placeholder", "Search commands");
});

test("in a dialog, the field takes focus and Enter selects without pressing a button", async ({
  page,
}) => {
  await gotoStory(page, story("in-dialog"));
  await expect(search(page)).toBeFocused();
  await page.locator("pl-command").evaluate((el) => {
    (window as unknown as { log: unknown[] }).log = [];
    el.addEventListener("pl-select", (e) =>
      (window as unknown as { log: unknown[] }).log.push(
        (e as CustomEvent).detail,
      ),
    );
  });
  await page.keyboard.press("Enter");
  expect(await recorded(page)).toEqual([{ value: "new" }]);
  await expect(page.locator("pl-dialog")).toHaveAttribute("open", "");
});

test("in a dialog, Escape clears the text first and closes the dialog second", async ({
  page,
}) => {
  await gotoStory(page, story("in-dialog"));
  await expect(search(page)).toBeFocused();
  await page.keyboard.type("pref");
  await page.keyboard.press("Escape");
  await expect(search(page)).toHaveValue("");
  await expect(page.locator("pl-dialog")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(page.locator("pl-dialog")).not.toHaveAttribute("open", "");
});

test("the active item uses the system highlight under forced colors", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await gotoStory(page, story("default"));
  const fill = (value: string) =>
    item(page, value).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await fill("new")).not.toBe(await fill("open"));
});

test("the active item is filled and the others are not", async ({ page }) => {
  await gotoStory(page, story("default"));
  const fill = (value: string) =>
    item(page, value).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await fill("new")).not.toBe("rgba(0, 0, 0, 0)");
  expect(await fill("open")).toBe("rgba(0, 0, 0, 0)");
});

test("reduced motion removes the highlight transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  expect(
    await item(page, "new").evaluate(
      (el) => getComputedStyle(el).transitionDuration,
    ),
  ).toBe("0s, 0s");
});

test("a long list scrolls inside the list and keeps the active item in view", async ({
  page,
}) => {
  await gotoStory(page, story("ungrouped"));
  await page.locator("pl-command").evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      Array.from(
        { length: 30 },
        (_, i) => `<pl-command-item value="n${i}">Item ${i}</pl-command-item>`,
      ).join(""),
    );
  });
  await search(page).focus();
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      page.locator("pl-command").evaluate((el) => {
        const list = el.shadowRoot!.querySelector("[part=list]")!;
        const row = el.querySelector("[data-active]")!.getBoundingClientRect();
        const box = list.getBoundingClientRect();
        return row.top >= box.top && row.bottom <= box.bottom;
      }),
    )
    .toBe(true);
  await page.keyboard.press("Home");
  await expect
    .poll(() =>
      page
        .locator("pl-command")
        .evaluate(
          (el) => el.shadowRoot!.querySelector("[part=list]")!.scrollTop,
        ),
    )
    .toBe(0);
});

for (const name of [
  "default",
  "ungrouped",
  "filtered",
  "no-results",
  "active",
  "in-dialog",
  "rtl",
  "glass",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    // Axe reads colours: zero durations, so no highlight is caught mid-fade.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const root = await gotoStory(page, story(name));
    await expectAccessible(root);
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the field, the clear button and every item are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("filtered"));
    expect((await search(page).boundingBox())!.height).toBeGreaterThanOrEqual(
      44,
    );
    const clear = (await page
      .getByRole("button", { name: "Clear" })
      .boundingBox())!;
    expect(clear.width).toBeGreaterThanOrEqual(44);
    expect(clear.height).toBeGreaterThanOrEqual(44);
    for (const row of await page.getByRole("option").all())
      expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});
