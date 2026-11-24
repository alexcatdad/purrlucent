import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "containers-accordion--default";

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.locator("pl-accordion-item").first()).toBeVisible();
  return root;
};

const header = (page: Page, name: string) => page.getByRole("button", { name });

const openValues = (page: Page) =>
  page
    .locator("pl-accordion-item")
    .evaluateAll((items) =>
      items
        .filter((i) => (i as HTMLElement & { open: boolean }).open)
        .map((i) => (i as HTMLElement & { value: string }).value),
    );

test("aria snapshot", async ({ page }) => {
  const root = await open(page);
  await expect(root).toMatchAriaSnapshot(`
    - heading "Shipping" [level=3]:
      - button "Shipping" [expanded=false]
    - heading "Returns" [level=3]:
      - button "Returns" [expanded=false]
    - heading "Warranty" [level=3]:
      - button "Warranty" [expanded=false]
  `);
});

test("a click opens a section and the next click closes it; pl-toggle carries value and open", async ({
  page,
}) => {
  await open(page);
  await page.locator("#control").evaluate((el) => {
    (window as unknown as { toggles: unknown[] }).toggles = [];
    el.addEventListener("pl-toggle", (e) =>
      (window as unknown as { toggles: unknown[] }).toggles.push(
        (e as CustomEvent).detail,
      ),
    );
  });
  await header(page, "Returns").click();
  await expect(header(page, "Returns")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByText("Send an item back")).toBeVisible();
  await header(page, "Returns").click();
  await expect(header(page, "Returns")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.getByText("Send an item back")).toBeHidden();
  expect(
    await page.evaluate(
      () => (window as unknown as { toggles: unknown[] }).toggles,
    ),
  ).toEqual([
    { value: "returns", open: true },
    { value: "returns", open: false },
  ]);
});

