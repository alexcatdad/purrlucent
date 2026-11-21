import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-select--${name}`;

const trigger = (page: Page, name = "Apple variety") =>
  page.getByRole("combobox", { name });
const option = (page: Page, name: string) =>
  page.getByRole("option", { name, exact: true });
const listbox = (page: Page) => page.getByRole("listbox");

/** What the form would submit, as [name, value] pairs. */
const submitted = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
        k,
        String(v),
      ]),
    );

const selectedLabel = (page: Page, name = "Apple variety") =>
  trigger(page, name).locator("[part=value]");

test("aria snapshot, closed", async ({ page }) => {
  const root = await gotoStory(page, story("preselected"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Apple variety" [expanded=false]: Fuji
  `);
});

test("aria snapshot, open", async ({ page }) => {
  const root = await gotoStory(page, story("open"));
  await expect(root).toMatchAriaSnapshot(`
    - combobox "Apple variety" [expanded]: Fuji
    - listbox "Apple variety":
      - option "McIntosh" [selected=false]
      - option "Fuji" [selected]
      - option "Gala" [selected=false]
      - option "Honeycrisp" [disabled] [selected=false]
  `);
});

test("a click opens the list with the choice focused and a second click closes it", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await trigger(page).click();
  await expect(listbox(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  await expect(option(page, "Fuji")).toBeFocused();
  await trigger(page).click();
  await expect(listbox(page)).toBeHidden();
});

test("clicking an option chooses it, closes the list and returns focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const changes = await page.evaluate(() => {
    const log: string[] = [];
    document
      .querySelector("#select")!
      .addEventListener("purr-change", (e) =>
        log.push((e as CustomEvent<{ value: string }>).detail.value),
      );
    (window as unknown as { log: string[] }).log = log;
    return log;
  });
  expect(changes).toEqual([]);
  await trigger(page).click();
  await option(page, "Gala").click();
  await expect(listbox(page)).toBeHidden();
  await expect(selectedLabel(page)).toHaveText("Gala");
  await expect(trigger(page)).toBeFocused();
  expect(
    await page.evaluate(() => (window as never as { log: string[] }).log),
  ).toEqual(["Gala"]);
  // Choosing the same option again is not a change.
  await trigger(page).click();
  await option(page, "Gala").click();
  expect(
    await page.evaluate(() => (window as never as { log: string[] }).log),
  ).toEqual(["Gala"]);
});

test("Enter, Space, ArrowDown and ArrowUp open the list without changing the value", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  for (const key of ["Enter", "Space", "ArrowDown", "ArrowUp"]) {
    await trigger(page).focus();
    await page.keyboard.press(key);
    await expect(listbox(page)).toBeVisible();
    await expect(option(page, "Fuji")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(listbox(page)).toBeHidden();
    await expect(selectedLabel(page)).toHaveText("Fuji");
  }
});

test("arrows move, skip disabled options and stop at the ends; Home and End jump", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "McIntosh")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(option(page, "McIntosh")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "Gala")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(option(page, "Gala")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(option(page, "McIntosh")).toBeFocused();
  await page.keyboard.press("End");
  await expect(option(page, "Gala")).toBeFocused();
});

test("Enter and Space choose and close", async ({ page }) => {
  await gotoStory(page, story("default"));
  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(selectedLabel(page)).toHaveText("Fuji");
  await expect(listbox(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(selectedLabel(page)).toHaveText("Gala");
});

test("Escape closes without changing and returns focus to the trigger", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(listbox(page)).toBeHidden();
  await expect(selectedLabel(page)).toHaveText("Fuji");
  await expect(trigger(page)).toBeFocused();
});

test("Tab closes the list and moves on", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    // An input: WebKit's Tab order skips buttons and links by default.
    const next = document.createElement("input");
    next.id = "next";
    document.querySelector("purr-select")!.after(next);
  });
  await trigger(page).focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(listbox(page)).toBeHidden();
  await expect(page.locator("#next")).toBeFocused();
});

test("typing jumps to the matching option, and the buffer resets after a pause", async ({
  page,
}) => {
  await gotoStory(page, story("long-list"));
  await trigger(page, "Number").focus();
  await page.keyboard.press("ArrowDown");
  // The list opens at 12, so a lone "3" moves on to the next label that starts with it.
  await page.keyboard.type("3");
  await expect(option(page, "30")).toBeFocused();
  await page.keyboard.type("1");
  await expect(option(page, "31")).toBeFocused();
  await page.waitForTimeout(700);
  await page.keyboard.type("4");
  await expect(option(page, "40")).toBeFocused();
});

