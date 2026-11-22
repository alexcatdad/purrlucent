import { expect, test, type Page } from "@playwright/test";
import {
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-dialog--${name}`;

const alert = (page: Page) => page.getByRole("alertdialog");
const sheet = (page: Page) => page.getByRole("dialog");
const dialogEl = (page: Page) => page.locator("purr-dialog");
const isOpen = (page: Page) =>
  dialogEl(page).evaluate((el) => (el as HTMLElement & { open: boolean }).open);
const activeInside = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest("purr-dialog"));

/** Records what the dialog fires, as [event, detail] pairs, on window.log. */
const record = (page: Page) =>
  dialogEl(page).evaluate((el) => {
    const log: unknown[][] = [];
    (window as unknown as { log: unknown[][] }).log = log;
    for (const name of ["purr-cancel", "purr-close"])
      el.addEventListener(name, (event) =>
        log.push([name, (event as CustomEvent).detail ?? null]),
      );
  });
const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: unknown[][] }).log);

/** Takes the `default` or `cancel` mark off the actions, to reach the plain behavior. */
const withoutRole = (page: Page, role: "default" | "cancel") =>
  dialogEl(page).evaluate(
    (el, name) =>
      el
        .querySelectorAll(`[slot=actions][${name}]`)
        .forEach((button) => button.removeAttribute(name)),
    role,
  );

/** Opens the closed Default story with a click on its trigger. */
const openDefault = async (page: Page) => {
  await gotoStory(page, story("default"));
  await record(page);
  await page.locator("#trigger").click();
  await expect(alert(page)).toBeVisible();
};

test("aria snapshot, alert", async ({ page }) => {
  const root = await gotoStory(page, story("open-alert"));
  await expect(root).toMatchAriaSnapshot(`
    - alertdialog "Save this message as a draft?":
      - heading "Save this message as a draft?" [level=2]
      - text: This message has not been sent and contains unsaved changes. You can save it as a draft to work on later.
      - button "Cancel"
      - button "Save"
  `);
});

test("the alert is named by its title and described by its message", async ({
  page,
}) => {
  await gotoStory(page, story("open-alert"));
  await expect(alert(page)).toHaveAccessibleName(
    "Save this message as a draft?",
  );
  await expect(alert(page)).toHaveAccessibleDescription(
    /^This message has not been sent .* work on later\.$/,
  );
});

test("the sheet is a dialog named by its title and described by its description, not its form", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page)).toHaveAccessibleName(
    "Do you want to keep this new document “Untitled”?",
  );
  await expect(sheet(page)).toHaveAccessibleDescription(
    "You can choose to save your changes, or delete this document immediately. You can’t undo this action.",
  );
});

test("without a title the label names the dialog", async ({ page }) => {
  await gotoStory(page, story("open-alert"));
  await dialogEl(page).evaluate((el) => {
    el.querySelector("[slot=title]")!.remove();
    el.setAttribute("label", "Unsaved message");
  });
  await expect(alert(page)).toHaveAccessibleName("Unsaved message");
});

test("an alert opens with its default action focused", async ({ page }) => {
  await gotoStory(page, story("open-alert"));
  await expect(page.getByRole("button", { name: "Save" })).toBeFocused();
});

test("without a default action the cancel action is focused first", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await withoutRole(page, "default");
  await dialogEl(page).evaluate((el) =>
    (el as never as { show(): void }).show(),
  );
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
});

test("Return in the body activates the default action", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await record(page);
  await expect(page.getByRole("textbox", { name: "Save as" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["purr-close", { returnValue: "save" }]]);
});

test("Escape activates the cancel action", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await record(page);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["purr-close", { returnValue: "cancel" }]]);
});

test("Command-Period activates the cancel action", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await record(page);
  await page.keyboard.press("Meta+.");
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["purr-close", { returnValue: "cancel" }]]);
});

test("Return in a textarea adds a newline and does not activate the default", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  const area = await dialogEl(page).evaluateHandle((el) => {
    const textarea = document.createElement("textarea");
    el.append(textarea);
    textarea.focus();
    return textarea;
  });
  await page.keyboard.type("a");
  await page.keyboard.press("Enter");
  await page.keyboard.type("b");
  expect(await area.evaluate((el) => (el as HTMLTextAreaElement).value)).toBe(
    "a\nb",
  );
  await expect(sheet(page)).toBeVisible();
});

test("a destructive default is not used and warns", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await gotoStory(page, story("default"));
  await dialogEl(page).evaluate((el) => {
    el.querySelector("[default]")!.setAttribute("destructive", "");
    (el as never as { show(): void }).show();
  });
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  expect(warnings.join()).toContain("destructive button cannot be the default");
  await dialogEl(page)
    .locator("[part=body]")
    .evaluate((el) =>
      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          composed: true,
        }),
      ),
    );
  await expect(alert(page)).toBeVisible();
});

test("an autofocus field wins initial focus", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await expect(page.getByRole("textbox", { name: "Save as" })).toBeFocused();
});

// The native modal dialog traps focus between the dialog and the browser's own
// controls: past the last element Tab leaves the page, and never reaches the
// inert content behind.
test("Tab and Shift+Tab cycle through the dialog and never reach the page behind", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  const reached = new Set<string>();
  for (const key of ["Tab", "Shift+Tab"])
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press(key);
      const behind = await page.evaluate(
        () => document.activeElement?.id === "trigger",
      );
      expect(behind).toBe(false);
      if (await activeInside(page))
        reached.add(
          await page.evaluate(
            () => document.activeElement?.textContent?.trim() ?? "",
          ),
        );
    }
  expect(reached.has("Delete")).toBe(true);
  expect(reached.has("Save")).toBe(true);
});

test("the page behind is inert", async ({ page }) => {
  await gotoStory(page, story("open-alert"));
  await expect(page.locator("#trigger")).not.toBeFocused();
  await page.locator("#trigger").click({ force: true });
  await expect(alert(page)).toBeVisible();
  expect(await activeInside(page)).toBe(true);
});

test("Escape asks to cancel, closes, and returns focus to the opener", async ({
  page,
}) => {
  await openDefault(page);
  await withoutRole(page, "cancel");
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
  // The native close event is queued after the dialog hides.
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["purr-cancel", null],
      ["purr-close", { returnValue: "" }],
    ]);
  await expect(page.locator("#trigger")).toBeFocused();
});

test("a cancel handler can keep the dialog open", async ({ page }) => {
  await openDefault(page);
  await withoutRole(page, "cancel");
  await dialogEl(page).evaluate((el) =>
    el.addEventListener("purr-cancel", (event) => event.preventDefault(), {
      once: true,
    }),
  );
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeVisible();
  expect(await isOpen(page)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
});

test("pressing the backdrop does not close an alert", async ({ page }) => {
  await openDefault(page);
  await page.mouse.click(5, 5);
  await expect(alert(page)).toBeVisible();
  expect(await recorded(page)).toEqual([]);
});

test("pressing the backdrop does not close a sheet that is not dismissible", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  await page.mouse.click(5, 5);
  await expect(sheet(page)).toBeVisible();
});

test("pressing the backdrop closes a dismissible sheet and can be cancelled", async ({
  page,
}) => {
  await gotoStory(page, story("open-long-content"));
  await record(page);
  await dialogEl(page).evaluate((el) =>
    el.addEventListener("purr-cancel", (event) => event.preventDefault(), {
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
      ["purr-cancel", null],
      ["purr-cancel", null],
      ["purr-close", { returnValue: "" }],
    ]);
});

test("a drag that starts inside a dismissible sheet and ends on the backdrop keeps it open", async ({
  page,
}) => {
  await gotoStory(page, story("open-long-content"));
  const box = (await page.getByRole("heading").boundingBox())!;
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.down();
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect(sheet(page)).toBeVisible();
});

test("an element with data-close closes the dialog with its value", async ({
  page,
}) => {
  await openDefault(page);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["purr-close", { returnValue: "save" }]]);
  await expect(page.locator("#trigger")).toBeFocused();
});

test("the keyboard closes with a value, and a later Escape reports none", async ({
  page,
}) => {
  await openDefault(page);
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(async () => (await recorded(page)).at(-1))
    .toEqual(["purr-close", { returnValue: "cancel" }]);
  await page.locator("#trigger").click();
  await withoutRole(page, "cancel");
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(async () => (await recorded(page)).at(-1))
    .toEqual(["purr-close", { returnValue: "" }]);
  expect(
    await dialogEl(page).evaluate(
      (el) => (el as never as { returnValue: string }).returnValue,
    ),
  ).toBe("");
});

test("a disabled data-close button does not close", async ({ page }) => {
  await gotoStory(page, story("open-alert"));
  const save = page.getByRole("button", { name: "Save" });
  await save.evaluate((el) => el.setAttribute("disabled", ""));
  await save.click({ force: true });
  await expect(alert(page)).toBeVisible();
});

test("show() and close(value) work from script, and removing open closes", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await dialogEl(page).evaluate((el) =>
    (el as HTMLElement & { show(): void }).show(),
  );
  await expect(alert(page)).toBeVisible();
  await dialogEl(page).evaluate((el) =>
    (el as HTMLElement & { close(v?: string): void }).close("done"),
  );
  await expect(alert(page)).toBeHidden();
  expect(await isOpen(page)).toBe(false);
  // The native close event is queued; a reopen before it ran would hide it.
  await expect.poll(async () => (await recorded(page)).length).toBe(1);
  await dialogEl(page).evaluate((el) => el.setAttribute("open", ""));
  await expect(alert(page)).toBeVisible();
  await dialogEl(page).evaluate((el) => el.removeAttribute("open"));
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["purr-close", { returnValue: "done" }],
      ["purr-close", { returnValue: "" }],
    ]);
});

test("the page does not scroll while a dialog is open", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.evaluate(() => {
    const filler = document.createElement("div");
    filler.style.blockSize = "300vh";
    document.body.append(filler);
  });
  const overflow = () =>
    page.evaluate(() => document.documentElement.style.overflow);
  expect(await overflow()).toBe("");
  await page.locator("#trigger").click();
  await expect(alert(page)).toBeVisible();
  expect(await overflow()).toBe("hidden");
  await page.mouse.wheel(0, 400);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  // Escape reaches the dialog only once initial focus has moved into it.
  await expect.poll(() => activeInside(page)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
  await expect.poll(overflow).toBe("");
});

test("removing an open dialog releases the scroll lock", async ({ page }) => {
  await gotoStory(page, story("open-alert"));
  await dialogEl(page).evaluate((el) => el.remove());
  expect(
    await page.evaluate(() => document.documentElement.style.overflow),
  ).toBe("");
});

test("a re-inserted open dialog is modal again and keeps the scroll lock", async ({
  page,
}) => {
  await gotoStory(page, story("open-alert"));
  await dialogEl(page).evaluate((el) => el.parentElement!.append(el));
  await expect
    .poll(() =>
      dialogEl(page).evaluate((el) =>
        el.shadowRoot!.querySelector("dialog")!.matches(":modal"),
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.style.overflow),
  ).toBe("hidden");
  expect(await isOpen(page)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.overflow))
    .toBe("");
});

test("a sheet without a description leaves no gap under the title", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  const gap = await dialogEl(page).evaluate((el) => {
    el.querySelector("[slot=description]")!.remove();
    const root = el.shadowRoot!;
    const text = root.querySelector("[part=text]")!.getBoundingClientRect();
    const title = root.querySelector("[part=title]")!.getBoundingClientRect();
    return text.height - title.height;
  });
  expect(gap).toBe(0);
});

test("a long body scrolls inside the dialog and is reachable by keyboard", async ({
  page,
}) => {
  await gotoStory(page, story("open-long-content"));
  const body = dialogEl(page).locator("[part=body]");
  const { scroll, client } = await body.evaluate((el) => ({
    scroll: el.scrollHeight,
    client: el.clientHeight,
  }));
  expect(scroll).toBeGreaterThan(client);
  await expect(body).toHaveAttribute("tabindex", "0");
  await expect(page.getByRole("button", { name: "Accept" })).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Terms of use" }),
  ).toBeInViewport();
  await body.focus();
  await page.keyboard.press("End");
  // Keyboard scrolling is animated.
  await expect
    .poll(() => body.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
});

test("a short body is not a tab stop", async ({ page }) => {
  await gotoStory(page, story("open-alert"));
  await expect(dialogEl(page).locator("[part=body]")).not.toHaveAttribute(
    "tabindex",
  );
});

test("alert actions sit side by side for two and stack for three", async ({
  page,
}) => {
  // Measured after the open animation, not during it.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("open-alert"));
  const [cancel, save] = await Promise.all(
    ["Cancel", "Save"].map((name) =>
      page.getByRole("button", { name }).boundingBox(),
    ),
  );
  expect(cancel!.y).toBeCloseTo(save!.y, 0);
  expect(save!.x).toBeGreaterThan(cancel!.x);

  await gotoStory(page, story("open-stacked-alert"));
  const boxes = () =>
    Promise.all(
      ["Save", "Don’t Save"].map((name) =>
        page.getByRole("button", { name, exact: true }).boundingBox(),
      ),
    );
  await expect
    .poll(async () => {
      const [first, second] = await boxes();
      return Math.abs(second!.width - first!.width);
    })
    .toBeLessThan(0.5);
  const [first, second] = await boxes();
  expect(second!.y).toBeGreaterThan(first!.y);
});

test("under rtl the destructive action sits at the leading (right) edge", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const [del, save] = await Promise.all(
    ["Delete", "Save"].map((name) =>
      page.getByRole("button", { name }).boundingBox(),
    ),
  );
  expect(del!.x).toBeGreaterThan(save!.x);
});

test("the focus ring and the edge stay visible under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("open-alert"));
  await page.emulateMedia({ forcedColors: "active" });
  const style = await dialogEl(page).evaluate((el) => {
    const dialog = el.shadowRoot!.querySelector("dialog")!;
    return getComputedStyle(dialog).borderTopStyle;
  });
  expect(style).toBe("solid");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(
    await page
      .getByRole("button", { name: "Save" })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("open-sheet")));
});

test("virtual screen reader speaks the title, message and actions", async ({
  page,
}) => {
  await gotoStory(page, story("open-alert"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Save this message as a draft?");
  expect(spoken).toContain("button, Cancel");
  expect(spoken).toContain("button, Save");
});

test.describe("coarse pointer on a wide screen", () => {
  // The entry animation scales the dialog, so measure it at rest.
  test.use({
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
    reducedMotion: "reduce",
  });

  test("every action is at least 44 by 44", async ({ page }) => {
    await gotoStory(page, story("open-sheet"));
    for (const button of await page.getByRole("button").all()) {
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});
