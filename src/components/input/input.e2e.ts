import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";
import { expectWidthsIncrease } from "../../../e2e/helpers/widths.ts";

const story = (name: string) => `forms-input--${name}`;

test("host aria attributes reach the native input", async ({ page }) => {
  await gotoStory(page, story("host-aria"));
  const inner = page.locator("#input input");
  await expect(inner).toHaveAttribute("aria-required", "true");
  await expect(inner).toHaveAttribute("aria-invalid", "true");
  await expect(inner).toHaveAttribute(
    "aria-description",
    "We only use it to send the receipt. Enter an email address.",
  );
  await page.locator("#input").evaluate((el) => {
    el.removeAttribute("aria-invalid");
    el.removeAttribute("aria-required");
  });
  await expect(inner).not.toHaveAttribute("aria-invalid", "true");
  await expect(inner).not.toHaveAttribute("aria-required", "true");
  await expect(inner).toHaveAttribute(
    "aria-description",
    "We only use it to send the receipt.",
  );
  await page.locator("#hint").evaluate((el) => {
    el.textContent = "Receipts only.";
  });
  await expect(inner).toHaveAttribute("aria-description", "Receipts only.");
  await page.locator("#input").evaluate((el) => {
    el.removeAttribute("aria-describedby");
  });
  await expect(inner).not.toHaveAttribute("aria-description");
});

test("the forwarded description follows the referenced text and ID", async ({
  page,
}) => {
  await gotoStory(page, story("host-aria"));
  const inner = page.locator("#input input");
  await page.locator("#problem").evaluate((el) => {
    el.textContent = "Enter a valid address.";
  });
  await expect(inner).toHaveAttribute(
    "aria-description",
    "We only use it to send the receipt. Enter a valid address.",
  );
  await page.locator("#hint").evaluate((el) => {
    el.id = "old-hint";
  });
  await expect(inner).toHaveAttribute(
    "aria-description",
    "Enter a valid address.",
  );
});

test("a referenced element inserted after load is picked up", async ({
  page,
}) => {
  await gotoStory(page, story("host-aria"));
  const inner = page.locator("#input input");
  // Only the late reference describes the field: drop the story's error.
  await page.locator("#input").evaluate((el) => {
    el.removeAttribute("aria-invalid");
    el.removeAttribute("aria-errormessage");
    el.setAttribute("aria-describedby", "late");
  });
  await expect(inner).not.toHaveAttribute("aria-description");
  await page.locator("#input").evaluate((el) => {
    const late = document.createElement("p");
    late.id = "late";
    late.textContent = "Added later.";
    el.after(late);
  });
  await expect(inner).toHaveAttribute("aria-description", "Added later.");
});

test("Return in a form without a submit button presses the dialog's default action", async ({
  page,
}) => {
  await gotoStory(page, story("in-dialog"));
  const dialog = page.locator("#dialog");
  await dialog.evaluate((el) => {
    (window as unknown as { plClosed: unknown[] }).plClosed = [];
    el.addEventListener("pl-close", (event) =>
      (window as unknown as { plClosed: unknown[] }).plClosed.push(
        (event as CustomEvent).detail,
      ),
    );
  });
  await expect(page.getByRole("dialog", { name: "Rename" })).toBeVisible();
  const textbox = page.getByRole("textbox", { name: "Name" });
  await textbox.focus();
  await expect(textbox).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Rename" })).toBeHidden();
  expect(
    await page.evaluate(
      () => (window as unknown as { plClosed: unknown[] }).plClosed,
    ),
  ).toEqual([{ returnValue: "rename", reason: "user" }]);
});

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

const valid = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).checkValidity());

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("states"));
  await expect(root).toMatchAriaSnapshot(`
    - textbox "Empty"
    - textbox "Placeholder"
    - textbox "Value"
    - textbox "Disabled" [disabled]: Value
    - textbox "Read only": Value
    - textbox "Invalid" [invalid]: nope
  `);
});

test("widths story sizes the control", async ({ page }) => {
  await gotoStory(page, story("widths"));
  await expectWidthsIncrease(page, "pl-input");
});

