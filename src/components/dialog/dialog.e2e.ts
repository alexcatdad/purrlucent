import { expect, test, type Page } from "@playwright/test";
import {
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `dialogs-dialog--${name}`;

const alert = (page: Page) => page.getByRole("alertdialog");
const sheet = (page: Page) => page.getByRole("dialog");
const dialogEl = (page: Page) => page.locator("pl-dialog");
const isOpen = (page: Page) =>
  dialogEl(page).evaluate((el) => (el as HTMLElement & { open: boolean }).open);
const activeInside = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest("pl-dialog"));

/** Records what the dialog fires, as [event, detail] pairs, on window.log. */
const record = (page: Page) =>
  dialogEl(page).evaluate((el) => {
    const log: unknown[][] = [];
    (window as unknown as { log: unknown[][] }).log = log;
    for (const name of ["pl-cancel", "pl-close"])
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
    .toEqual([["pl-close", { returnValue: "save", reason: "user" }]]);
});

test("Escape activates the cancel action", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await record(page);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["pl-close", { returnValue: "cancel", reason: "user" }]]);
});

test("Command-Period activates the cancel action", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await record(page);
  await page.keyboard.press("Meta+.");
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["pl-close", { returnValue: "cancel", reason: "user" }]]);
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

test("an alert with more than three actions warns", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await gotoStory(page, story("default"));
  const showWith = (variant: string, count: number) =>
    dialogEl(page).evaluate(
      async (el, [kind, total]) => {
        const dialog = el as never as { show(): void; close(): void };
        dialog.close();
        el.setAttribute("variant", kind as string);
        el.querySelectorAll("[slot=actions]").forEach((a) => a.remove());
        for (let i = 0; i < (total as number); i++) {
          const button = document.createElement("pl-button");
          button.slot = "actions";
          button.textContent = `Action ${i}`;
          el.append(button);
        }
        dialog.show();
        await (el as never as { updateComplete: Promise<unknown> })
          .updateComplete;
      },
      [variant, count],
    );
  const alertWarnings = () =>
    warnings.filter((text) => text.includes("at most three buttons"));
  await showWith("alert", 3);
  await expect(alert(page)).toBeVisible();
  expect(alertWarnings()).toHaveLength(0);
  await showWith("sheet", 4);
  await expect(sheet(page)).toBeVisible();
  expect(alertWarnings()).toHaveLength(0);
  await showWith("alert", 4);
  await expect(alert(page)).toBeVisible();
  await expect(page.locator("pl-dialog pl-button")).toHaveCount(4);
  await expect
    .poll(alertWarnings)
    .toEqual(["pl-dialog: an alert takes at most three buttons."]);
});

test("--pl-dialog-width sets a sheet's width", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  const width = () =>
    dialogEl(page)
      .locator("dialog")
      .evaluate((el) => el.getBoundingClientRect().width);
  const initial = await width();
  await dialogEl(page).evaluate((el) =>
    el.setAttribute("style", "--pl-dialog-width: 500px"),
  );
  await expect.poll(width).toBe(500);
  expect(initial).not.toBe(500);
});

test("a sheet opened over another sheet warns; an alert over a sheet does not", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  const stacked = () =>
    warnings.filter((text) => text.includes("show one sheet at a time"));
  await gotoStory(page, story("open-sheet"));
  await expect(sheet(page)).toBeVisible();
  const showOver = (variant: string) =>
    page.evaluate(async (kind) => {
      const el = document.createElement("pl-dialog") as HTMLElement & {
        show(): void;
        updateComplete: Promise<unknown>;
      };
      el.setAttribute("variant", kind);
      el.id = `over-${kind}`;
      document.body.append(el);
      el.show();
      await el.updateComplete;
    }, variant);
  await showOver("alert");
  await expect(page.locator("#over-alert")).toHaveJSProperty("open", true);
  expect(stacked()).toHaveLength(0);
  await page.locator("#over-alert").evaluate((el) => el.remove());
  await showOver("sheet");
  await expect
    .poll(stacked)
    .toEqual([
      "pl-dialog: show one sheet at a time; close the open sheet first.",
    ]);
});

test("closing a sheet and showing another in one tick does not warn", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await gotoStory(page, story("open-sheet"));
  await expect(sheet(page)).toBeVisible();
  await page.evaluate(async () => {
    const a = document.querySelector("pl-dialog") as HTMLElement & {
      close(): void;
    };
    const b = document.createElement("pl-dialog") as HTMLElement & {
      show(): void;
      updateComplete: Promise<unknown>;
    };
    b.setAttribute("variant", "sheet");
    b.id = "next-sheet";
    document.body.append(b);
    a.close();
    b.show();
    await b.updateComplete;
  });
  await expect(page.locator("#next-sheet")).toHaveJSProperty("open", true);
  await page.waitForTimeout(100);
  expect(
    warnings.filter((text) => text.includes("show one sheet at a time")),
  ).toHaveLength(0);
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
      ["pl-cancel", null],
      ["pl-close", { returnValue: "", reason: "user" }],
    ]);
  await expect(page.locator("#trigger")).toBeFocused();
});

