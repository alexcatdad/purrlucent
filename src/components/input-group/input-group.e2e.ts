import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";
import { expectWidthsIncrease } from "../../../e2e/helpers/widths.ts";

const story = (name: string) => `forms-input-group--${name}`;

/** The box of the group's shell, of the input's own field row, and of one addon. */
const boxes = (group: Locator, addon: string) =>
  group.evaluate((el, selector) => {
    const rect = (node: Element) => {
      const { top, height, left, right } = node.getBoundingClientRect();
      return { top, height, left, right };
    };
    return {
      shell: rect(el.shadowRoot!.querySelector('[part="shell"]')!),
      field: rect(
        el
          .querySelector("pl-input, pl-textarea")!
          .shadowRoot!.querySelector('[part="field"]')!,
      ),
      addon: rect(el.querySelector(selector)!),
    };
  }, addon);

test("widths story sizes the control", async ({ page }) => {
  await gotoStory(page, story("widths"));
  await expectWidthsIncrease(page, "pl-input-group");
});

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - textbox "Amount"
  `);
});

test("the input keeps its label, name and value, and fires its own events", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.locator("#input").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const name of ["pl-input", "pl-change"])
      el.addEventListener(name, (event) =>
        log.push(
          `${name}:${(event as CustomEvent<{ value: string }>).detail.value}`,
        ),
      );
  });
  await page.getByRole("textbox", { name: "Amount" }).pressSequentially("12");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => (window as unknown as { log: string[] }).log),
  ).toEqual(["pl-input:1", "pl-input:12", "pl-change:12"]);
});

test("the group draws one edge and the input draws none", async ({ page }) => {
  await gotoStory(page, story("default"));
  const style = await page.locator("#group").evaluate((el) => {
    const css = (node: Element) => getComputedStyle(node);
    const field = el
      .querySelector("pl-input")!
      .shadowRoot!.querySelector('[part="field"]')!;
    return {
      shell: css(el.shadowRoot!.querySelector('[part="shell"]')!).boxShadow,
      field: css(field).boxShadow,
      fieldFill: css(field).backgroundColor,
    };
  });
  expect(style.shell).not.toBe("none");
  expect(style.field).toBe("none");
  expect(style.fieldFill).toBe("rgba(0, 0, 0, 0)");
});

test("one focus ring is drawn on the shell, not on the field", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  // The ring fades in, so the colour is transparent until the transition runs.
  await expect
    .poll(() =>
      page
        .locator("#group")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector('[part="shell"]')!)
              .outlineColor,
        ),
    )
    .not.toBe("rgba(0, 0, 0, 0)");
  expect(
    await page
      .locator("#input")
      .evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector('[part="field"]')!)
            .outlineColor,
      ),
  ).toBe("rgba(0, 0, 0, 0)");
});

test("the shell and addons line up with the field row, below the label", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const { shell, field, addon } = await boxes(
    page.locator("#group"),
    '[slot="start"]',
  );
  expect(field.top).toBeGreaterThan(0);
  for (const box of [shell, addon]) {
    expect(Math.abs(box.top - field.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.height - field.height)).toBeLessThanOrEqual(1);
  }
});

test("the addons sit on either side of the field and inside the shell", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const group = page.locator("#group");
  const [start, end, shell] = await group.evaluate((el) => {
    const rect = (node: Element) => node.getBoundingClientRect();
    return [
      rect(el.querySelector('[slot="start"]')!),
      rect(el.querySelector('[slot="end"]')!),
      rect(el.shadowRoot!.querySelector('[part="shell"]')!),
    ].map(({ left, right }) => ({ left, right }));
  });
  const input = (await page.locator("#input").boundingBox())!;
  expect(start!.right).toBeLessThanOrEqual(input.x + 1);
  expect(end!.left).toBeGreaterThanOrEqual(input.x + input.width - 1);
  expect(start!.left).toBeGreaterThanOrEqual(shell!.left - 1);
  expect(end!.right).toBeLessThanOrEqual(shell!.right + 1);
});

test("clicking a text addon focuses the input", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator('[slot="start"]').click();
  await expect(page.getByRole("textbox", { name: "Amount" })).toBeFocused();
});

test("an addon button is a tab stop beside the field and keeps its own name", async ({
  page,
}) => {
  await gotoStory(page, story("addons"));
  const go = page.getByRole("button", { name: "Go" });
  const copy = page.getByRole("button", { name: "Copy" });
  await expect(go).toBeVisible();
  await copy.focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("textbox", { name: "Invite link" }),
  ).toBeFocused();
  await page.getByRole("searchbox", { name: "Search" }).focus();
  await page.keyboard.press("Tab");
  await expect(go).toBeFocused();
});

test("an addon icon is hidden from assistive technology", async ({ page }) => {
  await gotoStory(page, story("addons"));
  await expect(page.locator('svg[slot="start"]').first()).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.getByRole("textbox", { name: "Website" })).toBeVisible();
});

test("addon text named in aria-describedby describes the control", async ({
  page,
}) => {
  await gotoStory(page, story("described"));
  const field = page.getByRole("textbox", { name: "Weight" });
  await expect(field).toHaveAccessibleDescription("kilograms");
  await page.locator("#unit").evaluate((el) => (el.textContent = "pounds"));
  await expect(field).toHaveAccessibleDescription("pounds");
  await page
    .locator("pl-input")
    .evaluate((el) => el.removeAttribute("aria-describedby"));
  await expect(field).toHaveAccessibleDescription("");
});

test("the shell takes the invalid edge, and the field still shows its message", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const group = page.locator("#invalid");
  const destructive = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.color = "var(--pl-color-destructive)";
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  await expect
    .poll(() =>
      group.evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector('[part="shell"]')!)
            .boxShadow,
      ),
    )
    .toContain(destructive);
  await expect(
    page.locator("#email").locator('[part="message"]'),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Invalid" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("a disabled input dims the shell and its addons", async ({ page }) => {
  await gotoStory(page, story("states"));
  const field = page.getByRole("textbox", { name: "Disabled" });
  await expect(field).toBeDisabled();
  const dimmed = await page
    .locator("pl-input-group")
    .first()
    .evaluate((el) => {
      const probe = document.body.appendChild(document.createElement("div"));
      probe.style.color = "var(--pl-color-disabled-foreground)";
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return (
        getComputedStyle(el.querySelector('[slot="start"]')!).color === expected
      );
    });
  expect(dimmed).toBe(true);
});

test("a text area group keeps the shell and addon as tall as the field", async ({
  page,
}) => {
  await gotoStory(page, story("textarea"));
  const group = page.locator("#group");
  const before = await boxes(group, 'svg[slot="start"]');
  expect(
    Math.abs(before.shell.height - before.field.height),
  ).toBeLessThanOrEqual(1);
  await group
    .locator("pl-textarea")
    .evaluate((el) => el.setAttribute("rows", "6"));
  await expect
    .poll(async () => {
      const after = await boxes(group, 'svg[slot="start"]');
      return Math.abs(after.shell.height - after.field.height) <= 1;
    })
    .toBe(true);
  const after = await boxes(group, 'svg[slot="start"]');
  expect(after.shell.height).not.toBe(before.shell.height);
});

test("sizes keep the addons as tall as the field", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  for (const group of await page.locator("pl-input-group").all()) {
    const { shell, field, addon } = await boxes(group, '[slot="start"]');
    expect(Math.abs(shell.height - field.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(addon.height - field.height)).toBeLessThanOrEqual(1);
  }
});

test("the group mirrors under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const sides = await page
    .locator("pl-input-group")
    .first()
    .evaluate((el) => {
      const left = (selector: string) =>
        el.querySelector(selector)!.getBoundingClientRect().left;
      return [left('[slot="start"]'), left("pl-input"), left('[slot="end"]')];
    });
  expect(sides[0]).toBeGreaterThan(sides[1]!);
  expect(sides[2]).toBeLessThan(sides[1]!);
});

test("the shell keeps a border under forced colors and a ring on focus", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const style = await page.locator("#group").evaluate((el) => {
    const shell = getComputedStyle(
      el.shadowRoot!.querySelector('[part="shell"]')!,
    );
    const field = getComputedStyle(
      el
        .querySelector("pl-input")!
        .shadowRoot!.querySelector('[part="field"]')!,
    );
    return [shell.borderStyle, shell.outlineStyle, field.borderStyle];
  });
  expect(style).toEqual(["solid", "solid", "none"]);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("addons")));
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("addons")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every addon keeps a 44 by 44 hit area", async ({
    page,
  }: {
    page: Page;
  }) => {
    await gotoStory(page, story("addons"));
    for (const button of await page.locator("pl-button").all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    for (const group of await page.locator("pl-input-group").all()) {
      expect((await group.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });
});