test("sizes grow from sm, and a small search field keeps its clear button inside", async ({
  page,
}) => {
  await gotoStory(page, story("sizes"));
  const heights = await page
    .locator("pl-input")
    .evaluateAll((els) =>
      els.map(
        (el) =>
          el
            .shadowRoot!.querySelector('[part="field"]')!
            .getBoundingClientRect().height,
      ),
    );
  expect(heights).toHaveLength(4);
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(4);
  // Firefox lays out to a subpixel short of the token size.
  expect(heights[0]).toBeCloseTo(24, 1);
  const small = page.locator("pl-input").first();
  await small.evaluate((el) => el.setAttribute("type", "search"));
  const clear = small.locator('[part="clear"]');
  await expect(clear).toBeVisible();
  const box = (await clear.boundingBox())!;
  const shell = (await small.locator('[part="field"]').boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(shell.height + 0.5);
});

test("a slotted label names the input and a click on it focuses the field", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  const field = page.getByRole("textbox", { name: "Name" });
  await expect(field).toHaveValue("Ada");
  await page.locator("pl-input label").click();
  await expect(field).toBeFocused();
});

test("focusing the host or clicking the shell focuses the input", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const field = page.getByRole("textbox", { name: "Name" });
  await page.locator("pl-input").focus();
  await expect(field).toBeFocused();
  await field.blur();
  const box = (await page.locator("pl-input").boundingBox())!;
  await page.mouse.click(box.x + 2, box.y + box.height / 2);
  await expect(field).toBeFocused();
});

test("a value wider than the field ends in an ellipsis", async ({ page }) => {
  await gotoStory(page, story("default"));
  const host = page.locator("pl-input");
  await host.evaluate(
    (el) => ((el as HTMLElement & { value: string }).value = "x".repeat(200)),
  );
  const control = host.locator('[part="control"]');
  await expect(control).toHaveCSS("text-overflow", "ellipsis");
  expect(await control.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
});

test("typing edits the value and fires pl-input and pl-change", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("pl-input").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["pl-input", "pl-change"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: string }>).detail.value}`,
        ),
      );
  });
  await page.getByRole("textbox", { name: "Name" }).pressSequentially("ab");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(["pl-input:a", "pl-input:ab", "pl-change:ab"]);
});

test("the focus ring is drawn on the shell", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  // The ring fades in, so the colour is transparent until the transition runs.
  await expect
    .poll(() =>
      page
        .locator("pl-input")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
              .outlineColor,
        ),
    )
    .not.toBe("rgba(0, 0, 0, 0)");
});

test("a search field shows its clear button only while it has text", async ({
  page,
}) => {
  await gotoStory(page, story("search"));
  const fields = page.locator("pl-input");
  const clear = (i: number) => fields.nth(i).getByRole("button");
  await expect(clear(0)).toHaveCount(0);
  await expect(clear(1)).toHaveCount(1);
  await expect(clear(2)).toHaveCount(0);
  await fields.nth(0).getByRole("searchbox").fill("x");
  await expect(clear(0)).toHaveCount(1);
});

test("Clear empties a search field, keeps focus in it and fires the events", async ({
  page,
}) => {
  await gotoStory(page, story("search"));
  const host = page.locator("pl-input").nth(1);
  await host.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["pl-input", "pl-change"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: string }>).detail.value}`,
        ),
      );
  });
  await host.getByRole("button", { name: "Clear" }).click();
  const field = host.getByRole("searchbox");
  await expect(field).toHaveValue("");
  await expect(field).toBeFocused();
  await expect(host.getByRole("button")).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(["pl-input:", "pl-change:"]);
});

test("clear-label names the clear button", async ({ page }) => {
  await gotoStory(page, story("search"));
  const host = page.locator("pl-input").nth(1);
  await host.evaluate((el) => el.setAttribute("clear-label", "Effacer"));
  await expect(host.getByRole("button", { name: "Effacer" })).toBeVisible();
});

test("Escape clears a search field", async ({ page }) => {
  await gotoStory(page, story("search"));
  const field = page.locator("pl-input").nth(1).getByRole("searchbox");
  await field.focus();
  await page.keyboard.press("Escape");
  await expect(field).toHaveValue("");
});

test("a password field masks its value in the system font", async ({
  page,
}) => {
  await gotoStory(page, story("password"));
  const field = page.locator("pl-input").nth(1);
  expect(
    await field.evaluate((el) => {
      const input = el.shadowRoot!.querySelector("input")!;
      return [input.type, getComputedStyle(input).fontFamily];
    }),
  ).toEqual(["password", "system-ui, sans-serif"]);
});