test("a cancel handler can keep the dialog open", async ({ page }) => {
  await openDefault(page);
  await withoutRole(page, "cancel");
  await dialogEl(page).evaluate((el) =>
    el.addEventListener("pl-cancel", (event) => event.preventDefault(), {
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
      ["pl-close", { returnValue: "", reason: "user" }],
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
    .toEqual([["pl-close", { returnValue: "save", reason: "user" }]]);
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
    .toEqual(["pl-close", { returnValue: "cancel", reason: "user" }]);
  await page.locator("#trigger").click();
  await withoutRole(page, "cancel");
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(async () => (await recorded(page)).at(-1))
    .toEqual(["pl-close", { returnValue: "", reason: "user" }]);
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
      ["pl-close", { returnValue: "done", reason: "programmatic" }],
      ["pl-close", { returnValue: "", reason: "programmatic" }],
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

test("the scroll lock keeps the page's width, and closing restores its styles", async ({
  page,
}) => {
  await gotoStory(page, story("open-alert"));
  const widths = await dialogEl(page).evaluate(async (el) => {
    const dialog = el as HTMLElement & { show(): void; close(): void };
    const root = document.documentElement;
    const frame = () => new Promise(requestAnimationFrame);
    dialog.close();
    await frame();
    // A page tall enough to scroll, so a classic scrollbar shows where there is one.
    const tall = document.createElement("div");
    tall.style.blockSize = "300vh";
    document.body.append(tall);
    await frame();
    const before = root.clientWidth;
    dialog.show();
    await frame();
    const open = root.clientWidth;
    dialog.close();
    await frame();
    return {
      before,
      open,
      overflow: root.style.overflow,
      gutter: root.style.scrollbarGutter,
    };
  });
  expect(widths.open).toBe(widths.before);
  expect(widths.overflow).toBe("");
  expect(widths.gutter).toBe("");
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
  const gap = await dialogEl(page).evaluate(async (el) => {
    el.querySelector("[slot=description]")!.remove();
    // slotchange, which hides the empty wrapper, is dispatched after this task.
    await new Promise(requestAnimationFrame);
    const root = el.shadowRoot!;
    const text = root.querySelector("[part=text]")!.getBoundingClientRect();
    const title = root.querySelector("[part=title]")!.getBoundingClientRect();
    return text.height - title.height;
  });
  expect(gap).toBe(0);
});

test("the description keeps its gap under the title when the page resets margins", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  const gap = await dialogEl(page).evaluate(async (el) => {
    const reset = document.createElement("style");
    reset.textContent = "* { margin: 0; padding: 0; }";
    document.head.append(reset);
    await new Promise(requestAnimationFrame);
    const root = el.shadowRoot!;
    const title = root.querySelector("[part=title]")!.getBoundingClientRect();
    const description = el
      .querySelector("[slot=description]")!
      .getBoundingClientRect();
    return description.top - title.bottom;
  });
  expect(gap).toBeGreaterThan(0);
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

const closeButton = (page: Page) => dialogEl(page).locator("[part=close]");

test("the close button clicks the cancel action, like Escape", async ({
  page,
}) => {
  await gotoStory(page, story("open-closable-with-cancel"));
  await record(page);
  await closeButton(page).click();
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([["pl-close", { returnValue: "cancel", reason: "user" }]]);
});

test("a closable sheet has a close button named Close that asks to cancel and closes", async ({
  page,
}) => {
  await gotoStory(page, story("open-closable"));
  await record(page);
  await expect(closeButton(page)).toHaveAccessibleName("Close");
  await closeButton(page).click();
  await expect(sheet(page)).toBeHidden();
  await expect
    .poll(() => recorded(page))
    .toEqual([
      ["pl-cancel", null],
      ["pl-close", { returnValue: "", reason: "user" }],
    ]);
});

test("a pl-cancel handler can keep a closable sheet open, and close-label names the button", async ({
  page,
}) => {
  await gotoStory(page, story("open-closable"));
  await dialogEl(page).evaluate((el) => {
    el.setAttribute("close-label", "Dismiss shortcuts");
    el.addEventListener("pl-cancel", (event) => event.preventDefault(), {
      once: true,
    });
  });
  await expect(closeButton(page)).toHaveAccessibleName("Dismiss shortcuts");
  await closeButton(page).click();
  await expect(sheet(page)).toBeVisible();
  expect(await isOpen(page)).toBe(true);
  await closeButton(page).click();
  await expect(sheet(page)).toBeHidden();
});

test("a sheet without closable has no close button", async ({ page }) => {
  await gotoStory(page, story("open-sheet"));
  await expect(closeButton(page)).toHaveCount(0);
});

test("actions-start content sits at the start of the actions row", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("open-actions-start"));
  const status = page.getByText("3 of 12 reviewed");
  await expect(status).toBeVisible();
  const [statusBox, cancel, save] = await Promise.all([
    status.boundingBox(),
    page.getByRole("button", { name: "Cancel" }).boundingBox(),
    page.getByRole("button", { name: "Save" }).boundingBox(),
  ]);
  expect(statusBox!.x).toBeLessThan(cancel!.x);
  expect(cancel!.x).toBeLessThan(save!.x);
  expect(statusBox!.y).toBeLessThan(save!.y + save!.height);
});

test("pl-close reports reason user for the keyboard and programmatic for close()", async ({
  page,
}) => {
  await openDefault(page);
  await page.keyboard.press("Escape");
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(async () => (await recorded(page)).at(-1))
    .toEqual(["pl-close", { returnValue: "cancel", reason: "user" }]);
  await dialogEl(page).evaluate((el) =>
    (el as HTMLElement & { show(): void }).show(),
  );
  await expect(alert(page)).toBeVisible();
  await dialogEl(page).evaluate((el) =>
    (el as HTMLElement & { close(): void }).close(),
  );
  await expect(alert(page)).toBeHidden();
  await expect
    .poll(async () => (await recorded(page)).at(-1))
    .toEqual(["pl-close", { returnValue: "", reason: "programmatic" }]);
});

test("setting open back to true before a close completes keeps the dialog open and reports no close", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page);
  await dialogEl(page).evaluate(async (el) => {
    const dialog = el as HTMLElement & {
      show(): void;
      close(): void;
      updateComplete: Promise<unknown>;
    };
    dialog.show();
    await dialog.updateComplete;
    dialog.close();
    dialog.show();
    await dialog.updateComplete;
  });
  await expect(alert(page)).toBeVisible();
  // The queued native close event has run by now.
  await page.waitForTimeout(100);
  expect(await isOpen(page)).toBe(true);
  expect(await recorded(page)).toEqual([]);
});

test("the description attribute describes a sheet that has no description slot", async ({
  page,
}) => {
  await gotoStory(page, story("open-described-by-attribute"));
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page)).toHaveAccessibleDescription(
    "Changes apply to every project you own.",
  );
});

