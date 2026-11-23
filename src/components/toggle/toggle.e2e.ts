import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `actions-toggle--${name}`;

/** Counts the pl-change events of `#toggle`, with the states they carry. */
const listen = (page: Page) =>
  page.locator("#toggle").evaluate((el) => {
    const seen: boolean[] = [];
    (window as unknown as { seen: boolean[] }).seen = seen;
    el.addEventListener("pl-change", (event) =>
      seen.push((event as CustomEvent<{ pressed: boolean }>).detail.pressed),
    );
  });

const changes = (page: Page) =>
  page.evaluate(() => (window as unknown as { seen: boolean[] }).seen);

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("states"));
  await expect(root).toMatchAriaSnapshot(`
    - button "Favorite"
    - button "Favorite" [pressed]
    - button "Favorite"
    - button "Favorite" [pressed]
  `);
});

test("a click, Enter and Space flip the state and fire pl-change", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await listen(page);
  const toggle = page.getByRole("button", { name: "Favorite" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("pressed", "");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(toggle).not.toHaveAttribute("pressed");
  await page.keyboard.press("Space");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("pressed", "");
  expect(await changes(page)).toEqual([true, false, true]);
});

test("setting pressed from script fires no pl-change", async ({ page }) => {
  await gotoStory(page, story("default"));
  await listen(page);
  await page
    .locator("#toggle")
    .evaluate(
      (el) => ((el as HTMLElement & { pressed: boolean }).pressed = true),
    );
  await expect(page.getByRole("button", { name: "Favorite" })).toBeVisible();
  await expect(page.locator("#toggle")).toHaveAttribute("aria-pressed", "true");
  expect(await changes(page)).toEqual([]);
});

test("the tab stop is the toggle and Tab reaches it", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.keyboard.press("Tab");
  await expect(page.locator("#toggle")).toBeFocused();
});

test("a disabled toggle takes no focus and does not change", async ({
  page,
}) => {
  await gotoStory(page, story("disabled"));
  const toggle = page.getByRole("button", { name: "Favorite" }).first();
  await toggle.click({ force: true });
  await expect(toggle).not.toHaveAttribute("pressed");
  await expect(toggle).toHaveAttribute("aria-disabled", "true");
  expect(await toggle.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(-1);
});

test("a disabled fieldset disables the toggle", async ({ page }) => {
  await gotoStory(page, story("in-fieldset"));
  const toggle = page.locator("#toggle");
  await expect(toggle).toHaveAttribute("aria-disabled", "true");
  await listen(page);
  await toggle.click({ force: true });
  expect(await changes(page)).toEqual([]);
  await page
    .locator("#fieldset")
    .evaluate((el) => ((el as HTMLFieldSetElement).disabled = false));
  await expect(toggle).not.toHaveAttribute("aria-disabled");
  await toggle.click();
  expect(await changes(page)).toEqual([false]);
});

test("the on state differs from the off state in face, text and icon fill", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const look = (i: number) =>
    page
      .locator("pl-toggle")
      .nth(i)
      .evaluate((el) => ({
        face: getComputedStyle(el, "::before").backgroundColor,
        color: getComputedStyle(el).color,
        fill: el.querySelector("svg")
          ? getComputedStyle(el.querySelector("svg")!).fill
          : null,
      }));
  const [off, on] = [await look(0), await look(1)];
  expect(on.face).not.toBe(off.face);
  expect(on.color).not.toBe(off.color);
  expect(off.fill).toBe("none");
  expect(on.fill).toBe(on.color);
});

test("an icon toggle is round and as wide as it is tall", async ({ page }) => {
  await gotoStory(page, story("sizes"));
  for (const toggle of await page.locator("pl-toggle[icon]").all()) {
    const box = (await toggle.boundingBox())!;
    expect(box.width).toBeCloseTo(box.height, 0);
  }
});

test("a pressed toggle shows Highlight under forced colors", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  await page.emulateMedia({ forcedColors: "active" });
  const face = (i: number) =>
    page
      .locator("pl-toggle")
      .nth(i)
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  expect(await face(1)).not.toBe(await face(0));
});

test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  await expect(page.locator("#toggle")).toBeFocused();
  expect(
    await page
      .locator("#toggle")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("under rtl the label and icon swap sides", async ({ page }) => {
  await gotoStory(page, story("states"), "dir:rtl");
  const side = await page
    .locator("pl-toggle")
    .first()
    .evaluate((el) => {
      const box = el.getBoundingClientRect();
      const icon = el.querySelector("svg")!.getBoundingClientRect();
      return icon.left + icon.width / 2 > box.left + box.width / 2;
    });
  expect(side).toBe(true);
});

test("an icon toggle without a label fails axe", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.evaluate((el) => {
    const bare = document.createElement("pl-toggle");
    bare.setAttribute("icon", "");
    el.append(bare);
  });
  await expect(expectAccessible(root)).rejects.toThrow();
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("sizes")));
});

test("virtual screen reader speaks the role, name and state", async ({
  page,
}) => {
  await gotoStory(page, story("states"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Favorite");
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every toggle keeps a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, story("sizes"));
    for (const toggle of await page.locator("pl-toggle").all()) {
      const box = (await toggle.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