test("a disabled field takes no focus", async ({ page }) => {
  await gotoStory(page, story("states"));
  const field = page.getByRole("textbox", { name: "Disabled" });
  await expect(field).toBeDisabled();
  await page.locator("pl-input").nth(3).click({ force: true });
  await expect(field).not.toBeFocused();
});

test("a read-only field keeps its value", async ({ page }) => {
  await gotoStory(page, story("states"));
  const field = page.getByRole("textbox", { name: "Read only" });
  await field.focus();
  await page.keyboard.type("x");
  await expect(field).toHaveValue("Value");
});

test("the invalid style and aria-invalid appear only after interaction", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const email = page.getByRole("textbox", { name: "Email" });
  const host = page.locator("#email");
  const invalidState = () =>
    host.evaluate((el) => el.matches(":state(user-invalid)"));
  expect(await invalidState()).toBe(false);
  await expect(email).not.toHaveAttribute("aria-invalid");
  await email.focus();
  await page.keyboard.press("Tab");
  expect(await invalidState()).toBe(true);
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await email.fill("a@example.com");
  expect(await invalidState()).toBe(false);
});

test("an invalid field shows its message after a blur and describes the control with it", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const email = page.getByRole("textbox", { name: "Email" });
  const host = page.locator("#email");
  const message = host.locator('[part="message"]');
  await expect(message).toBeHidden();
  await expect(email).not.toHaveAttribute("aria-describedby");
  await email.focus();
  await page.keyboard.press("Tab");
  const text = await host.evaluate(
    (el) => (el as HTMLInputElement).validationMessage,
  );
  expect(text).not.toBe("");
  await expect(message).toBeVisible();
  await expect(message).toHaveText(text);
  await expect(email).toHaveAccessibleDescription(text);
  await email.fill("a@example.com");
  await expect(message).toBeHidden();
  await expect(email).not.toHaveAttribute("aria-describedby");
  await expect(email).toHaveAccessibleDescription("");
});

test("validation message spans the field width", async ({ page }) => {
  await gotoStory(page, story("states"));
  const host = page.locator("#invalid");
  await expect(host.locator('[part="message"]')).toBeVisible();
  const [message, field] = await Promise.all([
    host.locator('[part="message"]').boundingBox(),
    host.locator('[part="field"]').boundingBox(),
  ]);
  expect(Math.abs(message!.width - field!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(message!.x - field!.x)).toBeLessThanOrEqual(1);
});

test("the form gets the value, and a reset returns the value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.getByRole("textbox", { name: "Email" }).fill("a@example.com");
  await page.getByRole("searchbox", { name: "Find" }).fill("cats");
  await page.getByRole("textbox", { name: "Name" }).fill("Grace");
  expect(await submitted(page)).toEqual([
    ["name", "Grace"],
    ["email", "a@example.com"],
    ["q", "cats"],
  ]);
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue("Ada");
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("");
  await expect(page.getByRole("searchbox", { name: "Find" })).toHaveValue("");
});

test("required, type=email and pattern make the form invalid", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const email = page.getByRole("textbox", { name: "Email" });
  expect(await valid(page)).toBe(false);
  await email.fill("nope");
  expect(await valid(page)).toBe(false);
  await email.fill("a@example.com");
  expect(await valid(page)).toBe(true);
  await page
    .locator("#name")
    .evaluate((el) => el.setAttribute("pattern", "[0-9]+"));
  expect(await valid(page)).toBe(false);
});

test("a disabled fieldset disables the fields and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(page.getByRole("textbox", { name: "Name" })).toBeDisabled();
  expect(await submitted(page)).toEqual([]);
});

/** Adds a default button to the form and records each submit's submitter. */
const trackSubmits = (page: Page, button: string) =>
  page.locator("#form").evaluate((form, markup) => {
    form.insertAdjacentHTML("beforeend", markup);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute(
        "data-submitted",
        (event as SubmitEvent).submitter?.getAttribute("name") ?? "none",
      );
    });
  }, button);

test("Enter presses the form's default button, like a native input", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await trackSubmits(
    page,
    '<button type="submit" name="intent" value="save">Save</button>',
  );
  await page.getByRole("textbox", { name: "Email" }).fill("a@example.com");
  await page.keyboard.press("Enter");
  await expect(page.locator("#form")).toHaveAttribute(
    "data-submitted",
    "intent",
  );
});

