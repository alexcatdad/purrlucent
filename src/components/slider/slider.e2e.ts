import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `forms-slider--${name}`;

const now = (control: Locator) => control.getAttribute("aria-valuenow");

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

/** The point on the slider at a fraction of its width, from the left. */
async function at(control: Locator, fraction: number) {
  const box = (await control.boundingBox())!;
  return { x: box.x + box.width * fraction, y: box.y + box.height / 2 };
}

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("states"));
  await expect(root).toMatchAriaSnapshot(`
    - slider "Idle"
    - slider "Disabled" [disabled]
    - slider "Ticked, disabled" [disabled]
  `);
});

test("the host carries the slider attributes", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  await expect(control).toHaveAttribute("aria-valuemin", "0");
  await expect(control).toHaveAttribute("aria-valuemax", "100");
  await expect(control).toHaveAttribute("aria-valuenow", "50");
  await expect(control).toHaveAttribute("aria-orientation", "horizontal");
  await expect(control).toHaveAttribute("tabindex", "0");
});

test("arrow, page, Home and End keys move the value", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  await control.focus();
  await page.keyboard.press("ArrowRight");
  expect(await now(control)).toBe("51");
  await page.keyboard.press("ArrowUp");
  expect(await now(control)).toBe("52");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowDown");
  expect(await now(control)).toBe("50");
  await page.keyboard.press("PageUp");
  expect(await now(control)).toBe("60");
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  expect(await now(control)).toBe("40");
  await page.keyboard.press("End");
  expect(await now(control)).toBe("100");
  await page.keyboard.press("Home");
  expect(await now(control)).toBe("0");
});

test("a press on the track jumps the thumb, and a drag follows", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  const start = await at(control, 0.25);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const jumped = Number(await now(control));
  expect(jumped).toBeGreaterThan(15);
  expect(jumped).toBeLessThan(35);
  const end = await at(control, 0.75);
  await page.mouse.move(end.x, end.y, { steps: 5 });
  expect(Number(await now(control))).toBeGreaterThan(65);
  // Capture keeps the drag going outside the slider.
  await page.mouse.move(end.x + 300, end.y + 80);
  expect(await now(control)).toBe("100");
  await page.mouse.up();
  await expect(control).toBeFocused();
});

test("values snap to the step", async ({ page }) => {
  await gotoStory(page, story("ticks"));
  const control = page.getByRole("slider", { name: "Ticked md" });
  const point = await at(control, 0.4);
  await page.mouse.click(point.x, point.y);
  expect(Number(await now(control)) % 25).toBe(0);
});

test('step="any" gives a continuous value', async ({ page }) => {
  await gotoStory(page, story("continuous"));
  const control = page.getByRole("slider", { name: "Continuous" });
  const point = await at(control, 0.37);
  await page.mouse.click(point.x, point.y);
  const dragged = Number(await now(control));
  expect(dragged).toBeGreaterThan(0);
  expect(dragged).toBeLessThan(10);
  expect(Number.isInteger(dragged)).toBe(false);
  await control.evaluate((el) => {
    (el as HTMLElement & { value: number }).value = 5;
  });
  await expect(control).toHaveAttribute("aria-valuenow", "5");
  await page.keyboard.press("ArrowRight");
  expect(Number(await now(control))).toBeCloseTo(5.1);
});

test("pl-input fires while dragging and pl-change once on release", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  await control.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const type of ["pl-input", "pl-change"]) {
      el.addEventListener(type, (event) =>
        log.push(
          `${type}:${(event as CustomEvent<{ value: number }>).detail.value}`,
        ),
      );
    }
  });
  const start = await at(control, 0.1);
  const end = await at(control, 0.9);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();
  const log = await page.evaluate(
    () => (window as unknown as { log: string[] }).log,
  );
  expect(log.filter((e) => e.startsWith("pl-input")).length).toBeGreaterThan(1);
  expect(log.filter((e) => e.startsWith("pl-change"))).toHaveLength(1);
  expect(log.at(-1)).toMatch(/^pl-change:/);
});

/** Counts the events a slider fires from now on, into `window.log`. */
const logEvents = (control: Locator) =>
  control.evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const type of ["pl-input", "pl-change"]) {
      el.addEventListener(type, () => log.push(type));
    }
  });

const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

test("a value past the range or off the step fires nothing when a key lands on what is shown", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  await control.evaluate(async (el) => {
    const slider = el as HTMLElement & { value: number };
    slider.value = 150;
    await (el as HTMLElement & { updateComplete: Promise<boolean> })
      .updateComplete;
  });
  expect(await now(control)).toBe("100");
  await logEvents(control);
  await control.focus();
  await page.keyboard.press("End");
  expect(await events(page)).toEqual([]);
  await control.evaluate(async (el) => {
    const slider = el as HTMLElement & { value: number };
    slider.value = 50.4;
    await (el as HTMLElement & { updateComplete: Promise<boolean> })
      .updateComplete;
  });
  expect(await now(control)).toBe("50");
});

test("a value or bound that is not a number does not reach the ARIA values", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  await control.evaluate((el) => {
    el.setAttribute("value", "abc");
    el.setAttribute("min", "x");
  });
  await expect(control).toHaveAttribute("aria-valuenow", "0");
  await expect(control).toHaveAttribute("aria-valuemin", "0");
});

test("a restored form state sets the value", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  await control.evaluate((el) =>
    (
      el as HTMLElement & { formStateRestoreCallback(state: string): void }
    ).formStateRestoreCallback("40"),
  );
  await expect(control).toHaveAttribute("aria-valuenow", "40");
});

