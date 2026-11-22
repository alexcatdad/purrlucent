import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-text-area--${name}`;

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
    - textbox "Placeholder"
    - textbox "Filled": /Value on the first line\\s+and a second line/
    - textbox "Disabled" [disabled]: Value
    - textbox "Read only": Value
    - textbox "Invalid"
  `);
});

test("a slotted label names the textarea and a click on it focuses the field", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  const field = page.getByRole("textbox", { name: "Message" });
  await expect(field).toHaveValue("Hello");
  await page.locator("purr-textarea label").click();
  await expect(field).toBeFocused();
});

test("focusing the host focuses the textarea", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("purr-textarea").focus();
  await expect(page.getByRole("textbox", { name: "Message" })).toBeFocused();
});

test("typing edits the value, Enter adds a line, and the events fire", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("purr-textarea").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["purr-input", "purr-change"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${JSON.stringify((event as CustomEvent<{ value: string }>).detail.value)}`,
        ),
      );
  });
  const field = page.getByRole("textbox", { name: "Message" });
  await field.pressSequentially("a");
  await page.keyboard.press("Enter");
  await expect(field).toHaveValue("a\n");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(['purr-input:"a"', 'purr-input:"a\\n"', 'purr-change:"a\\n"']);
});

test("the focus ring is drawn on the shell", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page
        .locator("purr-textarea")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
              .outlineColor,
        ),
    )
    .not.toBe("rgba(0, 0, 0, 0)");
});

test("resize is vertical by default and none on request", async ({ page }) => {
  await gotoStory(page, story("resize"));
  const resize = (i: number) =>
    page
      .locator("purr-textarea")
      .nth(i)
      .evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector("textarea")!).resize,
      );
  expect(await resize(0)).toBe("vertical");
  expect(await resize(1)).toBe("none");
});

test("rows sets the height in lines", async ({ page }) => {
  await gotoStory(page, story("resize"));
  const height = (i: number) =>
    page
      .locator("purr-textarea")
      .nth(i)
      .evaluate(
        (el) =>
          el.shadowRoot!.querySelector("textarea")!.getBoundingClientRect()
            .height,
      );
  expect(await height(2)).toBeGreaterThan(0);
  expect(await height(2)).toBeLessThan(await height(0));
});

test("a disabled field takes no focus and a read-only one keeps its value", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const disabled = page.getByRole("textbox", { name: "Disabled" });
  await expect(disabled).toBeDisabled();
  await page.locator("purr-textarea").nth(2).click({ force: true });
  await expect(disabled).not.toBeFocused();
  const readonly = page.getByRole("textbox", { name: "Read only" });
  await readonly.focus();
  await page.keyboard.type("x");
  await expect(readonly).toHaveValue("Value");
});

test("the invalid style and aria-invalid appear only after interaction", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const body = page.getByRole("textbox", { name: "Body" });
  const host = page.locator("#body");
  const invalidState = () =>
    host.evaluate((el) => el.matches(":state(user-invalid)"));
  expect(await invalidState()).toBe(false);
  await expect(body).not.toHaveAttribute("aria-invalid");
  await body.focus();
  await page.keyboard.press("Tab");
  expect(await invalidState()).toBe(true);
  await expect(body).toHaveAttribute("aria-invalid", "true");
  await body.fill("abc");
  expect(await invalidState()).toBe(false);
});

test("the form gets the value, and a reset returns the value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.getByRole("textbox", { name: "Body" }).fill("line one\nline two");
  await page.getByRole("textbox", { name: "Note" }).fill("Bye");
  expect(await submitted(page)).toEqual([
    ["note", "Bye"],
    ["body", "line one\nline two"],
  ]);
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(page.getByRole("textbox", { name: "Note" })).toHaveValue("Hi");
  await expect(page.getByRole("textbox", { name: "Body" })).toHaveValue("");
});

test("required makes the form invalid and minlength reaches the control", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const body = page.getByRole("textbox", { name: "Body" });
  expect(await valid(page)).toBe(false);
  await expect(body).toHaveAttribute("minlength", "3");
  await body.fill("abc");
  expect(await valid(page)).toBe(true);
});

test("an invalid field shows its message after a blur and describes the control with it", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const body = page.getByRole("textbox", { name: "Body" });
  const host = page.locator("#body");
  const message = host.locator('[part="message"]');
  await expect(message).toBeHidden();
  await body.focus();
  await page.keyboard.press("Tab");
  const text = await host.evaluate(
    (el) => (el as HTMLTextAreaElement).validationMessage,
  );
  expect(text).not.toBe("");
  await expect(message).toBeVisible();
  await expect(message).toHaveText(text);
  await expect(body).toHaveAccessibleDescription(text);
  await body.fill("abc");
  await expect(message).toBeHidden();
  await expect(body).toHaveAccessibleDescription("");
});

test("a disabled fieldset disables the fields and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(page.getByRole("textbox", { name: "Note" })).toBeDisabled();
  expect(await submitted(page)).toEqual([]);
});

test("a blocked submit marks an untouched invalid field", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const body = page.getByRole("textbox", { name: "Body" });
  await expect(body).not.toHaveAttribute("aria-invalid");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(body).toHaveAttribute("aria-invalid", "true");
});

test("the host exposes the validity API", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const result = await page.locator("#body").evaluate((el) => {
    const field = el as HTMLElement & {
      checkValidity(): boolean;
      setCustomValidity(message: string): void;
      validity: ValidityState;
      validationMessage: string;
      form: HTMLFormElement;
    };
    const missing = field.validity.valueMissing;
    (el as unknown as { value: string }).value = "abcd";
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
      '<purr-textarea id="late" label="Fallback"><span id="t"> </span></purr-textarea>',
    );
  });
  const control = page.locator("#late").locator("textarea");
  await expect(control).toHaveAttribute("aria-label", "Fallback");
  await page.locator("#t").evaluate((el) => (el.textContent = "Message"));
  await expect(control).not.toHaveAttribute("aria-label");
});

test("the field keeps a border under forced colors and a ring on focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const style = await page.locator("purr-textarea").evaluate((el) => {
    const css = getComputedStyle(
      el.shadowRoot!.querySelector('[part="field"]')!,
    );
    return [css.borderStyle, css.outlineStyle];
  });
  expect(style).toEqual(["solid", "solid"]);
});

test("a custom validity set before the first render is kept", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const result = await root.evaluate(async (el) => {
    const field = document.createElement("purr-textarea") as HTMLElement & {
      setCustomValidity(message: string): void;
      validity: ValidityState;
      validationMessage: string;
      updateComplete: Promise<boolean>;
    };
    field.setCustomValidity("Taken");
    el.append(field);
    await field.updateComplete;
    return [field.validity.customError, field.validationMessage];
  });
  expect(result).toEqual([true, "Taken"]);
});

test("the field shrinks to a narrow container", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  const width = await root.evaluate((el) => {
    const box = document.createElement("div");
    box.style.inlineSize = "100px";
    box.innerHTML = '<purr-textarea label="Narrow"></purr-textarea>';
    el.append(box);
    return box.firstElementChild!.getBoundingClientRect().width;
  });
  expect(width).toBeLessThanOrEqual(100);
});

test("an external label names the textarea, even one added later", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      '<label for="ext">Bio</label><purr-textarea id="ext"></purr-textarea><purr-textarea id="late"></purr-textarea>',
    ),
  );
  await expect(page.getByRole("textbox", { name: "Bio" })).toBeVisible();
  await root.evaluate((el) =>
    el.insertAdjacentHTML("beforeend", '<label for="late">Notes</label>'),
  );
  await page.locator("#late").evaluate((el) => (el as HTMLElement).focus());
  await expect(page.getByRole("textbox", { name: "Notes" })).toBeFocused();
});

test("the text is padded from the start edge under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const padding = await page.locator("purr-textarea").evaluate((el) => {
    const css = getComputedStyle(el.shadowRoot!.querySelector("textarea")!);
    return [css.direction, css.paddingRight, css.paddingLeft];
  });
  expect(padding[0]).toBe("rtl");
  expect(padding[1]).toBe(padding[2]);
});

test("a text area without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-textarea");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare").getByRole("textbox")).toBeVisible();
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("states")));
});

// The virtual screen reader does not enter shadow roots, so it can only reach
// the slotted label; the inner textarea's role and name are in the aria snapshot.
test("virtual screen reader speaks the slotted label", async ({ page }) => {
  await gotoStory(page, story("labelled"));
  expect((await spokenPhrases(page)).join(" | ")).toContain("Message");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every field keeps a 44 px minimum height", async ({ page }) => {
    await gotoStory(page, story("sizes"));
    for (const control of await page.locator("purr-textarea").all()) {
      const box = (await control.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