test("Enter does not submit through a disabled default button", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await trackSubmits(
    page,
    '<button type="submit" name="intent" disabled></button>',
  );
  await page.getByRole("textbox", { name: "Email" }).fill("a@example.com");
  await page.keyboard.press("Enter");
  await expect(page.locator("#form")).not.toHaveAttribute("data-submitted");
});

test("Enter in a form with several fields and no button does not submit", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await trackSubmits(page, "");
  await page.getByRole("textbox", { name: "Email" }).fill("a@example.com");
  await page.keyboard.press("Enter");
  await expect(page.locator("#form")).not.toHaveAttribute("data-submitted");
});

test("Enter in a form with one field and no button submits it", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#form")
    .evaluate((form) =>
      form.querySelectorAll("#name, #find").forEach((el) => el.remove()),
    );
  await trackSubmits(page, "");
  await page.getByRole("textbox", { name: "Email" }).fill("a@example.com");
  await page.keyboard.press("Enter");
  await expect(page.locator("#form")).toHaveAttribute("data-submitted", "none");
});

test("a read-only search field offers no Clear and Escape keeps its value", async ({
  page,
}) => {
  const root = await gotoStory(page, story("search"));
  await root.evaluate((el) => {
    const host = document.createElement("pl-input");
    host.id = "ro";
    host.setAttribute("type", "search");
    host.setAttribute("label", "Frozen");
    host.setAttribute("value", "cats");
    host.setAttribute("readonly", "");
    el.append(host);
    (window as unknown as { fired: number }).fired = 0;
    for (const name of ["pl-input", "pl-change"])
      host.addEventListener(name, () => {
        (window as unknown as { fired: number }).fired++;
      });
  });
  const host = page.locator("#ro");
  await expect(host.getByRole("button")).toHaveCount(0);
  await host.getByRole("searchbox").focus();
  await page.keyboard.press("Escape");
  await expect(host.getByRole("searchbox")).toHaveValue("cats");
  expect(
    await page.evaluate(() => (window as unknown as { fired: number }).fired),
  ).toBe(0);
});

test("a number field takes step, min and max like a native input", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      '<form id="f"><pl-input id="n" type="number" label="Qty" min="1" max="5" step="any"></pl-input></form>',
    );
  });
  const field = page.locator("#n").getByRole("spinbutton");
  const ok = () =>
    page
      .locator("#f")
      .evaluate((form) => (form as HTMLFormElement).checkValidity());
  await field.fill("1.5");
  expect(await ok()).toBe(true);
  await field.fill("0.5");
  expect(await ok()).toBe(false);
  await field.fill("6");
  expect(await ok()).toBe(false);
  await page.locator("#n").evaluate((el) => el.setAttribute("step", "1"));
  await field.fill("2.5");
  expect(await ok()).toBe(false);
});

test("a reset clears the invalid state of a field whose value did not change", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const email = page.getByRole("textbox", { name: "Email" });
  const host = page.locator("#email");
  await email.focus();
  await page.keyboard.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(email).not.toHaveAttribute("aria-invalid");
  expect(await host.evaluate((el) => el.matches(":state(user-invalid)"))).toBe(
    false,
  );
});

test("a blocked submit marks an untouched invalid field", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const email = page.getByRole("textbox", { name: "Email" });
  await expect(email).not.toHaveAttribute("aria-invalid");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(email).toHaveAttribute("aria-invalid", "true");
  expect(
    await page
      .locator("#email")
      .evaluate((el) => el.matches(":state(user-invalid)")),
  ).toBe(true);
});

test("the host exposes the validity API", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const result = await page.locator("#email").evaluate((el) => {
    const field = el as HTMLElement & {
      checkValidity(): boolean;
      setCustomValidity(message: string): void;
      validity: ValidityState;
      validationMessage: string;
      form: HTMLFormElement;
    };
    const missing = field.validity.valueMissing;
    (el as unknown as { value: string }).value = "a@example.com";
    return new Promise((resolve) =>
      requestAnimationFrame(() => {
        const before = field.checkValidity();
        field.setCustomValidity("Taken");
        resolve([
          missing,
          before,
          field.checkValidity(),
          field.validity.customError,
          field.validationMessage,
          field.form.id,
        ]);
      }),
    );
  });
  expect(result).toEqual([true, true, false, true, "Taken", "form"]);
});

