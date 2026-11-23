import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-input-otp--${name}`;

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

/** Records pl-input, pl-change and pl-complete on the host into window.log. */
const record = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["pl-input", "pl-change", "pl-complete"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: string }>).detail.value}`,
        ),
      );
  });

const recorded = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

const caret = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((el) => el.shadowRoot!.querySelector("input")!.selectionStart);

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("labelled"));
  await expect(root).toMatchAriaSnapshot(`
    - textbox "Verification code"
  `);
});

test("the input asks the system for a one-time code with a numeric keyboard", async ({
  page,
}) => {
  await gotoStory(page, story("lengths"));
  const attrs = (n: number) =>
    page
      .locator("pl-input-otp")
      .nth(n)
      .evaluate((el) => {
        const input = el.shadowRoot!.querySelector("input")!;
        // Firefox reports "" from the property for a token it does not use.
        return [
          input.type,
          input.getAttribute("autocomplete"),
          input.inputMode,
        ];
      });
  expect(await attrs(0)).toEqual(["text", "one-time-code", "numeric"]);
  expect(await attrs(1)).toEqual(["text", "one-time-code", "numeric"]);
  expect(await attrs(2)).toEqual(["text", "one-time-code", "text"]);
});

test("a slotted label names the input and a click on it focuses the field", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const field = page.getByRole("textbox", { name: "Code" });
  await page.locator("#otp label").click();
  await expect(field).toBeFocused();
});

test("the label attribute names the input when there is no slotted label", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  await expect(
    page.getByRole("textbox", { name: "Verification code" }),
  ).toBeVisible();
});

test("one box per character, and the value fills them in order", async ({
  page,
}) => {
  await gotoStory(page, story("lengths"));
  const boxes = (n: number) =>
    page.locator("pl-input-otp").nth(n).locator('[part="box"]');
  await expect(boxes(0)).toHaveCount(4);
  await expect(boxes(1)).toHaveCount(6);
  await expect(boxes(1)).toHaveText(["1", "2", "3", "", "", ""]);
  await expect(boxes(2)).toHaveText(["A", "1", "B", "2", "C", "3", "D", "4"]);
});

test("typing fills the boxes and fires pl-input per edit, pl-complete at the end and pl-change on blur", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page, "#otp");
  await page.getByRole("textbox", { name: "Code" }).pressSequentially("123456");
  await expect(page.locator("#otp").locator('[part="box"]')).toHaveText([
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
  ]);
  await page.keyboard.press("Tab");
  expect(await recorded(page)).toEqual([
    "pl-input:1",
    "pl-input:12",
    "pl-input:123",
    "pl-input:1234",
    "pl-input:12345",
    "pl-input:123456",
    "pl-complete:123456",
    "pl-change:123456",
  ]);
});

test("a native input event reaches the host and a native change follows pl-change", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("#otp").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["input", "pl-change", "change"])
      el.addEventListener(name, () => log.push(name));
  });
  await page.getByRole("textbox", { name: "Code" }).pressSequentially("12");
  await page.keyboard.press("Tab");
  expect(await recorded(page)).toEqual([
    "input",
    "input",
    "pl-change",
    "change",
  ]);
});

test("a pasted or autofilled code fills every box at once and completes once", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page, "#otp");
  await page.getByRole("textbox", { name: "Code" }).fill("123456");
  await expect(page.locator("#otp").locator('[part="box"]')).toHaveText([
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
  ]);
  expect(await recorded(page)).toEqual([
    "pl-input:123456",
    "pl-complete:123456",
  ]);
});

test("spaces and dashes in a pasted code are dropped and extra characters are cut", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.getByRole("textbox", { name: "Code" }).fill("12-34 56 78");
  await expect(page.getByRole("textbox", { name: "Code" })).toHaveValue(
    "123456",
  );
  expect(
    await page.locator("#otp").evaluate((el) => (el as HTMLInputElement).value),
  ).toBe("123456");
});

test("a numeric code takes digits only", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.getByRole("textbox", { name: "Code" }).pressSequentially("a1b2");
  await expect(page.getByRole("textbox", { name: "Code" })).toHaveValue("12");
});

test("a text code takes letters and digits", async ({ page }) => {
  await gotoStory(page, story("lengths"));
  const field = page.getByRole("textbox", { name: "Eight characters" });
  await field.fill("");
  await field.pressSequentially("a1-b2");
  await expect(field).toHaveValue("a1b2");
});

test("pl-complete is not fired for a code that is still short", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await record(page, "#otp");
  await page.getByRole("textbox", { name: "Code" }).pressSequentially("12345");
  expect((await recorded(page)).some((e) => e.startsWith("pl-complete"))).toBe(
    false,
  );
});

