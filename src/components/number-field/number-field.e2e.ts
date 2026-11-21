import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-number-field--${name}`;

const submitted = (page: Page) =>
  page
    .locator("#form")
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement)].map(([k, v]) => [
        k,
        String(v),
      ]),
    );

const record = (host: Locator) =>
  host.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["purr-input", "purr-change"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: unknown }>).detail.value}`,
        ),
      );
  });

const logged = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - spinbutton "Quantity"
    - button "Increase"
    - button "Decrease"
  `);
  const field = page.getByRole("spinbutton", { name: "Quantity" });
  await expect(field).toHaveAttribute("aria-valuenow", "3");
  await expect(field).toHaveAttribute("aria-valuemin", "0");
  await expect(field).toHaveAttribute("aria-valuemax", "99");
});

test("a slotted label names the field and a click on it focuses the input", async ({
  page,
}) => {
  await gotoStory(page, story("labelled"));
  const field = page.getByRole("spinbutton", { name: "Quantity" });
  await page.locator("purr-number-field label").click();
  await expect(field).toBeFocused();
});

test("focusing the host focuses the input", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("purr-number-field").focus();
  await expect(page.getByRole("spinbutton")).toBeFocused();
});

test("the stepper buttons are not tab stops", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(page.getByRole("spinbutton")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("spinbutton")).not.toBeFocused();
  expect(
    await page
      .locator("purr-number-field")
      .evaluate(
        (el) => el.shadowRoot!.querySelectorAll("button[tabindex='-1']").length,
      ),
  ).toBe(2);
});

test("the keys follow the spinbutton pattern", async ({ page }) => {
  await gotoStory(page, story("steps"));
  const field = page.getByRole("spinbutton");
  await field.focus();
  await page.keyboard.press("ArrowUp");
  await expect(field).toHaveValue("6");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(field).toHaveValue("4");
  await page.keyboard.press("PageUp");
  await expect(field).toHaveValue("10");
  await page.keyboard.press("PageDown");
  await expect(field).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(field).toHaveValue("10");
  await expect(field).toHaveAttribute("aria-valuenow", "10");
  await page.keyboard.press("Home");
  await expect(field).toHaveValue("0");
});

test("Home and End do nothing without min and max", async ({ page }) => {
  await gotoStory(page, story("states"));
  const field = page.getByRole("spinbutton", { name: "Empty inside" });
  await field.focus();
  await page.keyboard.press("ArrowUp");
  await expect(field).toHaveValue("1");
  await page.keyboard.press("End");
  await page.keyboard.press("Home");
  await expect(field).toHaveValue("1");
});

test("a typed number is clamped and snapped when committed", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const field = page.getByRole("spinbutton", { name: "Count" });
  await record(page.locator("#count"));
  await field.fill("5");
  await expect(field).toHaveValue("5");
  await page.keyboard.press("Tab");
  await expect(field).toHaveValue("6");
  await field.fill("99");
  await page.keyboard.press("Enter");
  await expect(field).toHaveValue("10");
  await field.fill("abc");
  await page.keyboard.press("Tab");
  await expect(field).toHaveValue("10");
  expect(await logged(page)).toEqual([
    "purr-input:5",
    "purr-change:6",
    "purr-input:99",
    "purr-change:10",
  ]);
});

test("a custom validity set before the first render is kept", async ({
  page,
}) => {
  await gotoStory(page, story("steps"));
  const result = await page
    .locator("purr-number-field")
    .evaluate(async (el) => {
      const field = document.createElement(
        "purr-number-field",
      ) as HTMLElement & {
        setCustomValidity(message: string): void;
        validity: ValidityState;
        validationMessage: string;
        updateComplete: Promise<boolean>;
      };
      field.setCustomValidity("Taken");
      el.after(field);
      await field.updateComplete;
      return [field.validity.customError, field.validationMessage];
    });
  expect(result).toEqual([true, "Taken"]);
});

test("editing shortcuts with a modifier key do not change the value", async ({
  page,
}) => {
  await gotoStory(page, story("steps"));
  const field = page.getByRole("spinbutton");
  await record(page.locator("purr-number-field"));
  await field.focus();
  for (const key of [
    "Shift+Home",
    "Meta+ArrowUp",
    "Control+End",
    "Alt+ArrowDown",
  ])
    await page.keyboard.press(key);
  await expect(field).toHaveValue("5");
  expect(await logged(page)).toEqual([]);
});

test("a read-only field keeps Home and End for the caret", async ({ page }) => {
  await gotoStory(page, story("steps"));
  const host = page.locator("purr-number-field");
  await host.evaluate(
    (el) => ((el as HTMLElement & { readonly: boolean }).readonly = true),
  );
  const prevented = await host.evaluate((el) => {
    const input = el.shadowRoot!.querySelector("input")!;
    const event = new KeyboardEvent("keydown", {
      key: "Home",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
});

test("the form and its validity follow the typed text before a commit", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const form = page.locator("#form");
  const valid = () =>
    form.evaluate((f) => (f as HTMLFormElement).checkValidity());
  await page.getByRole("spinbutton", { name: "Count" }).fill("5");
  await page.getByRole("spinbutton", { name: "Age" }).fill("7");
  expect(await submitted(page)).toEqual([
    ["count", "6"],
    ["age", "7"],
  ]);
  expect(await valid()).toBe(true);
  await page.getByRole("spinbutton", { name: "Age" }).fill("");
  expect(await valid()).toBe(false);
});

test("a script reset replaces typed text that is not a number", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const field = page.getByRole("spinbutton", { name: "Count" });
  await field.fill("abc");
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(field).toHaveValue("4");
});

test("the buttons step, stop at the limits and are disabled there", async ({
  page,
}) => {
  await gotoStory(page, story("steps"));
  const host = page.locator("purr-number-field");
  const field = page.getByRole("spinbutton");
  await record(host);
  await host.getByRole("button", { name: "Increase" }).click();
  await expect(field).toHaveValue("6");
  await host.getByRole("button", { name: "Decrease" }).click();
  await host.getByRole("button", { name: "Decrease" }).click();
  await expect(field).toHaveValue("4");
  expect((await logged(page)).slice(0, 2)).toEqual([
    "purr-input:6",
    "purr-change:6",
  ]);
  await field.focus();
  await page.keyboard.press("End");
  await expect(host.getByRole("button", { name: "Increase" })).toBeDisabled();
  await page.keyboard.press("Home");
  await expect(host.getByRole("button", { name: "Decrease" })).toBeDisabled();
});

test("a pressed button keeps focus in the field and repeats while held", async ({
  page,
}) => {
  await gotoStory(page, story("steps"));
  const host = page.locator("purr-number-field");
  const field = page.getByRole("spinbutton");
  await field.focus();
  const box = (await host
    .getByRole("button", { name: "Increase" })
    .boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(field).toHaveValue("6");
  await expect(field).toHaveValue("10");
  await page.mouse.up();
  await expect(field).toBeFocused();
  await expect(host.getByRole("button", { name: "Increase" })).toBeDisabled();
});

test("a press shorter than the repeat delay steps once", async ({ page }) => {
  await gotoStory(page, story("steps"));
  const host = page.locator("purr-number-field");
  await host.getByRole("button", { name: "Decrease" }).click();
  await page.waitForTimeout(600);
  await expect(page.getByRole("spinbutton")).toHaveValue("4");
});

test("a disabled field and a read-only field cannot be stepped", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const host = (name: string) =>
    page
      .locator("purr-number-field")
      .filter({ has: page.getByRole("spinbutton", { name }) });
  await expect(
    page.getByRole("spinbutton", { name: "Disabled inside" }),
  ).toBeDisabled();
  await expect(
    host("Disabled inside").getByRole("button", { name: "Increase" }),
  ).toBeDisabled();
  const readonly = page.getByRole("spinbutton", { name: "Read only inside" });
  await readonly.focus();
  await page.keyboard.press("ArrowUp");
  await expect(readonly).toHaveValue("3");
  await expect(
    host("Read only inside").getByRole("button", { name: "Decrease" }),
  ).toBeDisabled();
});

test("the focus ring is drawn on the field", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page
        .locator("purr-number-field")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
              .outlineColor,
        ),
    )
    .not.toBe("rgba(0, 0, 0, 0)");
});

test("the form gets the number, and a reset returns the value attribute", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page.getByRole("spinbutton", { name: "Age" }).fill("30");
  await page.getByRole("spinbutton", { name: "Count" }).focus();
  await page.keyboard.press("ArrowUp");
  expect(await submitted(page)).toEqual([
    ["count", "6"],
    ["age", "30"],
  ]);
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(page.getByRole("spinbutton", { name: "Count" })).toHaveValue(
    "4",
  );
  await expect(page.getByRole("spinbutton", { name: "Age" })).toHaveValue("");
});

test("required makes the form invalid while empty, after interaction it is marked", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  const age = page.getByRole("spinbutton", { name: "Age" });
  const form = page.locator("#form");
  await expect(age).not.toHaveAttribute("aria-invalid");
  expect(
    await form.evaluate((f) => (f as HTMLFormElement).checkValidity()),
  ).toBe(false);
  await age.focus();
  await page.keyboard.press("Tab");
  await expect(age).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Increase" }).nth(1).click();
  expect(
    await form.evaluate((f) => (f as HTMLFormElement).checkValidity()),
  ).toBe(true);
  await expect(age).not.toHaveAttribute("aria-invalid");
});

test("a disabled fieldset disables the fields and submits nothing", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(page.getByRole("spinbutton", { name: "Count" })).toBeDisabled();
  expect(await submitted(page)).toEqual([]);
});

test("Enter in a form with one number field submits it", async ({ page }) => {
  await gotoStory(page, story("in-form"));
  await page.locator("#form").evaluate((form) => {
    form.querySelector("#age")!.remove();
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute("data-submitted", "yes");
    });
  });
  await page.getByRole("spinbutton", { name: "Count" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#form")).toHaveAttribute("data-submitted", "yes");
});

test("the stepper sits at the inline end and mirrors under rtl", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const sides = await page.locator("purr-number-field").evaluateAll((hosts) =>
    hosts.map((el) => {
      const part = (name: string) =>
        el.shadowRoot!.querySelector(name)!.getBoundingClientRect();
      const [group, stepper] = [
        part('[part="group"]'),
        part('[part="stepper"]'),
      ];
      return {
        left: stepper.left - group.left,
        right: group.right - stepper.right,
      };
    }),
  );
  // Inside: at the end (left in rtl). Outside: after the field (left in rtl).
  for (const { left, right } of sides) expect(left).toBeLessThan(right);
});

test("the field and stepper keep their edges under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const style = await page.locator("purr-number-field").evaluate((el) => {
    const field = getComputedStyle(
      el.shadowRoot!.querySelector('[part="field"]')!,
    );
    const half = getComputedStyle(
      el.shadowRoot!.querySelector('[part="increment"]')!,
      "::before",
    );
    return [field.borderStyle, field.outlineStyle, half.boxShadow !== "none"];
  });
  expect(style).toEqual(["solid", "solid", true]);
});

for (const name of [
  "default",
  "labelled",
  "sizes",
  "states",
  "in-form",
  "steps",
  "keyboard",
  "rtl",
  "glass",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("a number field without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("purr-number-field");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare").getByRole("spinbutton")).toBeVisible();
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("an external label names the number field, even one added later", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) =>
    el.insertAdjacentHTML(
      "beforeend",
      '<label for="ext">Guests</label><purr-number-field id="ext"></purr-number-field><purr-number-field id="late"></purr-number-field>',
    ),
  );
  await expect(page.getByRole("spinbutton", { name: "Guests" })).toBeVisible();
  await root.evaluate((el) =>
    el.insertAdjacentHTML("beforeend", '<label for="late">Nights</label>'),
  );
  await page.locator("#late").evaluate((el) => (el as HTMLElement).focus());
  await expect(page.getByRole("spinbutton", { name: "Nights" })).toBeFocused();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

// The virtual screen reader does not enter shadow roots, so it can only reach
// the slotted label; the inner spinbutton's role and value are in the aria snapshot.
test("virtual screen reader speaks the slotted label", async ({ page }) => {
  await gotoStory(page, story("labelled"));
  expect((await spokenPhrases(page)).join(" | ")).toContain("Quantity");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the stepper hit areas stay clear of the typed text", async ({
    page,
  }) => {
    await gotoStory(page, story("sizes"));
    for (const control of await page.locator("purr-number-field").all()) {
      const input = (await control.getByRole("spinbutton").boundingBox())!;
      const button = (await control
        .getByRole("button", { name: "Increase" })
        .boundingBox())!;
      expect(input.x + input.width).toBeLessThanOrEqual(button.x + 0.5);
    }
  });

  test("every field and both stepper buttons keep a 44 by 44 hit area", async ({
    page,
  }) => {
    await gotoStory(page, story("sizes"));
    for (const control of await page.locator("purr-number-field").all()) {
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      for (const name of ["Increase", "Decrease"]) {
        const box = (await control
          .getByRole("button", { name })
          .boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

forEachViewport(({ name }) => {
  for (const id of ["sizes", "states", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, story(id));
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