test("typing on the closed trigger opens the list at the match", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await trigger(page).focus();
  await page.keyboard.type("g");
  await expect(option(page, "Gala")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(selectedLabel(page)).toHaveText("Gala");
});

test("a press outside closes the list", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(listbox(page)).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(listbox(page)).toBeHidden();
  await expect(selectedLabel(page)).toHaveText("Fuji");
});

test("a disabled option cannot be chosen", async ({ page }) => {
  await gotoStory(page, story("open"));
  await option(page, "Honeycrisp").click({ force: true });
  await expect(listbox(page)).toBeVisible();
  await expect(selectedLabel(page)).toHaveText("Fuji");
});

test("the placeholder shows while nothing is chosen", async ({ page }) => {
  await gotoStory(page, story("placeholder"));
  await expect(selectedLabel(page)).toHaveText("Choose a variety");
});

test("a disabled select takes no focus and does not open", async ({ page }) => {
  await gotoStory(page, story("disabled"));
  const control = trigger(page);
  await expect(control.first()).toBeDisabled();
  await control.first().click({ force: true });
  await expect(listbox(page)).toBeHidden();
});

test.describe("near the bottom edge", () => {
  test.use({ viewport: { width: 800, height: 400 } });

  test("the popup flips and stays inside the viewport", async ({ page }) => {
    await gotoStory(page, story("default"));
    await page.locator("#select").evaluate((el) => {
      el.style.position = "fixed";
      el.style.insetBlockEnd = "10px";
      el.style.insetInlineStart = "10px";
    });
    await trigger(page).click();
    const list = (await listbox(page).boundingBox())!;
    const control = (await trigger(page).boundingBox())!;
    expect(list.y).toBeGreaterThanOrEqual(0);
    expect(list.y + list.height).toBeLessThanOrEqual(400);
    expect(list.y + list.height).toBeLessThanOrEqual(control.y);
  });

  test("a long list scrolls inside the popup", async ({ page }) => {
    await gotoStory(page, story("long-list"));
    await trigger(page, "Number").click();
    const list = listbox(page);
    const { scroll, client } = await list.evaluate((el) => ({
      scroll: el.scrollHeight,
      client: el.clientHeight,
    }));
    expect(scroll).toBeGreaterThan(client);
    const box = (await list.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(400);
    await expect(option(page, "12")).toBeFocused();
    await expect(option(page, "12")).toBeInViewport();
  });
});

test("the popup is at least as wide as the trigger", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  const control = trigger(page, "Apple variety, xl");
  await control.click();
  const list = (await listbox(page).boundingBox())!;
  const box = (await control.boundingBox())!;
  expect(list.width).toBeGreaterThanOrEqual(box.width - 0.5);
});

test("the form gets the chosen value", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([["apple", "fuji"]]);
  await trigger(page, "Required pick").click();
  await option(page, "Beta").click();
  expect(await submitted(page)).toEqual([
    ["apple", "fuji"],
    ["pick", "b"],
  ]);
});

test("a form reset returns each select to its selected option or none", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await trigger(page).click();
  await option(page, "Gala").click();
  await trigger(page, "Required pick").click();
  await option(page, "Alpha").click();
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(selectedLabel(page)).toHaveText("Fuji");
  await expect(selectedLabel(page, "Required pick")).toHaveText("Choose");
  expect(await submitted(page)).toEqual([["apple", "fuji"]]);
});

test("a required select makes the form invalid until one is chosen", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const valid = () =>
    page
      .locator("#form")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  expect(await valid()).toBe(false);
  await trigger(page, "Required pick").click();
  await option(page, "Alpha").click();
  expect(await valid()).toBe(true);
});

test("a disabled fieldset disables the select and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(trigger(page)).toBeDisabled();
  await trigger(page).click({ force: true });
  await expect(listbox(page)).toBeHidden();
  expect(await submitted(page)).toEqual([]);
});

test("under rtl the popup aligns to the trigger's start edge", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  await trigger(page).click();
  const list = (await listbox(page).boundingBox())!;
  const box = (await trigger(page).boundingBox())!;
  expect(list.x + list.width).toBeCloseTo(box.x + box.width, 0);
});

test("the focus ring and the selection stay visible under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(trigger(page)).toBeFocused();
  expect(
    await trigger(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("ArrowDown");
  const chosen = option(page, "Fuji");
  await expect(chosen).toBeFocused();
  const colors = await chosen.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.backgroundColor, style.color];
  });
  expect(colors[0]).not.toBe(colors[1]);
});

/** Adds `markup` after the story, so a test can probe states no story shows. */
const mount = (page: Page, markup: string) =>
  page.evaluate((markup) => {
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
  }, markup);