test("Backspace and the arrow keys edit as in a text field", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const field = page.getByRole("textbox", { name: "Code" });
  await field.fill("123");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Backspace");
  await expect(field).toHaveValue("13");
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  await expect(field).toHaveValue("1");
  await expect(page.locator("#otp").locator('[part="box"]')).toHaveText([
    "1",
    "",
    "",
    "",
    "",
    "",
  ]);
});

test("the active box follows the caret", async ({ page }) => {
  await gotoStory(page, story("default"));
  const boxes = page.locator("#otp").locator('[part="box"]');
  await page.getByRole("textbox", { name: "Code" }).pressSequentially("12");
  await expect(boxes.nth(2)).toHaveAttribute("data-active", "");
  await page.keyboard.press("ArrowLeft");
  await expect(boxes.nth(1)).toHaveAttribute("data-active", "");
  await expect(boxes.nth(2)).not.toHaveAttribute("data-active");
});

test("a full code keeps its last box active and select-all marks every box selected", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const boxes = page.locator("#otp").locator('[part="box"]');
  const field = page.getByRole("textbox", { name: "Code" });
  await field.pressSequentially("123456");
  await expect(boxes.nth(5)).toHaveAttribute("data-active", "");
  await field.press("ControlOrMeta+a");
  await expect(boxes.nth(0)).toHaveAttribute("data-selected", "");
  await expect(boxes.nth(5)).toHaveAttribute("data-selected", "");
});

test("a click puts the caret at the box that was hit and never past the text", async ({
  page,
}) => {
  await gotoStory(page, story("lengths"));
  const host = page.locator("pl-input-otp").nth(1);
  const click = async (index: number) => {
    const box = (await host.locator('[part="box"]').nth(index).boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  await click(1);
  await expect.poll(() => caret(page, "pl-input-otp >> nth=1")).toBe(1);
  await click(5);
  await expect.poll(() => caret(page, "pl-input-otp >> nth=1")).toBe(3);
});

test("the focus ring is drawn on the active box", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  // The ring fades in, so the colour is transparent until the transition runs.
  await expect
    .poll(() =>
      page
        .locator("#otp")
        .evaluate(
          (el) =>
            getComputedStyle(
              el.shadowRoot!.querySelector('[part="box"][data-active]')!,
            ).outlineColor,
        ),
    )
    .not.toBe("rgba(0, 0, 0, 0)");
});

test("a disabled field takes no focus", async ({ page }) => {
  await gotoStory(page, story("states"));
  const field = page.getByRole("textbox", { name: "Disabled" });
  await expect(field).toBeDisabled();
  await page.locator("pl-input-otp").nth(2).click({ force: true });
  await expect(field).not.toBeFocused();
});

test("a read-only field keeps its value", async ({ page }) => {
  await gotoStory(page, story("states"));
  const field = page.getByRole("textbox", { name: "Read only" });
  await field.focus();
  await page.keyboard.type("9");
  await page.keyboard.press("Backspace");
  await expect(field).toHaveValue("123456");
});

test("setting the value property cleans it and fills the boxes", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page
    .locator("#otp")
    .evaluate(
      (el) => ((el as HTMLElement & { value: string }).value = "12ab3 4"),
    );
  await expect(page.locator("#otp").locator('[part="box"]')).toHaveText([
    "1",
    "2",
    "3",
    "4",
    "",
    "",
  ]);
});

test("a missing length and a null value fall back to six empty boxes", async ({
  page,
}) => {
  await gotoStory(page, story("lengths"));
  const host = page.locator("pl-input-otp").nth(1);
  await host.evaluate((el) => {
    el.removeAttribute("length");
    (el as HTMLElement & { value: unknown }).value = null;
  });
  await expect(host.locator('[part="box"]')).toHaveCount(6);
  await expect(host.locator('[part="box"]').first()).toHaveText("");
});

test("the form gets the value, and a reset returns the value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.getByRole("textbox", { name: "Code" }).fill("123456");
  expect(await submitted(page)).toEqual([
    ["code", "123456"],
    ["pin", "12"],
  ]);
  await page.getByRole("textbox", { name: "PIN" }).fill("9876");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(page.getByRole("textbox", { name: "Code" })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "PIN" })).toHaveValue("12");
});

test("required and a short code make the form invalid until the code is complete", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const code = page.getByRole("textbox", { name: "Code" });
  expect(await valid(page)).toBe(false);
  await code.fill("123");
  expect(await valid(page)).toBe(false);
  expect(
    await page.locator("#code").evaluate((el) => {
      const field = el as HTMLElement & { validity: ValidityState };
      return field.validity.tooShort;
    }),
  ).toBe(true);
  await code.fill("123456");
  // The PIN field starts as an incomplete "12".
  expect(await valid(page)).toBe(false);
  await page.getByRole("textbox", { name: "PIN" }).fill("1234");
  expect(await valid(page)).toBe(true);
});

