import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `navigation-navigation-menu--${name}`;

const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const link = (page: Page, name: string) =>
  page.getByRole("link", { name, exact: true });

/** The panel of an item, by the item's id. */
const panel = (page: Page, id: string) =>
  page.locator(`#${id}`).evaluate((el) => {
    const box = el.shadowRoot!.querySelector("[part=panel]")!;
    return { open: box.matches(":popover-open") };
  });

test("the menu is a navigation landmark with the given label", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

test("aria snapshot, closed and open", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - navigation "Main":
      - link "Home"
      - button "Products" [expanded=false]
      - button "Company" [expanded=false]
      - link "Contact"
  `);
  await button(page, "Products").click();
  await expect(root).toMatchAriaSnapshot(`
    - navigation "Main":
      - link "Home"
      - button "Products" [expanded]
      - link "Overview"
      - link "Pricing"
      - link "Changelog"
      - button "Company" [expanded=false]
      - link "Contact"
  `);
});

test("it follows the disclosure pattern, not the menu pattern", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.getByRole("menuitem")).toHaveCount(0);
  await expect(button(page, "Products")).not.toHaveAttribute("aria-haspopup");
});

test("the disclosure button names the panel it controls", async ({ page }) => {
  await gotoStory(page, story("default"));
  const controlled = await page.locator("#products").evaluate((el) => {
    const id = el
      .shadowRoot!.querySelector("button")!
      .getAttribute("aria-controls");
    return el.shadowRoot!.getElementById(id!)?.getAttribute("part");
  });
  expect(controlled).toBe("panel");
});

test("a press opens the panel, focus stays on the button, and a second press closes it", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  expect((await panel(page, "products")).open).toBe(false);
  await button(page, "Products").click();
  await expect(link(page, "Overview")).toBeVisible();
  await expect(button(page, "Products")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(button(page, "Products")).toBeFocused();
  await button(page, "Products").click();
  await expect(link(page, "Overview")).toBeHidden();
  await expect(button(page, "Products")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("Enter and Space on the button open the panel", async ({ page }) => {
  await gotoStory(page, story("default"));
  for (const key of ["Enter", "Space"]) {
    await button(page, "Products").focus();
    await page.keyboard.press(key);
    await expect(link(page, "Overview")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(link(page, "Overview")).toBeHidden();
  }
});

test("every link and button is a tab stop, and Tab enters an open panel", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await link(page, "Home").focus();
  await page.keyboard.press("Tab");
  await expect(button(page, "Products")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(link(page, "Overview")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link(page, "Pricing")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link(page, "Changelog")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(button(page, "Company")).toBeFocused();
  await expect(link(page, "Overview")).toBeHidden();
});

test("a closed panel's links are not tab stops", async ({ page }) => {
  await gotoStory(page, story("default"));
  await button(page, "Products").focus();
  await page.keyboard.press("Tab");
  await expect(button(page, "Company")).toBeFocused();
});

test("the arrow keys do not move between items", async ({ page }) => {
  await gotoStory(page, story("default"));
  await link(page, "Home").focus();
  await page.keyboard.press("ArrowRight");
  await expect(link(page, "Home")).toBeFocused();
});

test("Escape in the panel closes it and focus returns to the button", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await button(page, "Products").click();
  await link(page, "Pricing").focus();
  await page.keyboard.press("Escape");
  await expect(link(page, "Pricing")).toBeHidden();
  await expect(button(page, "Products")).toBeFocused();
});

test("Escape on the button of an open panel closes it", async ({ page }) => {
  await gotoStory(page, story("default"));
  await button(page, "Products").click();
  await page.keyboard.press("Escape");
  await expect(link(page, "Overview")).toBeHidden();
  await expect(button(page, "Products")).toBeFocused();
});

test("a press outside closes the panel", async ({ page }) => {
  await gotoStory(page, story("open"));
  await expect(link(page, "Overview")).toBeVisible();
  await page.mouse.click(5, 400);
  await expect(link(page, "Overview")).toBeHidden();
});

test("a press inside the panel keeps it open", async ({ page }) => {
  await gotoStory(page, story("open"));
  await link(page, "Overview").click();
  await expect(link(page, "Pricing")).toBeVisible();
});

test("Tab out of the last link closes the panel and moves on", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await button(page, "Company").click();
  await page.keyboard.press("Tab");
  await expect(link(page, "About")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link(page, "Careers")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(link(page, "Contact")).toBeFocused();
  await expect(link(page, "About")).toBeHidden();
});

test("opening one panel closes the other", async ({ page }) => {
  await gotoStory(page, story("open"));
  await button(page, "Company").click();
  await expect(link(page, "About")).toBeVisible();
  await expect(link(page, "Overview")).toBeHidden();
  await expect(button(page, "Products")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("an item fires pl-toggle with its state, and not for a panel that starts open", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  await page.evaluate(() => {
    (window as never as { toggles: boolean[] }).toggles = [];
    document.addEventListener("pl-toggle", (e) =>
      (window as never as { toggles: boolean[] }).toggles.push(
        (e as CustomEvent<{ open: boolean }>).detail.open,
      ),
    );
  });
  await button(page, "Products").click();
  await button(page, "Products").click();
  expect(
    await page.evaluate(
      () => (window as never as { toggles: boolean[] }).toggles,
    ),
  ).toEqual([false, true]);
});

test("the current link has aria-current page and the current section's button is marked", async ({
  page,
}) => {
  await gotoStory(page, story("current"));
  await expect(page.locator("#nav")).toBeVisible();
  await expect(link(page, "Pricing")).toHaveAttribute("aria-current", "page");
  await expect(button(page, "Products")).toHaveAttribute(
    "aria-current",
    "true",
  );
  await gotoStory(page, story("default"));
  await expect(link(page, "Home")).toHaveAttribute("aria-current", "page");
});

test("a menu without a label logs a warning and has no aria-label", async ({
  page,
}) => {
  const logged: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "warning") logged.push(m.text());
  });
  await gotoStory(page, story("no-label"));
  await page.locator("#nav").waitFor();
  expect(logged).toContain("pl-navigation-menu needs a label.");
  await expect(page.locator("#nav")).not.toHaveAttribute("aria-label");
});

test("a panel opens below its button, aligned to its start edge", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const { control, box } = await page.locator("#products").evaluate((el) => ({
    control: el
      .shadowRoot!.querySelector("[part=control]")!
      .getBoundingClientRect()
      .toJSON(),
    box: el
      .shadowRoot!.querySelector("[part=panel]")!
      .getBoundingClientRect()
      .toJSON(),
  }));
  expect(box.top).toBeGreaterThanOrEqual(control.bottom);
  expect(Math.abs(box.left - control.left)).toBeLessThan(2);
});

test("under rtl the panel aligns to the button's end edge", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const { control, box } = await page.locator("#products").evaluate((el) => ({
    control: el
      .shadowRoot!.querySelector("[part=control]")!
      .getBoundingClientRect()
      .toJSON(),
    box: el
      .shadowRoot!.querySelector("[part=panel]")!
      .getBoundingClientRect()
      .toJSON(),
  }));
  expect(Math.abs(box.right - control.right)).toBeLessThan(2);
});

test("the panel stays inside the viewport on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await gotoStory(page, story("open"));
  const box = await page
    .locator("#products")
    .evaluate((el) =>
      el
        .shadowRoot!.querySelector("[part=panel]")!
        .getBoundingClientRect()
        .toJSON(),
    );
  expect(box.left).toBeGreaterThanOrEqual(0);
  expect(box.right).toBeLessThanOrEqual(320);
});

for (const name of [
  "default",
  "open",
  "current",
  "solid-dark-rtl",
  "glass-dark-rtl",
  "glass-contrast",
]) {
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the landmark and every item", async ({
  page,
}) => {
  await gotoStory(page, story("open"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  for (const text of [
    "navigation",
    "Main",
    "Home",
    "Products",
    "Overview",
    "Company",
    "Contact",
  ])
    expect(spoken).toContain(text);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every control and panel link is at least 44 by 44", async ({
    page,
  }) => {
    await gotoStory(page, story("open"));
    const boxes = await page
      .locator("#nav a, #nav button, #nav pl-navigation-item")
      .evaluateAll((els) =>
        els.flatMap((el) => {
          const target =
            el.localName === "pl-navigation-item"
              ? el.shadowRoot!.querySelector("[part=control]")!
              : el;
          // Links in a closed panel are display:none; measure rendered ones only.
          if (!target.getClientRects().length) return [];
          const box = target.getBoundingClientRect();
          return [[box.width, box.height]];
        }),
      );
    expect(boxes.length).toBeGreaterThan(6);
    for (const [width, height] of boxes) {
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });
});

test("the panel has an edge under forced colors", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.emulateMedia({ forcedColors: "active" });
  const style = await page
    .locator("#products")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector("[part=panel]")!)
          .borderTopStyle,
    );
  expect(style).toBe("solid");
});

test("the panel has no transition under reduced motion", async ({ page }) => {
  await gotoStory(page, story("open"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page
    .locator("#products")
    .evaluate(
      (el) =>
        getComputedStyle(el.shadowRoot!.querySelector("[part=panel]")!)
          .transitionDuration,
    );
  expect(duration).toBe("0s");
});

test("the panel has a backdrop blur under glass and none when solid", async ({
  page,
}) => {
  const filter = () =>
    page
      .locator("#products")
      .evaluate(
        (el) =>
          getComputedStyle(el.shadowRoot!.querySelector("[part=panel]")!)
            .backdropFilter,
      );
  await gotoStory(page, story("open"));
  expect(await filter()).toBe("none");
  await gotoStory(page, story("open"), "material:glass");
  // The frost stays on the face. A visible texture carries the displacement.
  await expect.poll(filter).toMatch(/blur\([\d.]+px\) saturate\(/);
});
