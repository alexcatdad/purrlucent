import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-input--${name}`;

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

test("a slotted label names the input and a click on it focuses the field", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  const field = page.getByRole("textbox", { name: "Name" });
  await expect(field).toHaveValue("Ada");
  await page.locator("purr-input label").click();
  await expect(field).toBeFocused();
});

test("focusing the host or clicking the shell focuses the input", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const field = page.getByRole("textbox", { name: "Name" });
  await page.locator("purr-input").focus();
  await expect(field).toBeFocused();
  await field.blur();
  const box = (await page.locator("purr-input").boundingBox())!;
  await page.mouse.click(box.x + 2, box.y + box.height / 2);
  await expect(field).toBeFocused();
});

test("a value wider than the field ends in an ellipsis", async ({ page }) => {
  await gotoStory(page, story("default"));
  const host = page.locator("purr-input");
  await host.evaluate(
    (el) => ((el as HTMLElement & { value: string }).value = "x".repeat(200)),
  );
  const control = host.locator('[part="control"]');
  await expect(control).toHaveCSS("text-overflow", "ellipsis");
  expect(await control.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
});

test("typing edits the value and fires purr-input and purr-change", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("purr-input").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["purr-input", "purr-change"])
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
  ).toEqual(["purr-input:a", "purr-input:ab", "purr-change:ab"]);
});

test("the focus ring is drawn on the shell", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  // The ring fades in, so the colour is transparent until the transition runs.
  await expect
    .poll(() =>
      page
        .locator("purr-input")
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
  const fields = page.locator("purr-input");
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
  const host = page.locator("purr-input").nth(1);
  await host.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["purr-input", "purr-change"])
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
  ).toEqual(["purr-input:", "purr-change:"]);
});

test("clear-label names the clear button", async ({ page }) => {
  await gotoStory(page, story("search"));
  const host = page.locator("purr-input").nth(1);
  await host.evaluate((el) => el.setAttribute("clear-label", "Effacer"));
  await expect(host.getByRole("button", { name: "Effacer" })).toBeVisible();
});

test("Escape clears a search field", async ({ page }) => {
  await gotoStory(page, story("search"));
  const field = page.locator("purr-input").nth(1).getByRole("searchbox");
  await field.focus();
  await page.keyboard.press("Escape");
  await expect(field).toHaveValue("");
});

test("a password field masks its value in the system font", async ({
  page,
}) => {
  await gotoStory(page, story("password"));
  const field = page.locator("purr-input").nth(1);
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
  await page.locator("purr-input").nth(3).click({ force: true });
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
    const host = document.createElement("purr-input");
    host.id = "ro";
    host.setAttribute("type", "search");
    host.setAttribute("label", "Frozen");
    host.setAttribute("value", "cats");
    host.setAttribute("readonly", "");
    el.append(host);
    (window as unknown as { fired: number }).fired = 0;
    for (const name of ["purr-input", "purr-change"])
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
      '<form id="f"><purr-input id="n" type="number" label="Qty" min="1" max="5" step="any"></purr-input></form>',
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
      '<purr-input id="late" label="Fallback"><span id="t"> </span></purr-input>',
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
      '<purr-input id="d" type="search" label="D" value="a long value" disabled></purr-input><purr-input id="c" type="search" label="C" value="x"></purr-input>',
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
    const field = document.createElement("purr-input") as HTMLElement & {
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
      '<label for="ext">City <img alt="(required)"><span aria-hidden="true">*</span></label><purr-input id="ext"></purr-input><purr-input id="late"></purr-input>' +
        '<label for="own">Ignored</label><purr-input id="own" label="Postcode"></purr-input>',
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
    .locator("purr-input")
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
  const style = await page.locator("purr-input").evaluate((el) => {
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
    const bare = document.createElement("purr-input");
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
    for (const control of await page.locator("purr-input").all()) {
      const box = (await control.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    const clear = (await page
      .locator("purr-input")
      .nth(1)
      .getByRole("button")
      .boundingBox())!;
    expect(clear.width).toBeGreaterThanOrEqual(44);
    expect(clear.height).toBeGreaterThanOrEqual(44);
  });
});