test("Enter and Space toggle the focused header", async ({ page }) => {
  await open(page);
  await header(page, "Shipping").focus();
  await page.keyboard.press("Enter");
  await expect(header(page, "Shipping")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.keyboard.press("Space");
  await expect(header(page, "Shipping")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("opening a section closes the others", async ({ page }) => {
  await open(page, "containers-accordion--preselected");
  expect(await openValues(page)).toEqual(["returns"]);
  await header(page, "Warranty").click();
  await expect(header(page, "Returns")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(await openValues(page)).toEqual(["warranty"]);
});

test("multiple keeps several sections open", async ({ page }) => {
  await open(page, "containers-accordion--multiple");
  expect(await openValues(page)).toEqual(["shipping", "returns"]);
  await header(page, "Warranty").click();
  await expect(header(page, "Warranty")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(await openValues(page)).toEqual(["shipping", "returns", "warranty"]);
});

test("every header is a tab stop; arrows, Home and End move between headers", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(header(page, "Shipping")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(header(page, "Returns")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(header(page, "Warranty")).toBeFocused();
  await page.keyboard.press("ArrowDown"); // wraps to the first
  await expect(header(page, "Shipping")).toBeFocused();
  await page.keyboard.press("ArrowUp"); // wraps to the last
  await expect(header(page, "Warranty")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(header(page, "Shipping")).toBeFocused();
  await page.keyboard.press("End");
  await expect(header(page, "Warranty")).toBeFocused();
  // Moving focus opens nothing.
  expect(await openValues(page)).toEqual([]);
});

test("arrow keys inside a panel do not move between headers", async ({
  page,
}) => {
  await open(page, "containers-accordion--preselected");
  await page.locator("[value=returns]").evaluate((el) => {
    const input = document.createElement("input");
    input.id = "inside";
    el.append(input);
  });
  await page.locator("#inside").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Home");
  await expect(page.locator("#inside")).toBeFocused();
});

test("a disabled section is skipped by arrows and ignores clicks", async ({
  page,
}) => {
  await open(page, "containers-accordion--disabled-item");
  await expect(header(page, "Returns")).toBeDisabled();
  await header(page, "Shipping").focus();
  await page.keyboard.press("ArrowDown"); // skips Returns
  await expect(header(page, "Warranty")).toBeFocused();
  await header(page, "Returns").click({ force: true });
  expect(await openValues(page)).toEqual([]);
});

test("each header is a button that names its panel, and a closed panel is hidden", async ({
  page,
}) => {
  await open(page, "containers-accordion--preselected");
  const ids = await page.locator("[value=returns]").evaluate((el) => {
    const root = el.shadowRoot!;
    const button = root.querySelector("button")!;
    const panel = root.querySelector("[part=panel]")!;
    return [
      button.getAttribute("aria-controls"),
      panel.id,
      panel.getAttribute("role"),
      panel.getAttribute("aria-label"),
    ];
  });
  // The region takes the heading text as aria-label: Firefox crashes naming it
  // through aria-labelledby into a button that holds a slot.
  expect(ids).toEqual(["panel", "panel", "region", "Returns"]);
  await expect(page.getByRole("region", { name: "Returns" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Shipping" })).toHaveCount(0);
});

test("the heading level follows the level attribute", async ({ page }) => {
  await open(page, "containers-accordion--heading-level");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(2);
});

test("a heading slot names the button", async ({ page }) => {
  await open(page, "containers-accordion--rich-heading");
  await expect(
    page.getByRole("button", { name: "Shipping (free over 50)" }),
  ).toBeVisible();
});

test("the arrow points to the end when closed and down when open, mirrored under rtl", async ({
  page,
}) => {
  await open(page, "containers-accordion--preselected");
  const turn = (value: string) =>
    page
      .locator(`[value=${value}]`)
      .evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector(".chevron")!).transform,
      );
  await expect.poll(() => turn("shipping")).toBe("none");
  await expect.poll(() => turn("returns")).toMatch(/^matrix\(0, 1, -1, 0/);
  await open(page, "containers-accordion--rtl");
  await expect
    .poll(() =>
      page
        .locator("[value=shipping]")
        .evaluate(
          (el) =>
            getComputedStyle(el.shadowRoot!.querySelector(".chevron")!)
              .transform,
        ),
    )
    .toMatch(/^matrix\(-1, 0, 0, 1/);
});

test("under rtl the text starts on the right", async ({ page }) => {
  await open(page, "containers-accordion--rtl");
  const [button, item] = await page
    .locator("[value=shipping]")
    .evaluate((el) => [
      el.shadowRoot!.querySelector("button")!.getBoundingClientRect().right,
      el.getBoundingClientRect().right,
    ]);
  expect(Math.abs(button! - item!)).toBeLessThanOrEqual(0.5);
  const chevron = await page
    .locator("[value=shipping]")
    .evaluate(
      (el) =>
        el.shadowRoot!.querySelector(".chevron")!.getBoundingClientRect().right,
    );
  expect(chevron).toBeGreaterThan(item! / 2);
});

test("reduced motion turns the transitions off", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const durations = await page.locator("[value=shipping]").evaluate((el) =>
    [".chevron", ".panel"].map(
      (s) =>
        getComputedStyle(el.shadowRoot!.querySelector(s)!)
          .transitionProperty === "none" ||
        getComputedStyle(el.shadowRoot!.querySelector(s)!)
          .transitionDuration.split(",")
          .every((d) => parseFloat(d) === 0),
    ),
  );
  expect(durations).toEqual([true, true]);
});

test("under forced colors the focus ring stays solid", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(header(page, "Shipping")).toBeFocused();
  expect(
    await header(page, "Shipping").evaluate(
      (el) => getComputedStyle(el).outlineStyle,
    ),
  ).toBe("solid");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer on a wide screen keeps each header at 44 high", async ({
    page,
  }) => {
    await open(page);
    for (const name of ["Shipping", "Returns", "Warranty"]) {
      const box = await header(page, name).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(
      await open(page, "containers-accordion--preselected", globals),
    );
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await open(page, "containers-accordion--preselected"),
  );
});