const abc = `
  <purr-option value="a">Alpha</purr-option>
  <purr-option value="b">Beta</purr-option>
  <purr-option value="c">Gamma</purr-option>`;

test("a form reset returns a select to its starting value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<form id="probe"><purr-select label="Probe" value="b">${abc}</purr-select></form>`,
  );
  await expect(selectedLabel(page, "Probe")).toHaveText("Beta");
  await trigger(page, "Probe").click();
  await option(page, "Gamma").click();
  await page
    .locator("#probe")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(selectedLabel(page, "Probe")).toHaveText("Beta");
});

test("Escape closes an open select without closing the dialog around it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<dialog id="probe"><purr-select label="Probe">${abc}</purr-select></dialog>`,
  );
  await page
    .locator("#probe")
    .evaluate((el) => (el as HTMLDialogElement).showModal());
  await trigger(page, "Probe").click();
  await expect(listbox(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(listbox(page)).toBeHidden();
  await expect(page.locator("#probe")).toHaveAttribute("open", "");
});

test("a changed option label shows in the trigger", async ({ page }) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<purr-select label="Probe" value="b">${abc}</purr-select>`,
  );
  await expect(selectedLabel(page, "Probe")).toHaveText("Beta");
  await page.evaluate(() => {
    document.querySelector('purr-option[value="b"]')!.textContent = "Renamed";
  });
  await expect(selectedLabel(page, "Probe")).toHaveText("Renamed");
});

test("Home and End open the closed list on the first and last option", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  for (const [key, name] of [
    ["End", "Gala"],
    ["Home", "McIntosh"],
  ] as const) {
    await trigger(page).focus();
    await page.keyboard.press(key);
    await expect(listbox(page)).toBeVisible();
    await expect(option(page, name)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(listbox(page)).toBeHidden();
  }
});

test("a select moved in the DOM while open still shows its list", async ({
  page,
}) => {
  await gotoStory(page, story("preselected"));
  await trigger(page).click();
  await expect(listbox(page)).toBeVisible();
  await page.evaluate(() => {
    const el = document.querySelector("purr-select")!;
    el.parentElement!.append(el);
  });
  await expect(listbox(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
});

test("the open list keeps at least the trigger's width when the trigger grows", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await mount(
    page,
    `<purr-select label="Probe" style="inline-size:200px">${abc}</purr-select>`,
  );
  await trigger(page, "Probe").click();
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      'purr-select[label="Probe"]',
    )!.style.inlineSize = "320px";
    dispatchEvent(new Event("resize"));
  });
  await expect
    .poll(async () => (await listbox(page).boundingBox())!.width)
    .toBeGreaterThanOrEqual(320);
});

for (const scheme of ["light", "dark"] as const) {
  for (const contrast of ["no-preference", "more"] as const) {
    test(`the option focus ring contrasts with the selection fill in ${scheme} with ${contrast} contrast`, async ({
      page,
    }) => {
      await page.emulateMedia({
        colorScheme: scheme,
        contrast,
        reducedMotion: "reduce",
      });
      await gotoStory(page, story("preselected"));
      await trigger(page).focus();
      await page.keyboard.press("ArrowDown");
      await expect(option(page, "Fuji")).toBeFocused();
      const measure = () =>
        option(page, "Fuji").evaluate((el) => {
          const style = getComputedStyle(el);
          const ctx = document.createElement("canvas").getContext("2d")!;
          const luminance = (color: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].map(
              (c) => {
                const s = c / 255;
                return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
              },
            );
            return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
          };
          const [hi, lo] = [
            luminance(style.outlineColor),
            luminance(style.backgroundColor),
          ].sort((a, b) => b - a);
          return (hi! + 0.05) / (lo! + 0.05);
        });
      await expect.poll(measure).toBeGreaterThanOrEqual(3);
    });
  }
}

test("the trigger changes its border when open under forced colors", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await gotoStory(page, story("preselected"));
  const border = () =>
    trigger(page).evaluate((el) => getComputedStyle(el).borderColor);
  const closed = await border();
  await trigger(page).click();
  await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  expect(await border()).not.toBe(closed);
});

for (const name of [
  "default",
  "preselected",
  "placeholder",
  "sizes",
  "disabled",
  "in-form",
  "open",
  "rtl",
  "glass",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("a select without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-select");
    bare.innerHTML = "<purr-option>One</purr-option>";
    el.append(bare);
  });
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

test("virtual screen reader speaks the options of the open list", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("option, Fuji");
  expect(spoken).toContain("option, Gala");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the trigger and every option are at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    const box = (await trigger(page).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    for (const item of await page.getByRole("option").all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

forEachViewport(({ name }) => {
  for (const id of ["default", "sizes", "open", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, story(id));
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