test("a slotted description wins over the description attribute", async ({
  page,
}) => {
  await gotoStory(page, story("open-sheet"));
  await dialogEl(page).evaluate((el) =>
    el.setAttribute("description", "Attribute text."),
  );
  await expect(sheet(page)).toHaveAccessibleDescription(
    /^You can choose to save your changes/,
  );
});

test.describe("nonmodal", () => {
  test("opens without blocking the page, the scrim or the scroll lock", async ({
    page,
  }) => {
    await gotoStory(page, story("open-nonmodal"));
    await expect(sheet(page)).toBeVisible();
    expect(
      await dialogEl(page)
        .locator("dialog")
        .evaluate((el) => el.matches(":modal")),
    ).toBe(false);
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");
    await page.evaluate(() => {
      const button = document.querySelector("#page-button")!;
      (window as unknown as { clicks: number }).clicks = 0;
      button.addEventListener(
        "click",
        () => (window as unknown as { clicks: number }).clicks++,
      );
    });
    await page.locator("#page-button").click();
    expect(
      await page.evaluate(
        () => (window as unknown as { clicks: number }).clicks,
      ),
    ).toBe(1);
    await expect(sheet(page)).toBeVisible();
  });

  test("stays above page content with a higher z-index", async ({ page }) => {
    await gotoStory(page, story("open-nonmodal"));
    await expect(sheet(page)).toBeVisible();
    const topmost = await dialogEl(page).evaluate((el) => {
      const box = el
        .shadowRoot!.querySelector("dialog")!
        .getBoundingClientRect();
      return (
        document.elementFromPoint(
          box.x + box.width / 2,
          box.y + box.height / 2,
        ) === el
      );
    });
    expect(topmost).toBe(true);
  });

  test("Escape and the close button close it", async ({ page }) => {
    await gotoStory(page, story("open-nonmodal"));
    await record(page);
    await expect.poll(() => activeInside(page)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
    await expect
      .poll(() => recorded(page))
      .toEqual([
        ["pl-cancel", null],
        ["pl-close", { returnValue: "", reason: "user" }],
      ]);
    await page.locator("#trigger").click();
    await expect(sheet(page)).toBeVisible();
    await closeButton(page).click();
    await expect(sheet(page)).toBeHidden();
    await expect.poll(async () => (await recorded(page)).length).toBe(4);
  });

  test("Escape can be cancelled", async ({ page }) => {
    await gotoStory(page, story("open-nonmodal"));
    await expect.poll(() => activeInside(page)).toBe(true);
    await dialogEl(page).evaluate((el) =>
      el.addEventListener("pl-cancel", (event) => event.preventDefault(), {
        once: true,
      }),
    );
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
  });
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