test("disabling the slider during a drag stops the drag", async ({ page }) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  const start = await at(control, 0.25);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const held = await now(control);
  await control.evaluate((el) => el.setAttribute("disabled", ""));
  const end = await at(control, 0.75);
  await page.mouse.move(end.x, end.y, { steps: 3 });
  expect(await now(control)).toBe(held);
  await page.mouse.up();
});

test("removing the slider during a drag ends the dragging state", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const control = page.getByRole("slider", { name: "Volume" });
  const start = await at(control, 0.25);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  expect(await control.evaluate((el) => el.matches(":state(dragging)"))).toBe(
    true,
  );
  await control.evaluate((el) => {
    const parent = el.parentElement!;
    el.remove();
    parent.append(el);
  });
  expect(await control.evaluate((el) => el.matches(":state(dragging)"))).toBe(
    false,
  );
  await page.mouse.up();
});

test("a disabled slider keeps its thumb and dims only the fill", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const thumb = (name: string) =>
    page.getByRole("slider", { name, exact: true }).evaluate((el) => {
      const style = getComputedStyle(
        el.shadowRoot!.querySelector('[part="thumb"]')!,
      );
      return [getComputedStyle(el).opacity, style.backgroundColor];
    });
  const [, idleThumb] = await thumb("Idle");
  const [opacity, disabledThumb] = await thumb("Disabled");
  expect(opacity).toBe("1");
  expect(disabledThumb).toBe(idleThumb);
});

test("a disabled slider takes no focus and does not move", async ({ page }) => {
  await gotoStory(page, story("states"));
  const control = page.getByRole("slider", { name: "Disabled", exact: true });
  await control.click({ force: true });
  await page.keyboard.press("ArrowRight");
  expect(await now(control)).toBe("50");
  expect(await control.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
});

test("the form submits the value, resets it and honors a disabled fieldset", async ({
  page,
}) => {
  await gotoStory(page, story("in-form"));
  expect(await submitted(page)).toEqual([
    ["volume", "30"],
    ["bass", "0"],
  ]);
  const volume = page.getByRole("slider", { name: "Volume" });
  await volume.focus();
  await page.keyboard.press("End");
  expect(await submitted(page)).toEqual([
    ["volume", "100"],
    ["bass", "0"],
  ]);
  await page
    .locator("#form")
    .evaluate((form) => (form as HTMLFormElement).reset());
  await expect(volume).toHaveAttribute("aria-valuenow", "30");
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = true));
  await expect(volume).toHaveAttribute("aria-disabled", "true");
  expect(await submitted(page)).toEqual([]);
  const point = await at(volume, 0.9);
  await page.mouse.click(point.x, point.y);
  await expect(volume).toHaveAttribute("aria-valuenow", "30");
});

test("under rtl the minimum is at the right and the keys swap", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const control = page.getByRole("slider", { name: "Volume" });
  const edge = async () =>
    control.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const thumb = el
        .shadowRoot!.querySelector('[part="thumb"]')!
        .getBoundingClientRect();
      return thumb.left + thumb.width / 2 - box.left - box.width / 2;
    });
  // 25 of 100: nearer the right end.
  expect(await edge()).toBeGreaterThan(0);
  await control.focus();
  await page.keyboard.press("ArrowLeft");
  expect(await now(control)).toBe("50");
  await page.keyboard.press("ArrowRight");
  expect(await now(control)).toBe("25");
  const point = await at(control, 0.1);
  await page.mouse.click(point.x, point.y);
  expect(Number(await now(control))).toBeGreaterThan(80);
});

test("tick marks are drawn from the ticks attribute", async ({ page }) => {
  await gotoStory(page, story("ticks"));
  const marks = page
    .locator("pl-slider")
    .first()
    .locator('[part="ticks"] > span');
  await expect(marks).toHaveCount(5);
});

test("the thumb keeps its focus ring under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const control = page.locator("#slider");
  await expect(control).toBeFocused();
  expect(
    await control.evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector('[part="thumb"]')!)
          .outlineStyle,
    ),
  ).not.toBe("none");
});

test("a slider without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("pl-slider");
    bare.id = "bare";
    el.append(bare);
  });
  await expect(page.locator("#bare")).toHaveAttribute("role", "slider");
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

test("virtual screen reader speaks the role, name and value", async ({
  page,
}) => {
  await gotoStory(page, story("values"));
  const spoken = await spokenPhrases(page);
  const phrase = spoken.find((p) => p.includes("Value 25"));
  expect(phrase).toContain("slider");
  expect(phrase).toContain("25");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every slider keeps a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, story("states"));
    for (const control of await page.locator("pl-slider").all()) {
      const box = (await control.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("a tap jumps the thumb and the track scrolls only vertically", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    const control = page.getByRole("slider", { name: "Volume" });
    const point = await at(control, 0.9);
    await page.touchscreen.tap(point.x, point.y);
    expect(Number(await now(control))).toBeGreaterThan(80);
    expect(
      await control.evaluate((el) => getComputedStyle(el).touchAction),
    ).toBe("pan-y");
  });

  test("a touch the browser takes over to scroll changes nothing", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "needs a DevTools touch cancel");
    await gotoStory(page, story("default"));
    const control = page.getByRole("slider", { name: "Volume" });
    await logEvents(control);
    const point = await at(control, 0.9);
    const touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    expect(await now(control)).toBe("50");
    expect(await events(page)).toEqual([]);
  });
});