test("a label whose text arrives later replaces the aria-label", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      '<pl-input id="late" label="Fallback"><span id="t"> </span></pl-input>',
    );
  });
  const input = page.locator("#late").locator("input");
  await expect(input).toHaveAttribute("aria-label", "Fallback");
  await page.locator("#t").evaluate((el) => (el.textContent = "Email"));
  await expect(input).not.toHaveAttribute("aria-label");
});

test("a disabled search field keeps its end inset", async ({ page }) => {
  const root = await gotoStory(page, story("search"));
  await root.evaluate((el) => {
    el.insertAdjacentHTML(
      "beforeend",
      '<pl-input id="d" type="search" label="D" value="a long value" disabled></pl-input><pl-input id="c" type="search" label="C" value="x"></pl-input>',
    );
  });
  const padEnd = (id: string) =>
    page
      .locator(id)
      .evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
            .paddingInlineEnd,
      );
  expect(await padEnd("#d")).not.toBe("0px");
  await expect.poll(() => padEnd("#c")).toBe("0px");
});

test("a custom validity set before the first render is kept", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const result = await root.evaluate(async (el) => {
    const field = document.createElement("pl-input") as HTMLElement & {
      setCustomValidity(message: string): void;
      validity: ValidityState;
      validationMessage: string;
      updateComplete: Promise<boolean>;
    };
    field.setAttribute("label", "Name");
    field.setCustomValidity("Taken");
    el.append(field);
    await field.updateComplete;
    return [field.validity.customError, field.validationMessage];
  });
  expect(result).toEqual([true, "Taken"]);
});

test("an external label names the field, even one added later", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      '<label for="ext">City <img alt="(required)"><span aria-hidden="true">*</span></label><pl-input id="ext"></pl-input><pl-input id="late"></pl-input>' +
        '<label for="own">Ignored</label><pl-input id="own" label="Postcode"></pl-input>',
    ),
  );
  await expect(
    page.getByRole("textbox", { name: "City (required)", exact: true }),
  ).toBeVisible();
  // The field's own label wins over an external one.
  await expect(page.locator("#own").getByRole("textbox")).toHaveAccessibleName(
    "Postcode",
  );
  await root.evaluate((el) =>
    el.insertAdjacentHTML("beforeend", '<label for="late">Country</label>'),
  );
  await page.locator("#late").evaluate((el) => (el as HTMLElement).focus());
  await expect(page.getByRole("textbox", { name: "Country" })).toBeFocused();
  await expectAccessible(root);
});

test("a search field mirrors under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const sides = await page
    .locator("pl-input")
    .nth(1)
    .evaluate((el) => {
      const part = (name: string) =>
        el.shadowRoot!.querySelector(name)!.getBoundingClientRect();
      const [field, glyph, clear] = [
        part('[part="field"]'),
        part('[part="glyph"]'),
        part('[part="clear"]'),
      ];
      return {
        glyphRight: field.right - glyph.right,
        glyphLeft: glyph.left - field.left,
        clearLeft: clear.left - field.left,
        clearRight: field.right - clear.right,
      };
    });
  expect(sides.glyphRight).toBeLessThan(sides.glyphLeft);
  expect(sides.clearLeft).toBeLessThan(sides.clearRight);
});

test("the field keeps a border under forced colors and a ring on focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const style = await page.locator("pl-input").evaluate((el) => {
    const css = getComputedStyle(
      el.shadowRoot!.querySelector('[part="field"]')!,
    );
    return [css.borderStyle, css.outlineStyle];
  });
  expect(style).toEqual(["solid", "solid"]);
});

test("an input without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("pl-input");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare").getByRole("textbox")).toBeVisible();
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("search")));
});

// The virtual screen reader does not enter shadow roots, so it can only reach
// the slotted label; the inner input's role and name are in the aria snapshot.
test("virtual screen reader speaks the slotted label", async ({ page }) => {
  await gotoStory(page, story("labelled"));
  expect((await spokenPhrases(page)).join(" | ")).toContain("Name");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every field and clear button keeps a 44 by 44 hit area", async ({
    page,
  }) => {
    await gotoStory(page, story("search"));
    for (const control of await page.locator("pl-input").all()) {
      const box = (await control.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const clear = (await page
      .locator("pl-input")
      .nth(1)
      .getByRole("button")
      .boundingBox())!;
    expect(clear.width).toBeGreaterThanOrEqual(44);
    expect(clear.height).toBeGreaterThanOrEqual(44);
  });
});