test("an incomplete code shows its message after a blur and describes the input with it", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const code = page.getByRole("textbox", { name: "Code" });
  const host = page.locator("#code");
  const message = host.locator('[part="message"]');
  await expect(message).toBeHidden();
  await expect(code).not.toHaveAttribute("aria-invalid");
  await code.fill("123");
  await expect(code).not.toHaveAttribute("aria-invalid");
  await page.keyboard.press("Tab");
  await expect(code).toHaveAttribute("aria-invalid", "true");
  await expect(message).toBeVisible();
  await expect(message).toHaveText("Enter all 6 characters.");
  await expect(code).toHaveAccessibleDescription("Enter all 6 characters.");
  await code.fill("123456");
  await expect(message).toBeHidden();
  await expect(code).toHaveAccessibleDescription("");
});

test("incomplete-message replaces the default message", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const host = page.locator("#code");
  await host.evaluate((el) =>
    el.setAttribute("incomplete-message", "Too short"),
  );
  const code = page.getByRole("textbox", { name: "Code" });
  await code.fill("1");
  await page.keyboard.press("Tab");
  await expect(host.locator('[part="message"]')).toHaveText("Too short");
});

test("a reset clears the invalid state", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const code = page.getByRole("textbox", { name: "Code" });
  await code.fill("1");
  await page.keyboard.press("Tab");
  await expect(code).toHaveAttribute("aria-invalid", "true");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(code).not.toHaveAttribute("aria-invalid");
});

test("a disabled fieldset disables the fields and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(page.getByRole("textbox", { name: "Code" })).toBeDisabled();
  expect(await submitted(page)).toEqual([]);
});

test("the host exposes the validity API", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  const result = await page.locator("#code").evaluate((el) => {
    const field = el as HTMLElement & {
      checkValidity(): boolean;
      setCustomValidity(message: string): void;
      validity: ValidityState;
      validationMessage: string;
      form: HTMLFormElement;
    };
    const missing = field.validity.valueMissing;
    (el as unknown as { value: string }).value = "123456";
    return new Promise((resolve) =>
      requestAnimationFrame(() => {
        const before = field.checkValidity();
        field.setCustomValidity("Expired");
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
  expect(result).toEqual([true, true, false, true, "Expired", "form"]);
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
    '<button type="submit" name="intent" value="verify">Verify</button>',
  );
  // The story's PIN starts incomplete, which would block the submit.
  await page.getByRole("textbox", { name: "PIN" }).fill("1234");
  await page.getByRole("textbox", { name: "Code" }).fill("123456");
  await page.keyboard.press("Enter");
  await expect(page.locator("#form")).toHaveAttribute(
    "data-submitted",
    "intent",
  );
});

test("the boxes read left to right under rtl while the field stays in place", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const xs = await page
    .locator("pl-input-otp")
    .first()
    .evaluate((el) =>
      [...el.shadowRoot!.querySelectorAll('[part="box"]')].map(
        (box) => box.getBoundingClientRect().left,
      ),
    );
  expect(xs[0]).toBeLessThan(xs[1]!);
  await expect(
    page.locator("pl-input-otp").first().locator('[part="box"]'),
  ).toHaveText(["1", "2", "3", "4", "", ""]);
});

test("the boxes keep a border under forced colors and a ring on focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const style = await page.locator("#otp").evaluate((el) => {
    const css = getComputedStyle(el.shadowRoot!.querySelector('[part="box"]')!);
    return [css.borderStyle, css.outlineStyle];
  });
  expect(style).toEqual(["solid", "solid"]);
});

test("reduced motion removes the box transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  const duration = await page
    .locator("#otp")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="box"]')!)
          .transitionDuration,
    );
  expect(duration.split(",").every((d) => parseFloat(d) === 0)).toBe(true);
});

test("filled and empty fields pass axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("lengths")));
});

test("a code field without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("pl-input-otp");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare").getByRole("textbox")).toBeAttached();
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("lengths")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every box and the input keep a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, story("sizes"));
    for (const host of await page.locator("pl-input-otp").all()) {
      for (const box of await host.locator('[part="box"]').all()) {
        const rect = (await box.boundingBox())!;
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      }
      const input = (await host.locator("input").boundingBox())!;
      expect(input.height).toBeGreaterThanOrEqual(44);
    }
  });
});
