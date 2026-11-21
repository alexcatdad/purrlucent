import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const stories = [
  "default",
  "variants",
  "sizes",
  "destructive",
  "disabled",
  "glass",
];
const labels = ["Duplicate", "Save", "Share", "Cancel"];

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, "components-button--variants");
  await expect(root).toMatchAriaSnapshot(`
    - button "Duplicate"
    - button "Save"
    - button "Share"
    - button "Cancel"
  `);
});

test("an icon button takes its name from aria-label", async ({ page }) => {
  const root = await gotoStory(page, "components-button--sizes");
  await expect(
    root.getByRole("button", { name: "Add", exact: true }),
  ).toHaveCount(3);
});

test("a disabled button is exposed as disabled", async ({ page }) => {
  const root = await gotoStory(page, "components-button--disabled");
  await expect(root.getByRole("button", { name: "Cancel" })).toBeDisabled();
});

for (const id of stories) {
  test(`axe finds no WCAG 2.2 AA violations in ${id}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, `components-button--${id}`));
  });
}

test("a button without label text fails axe", async ({ page }) => {
  const root = await gotoStory(page, "components-button--default");
  await root.evaluate((el) => {
    const empty = document.createElement("purr-button");
    empty.id = "empty";
    el.append(empty);
  });
  const { violations } = await new AxeBuilder({ page })
    .include("#empty")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(violations.map((v) => v.id)).toContain("aria-command-name");
});

test("a destructive button is never styled as the prominent button", async ({
  page,
}) => {
  await gotoStory(page, "components-button--destructive");
  const background = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  const primary = await page.evaluate(() => {
    const el = document.createElement("purr-button");
    el.setAttribute("variant", "primary");
    document.body.append(el);
    const color = getComputedStyle(el, "::before").backgroundColor;
    el.remove();
    return color;
  });
  expect(await background("destructive-primary")).not.toBe(primary);
  expect(await background("destructive-primary")).toBe(
    await background("destructive-tinted"),
  );
});

test("a submit button submits its form and a reset button resets it", async ({
  page,
}) => {
  await gotoStory(page, "components-button--in-form");
  await page.locator("#form").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute("data-submitted", "");
    });
  });
  const title = page.getByRole("textbox", { name: "Title" });
  await title.fill("Changed");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(title).toHaveValue("Draft");
  await expect(page.locator("#form")).not.toHaveAttribute("data-submitted");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("#form")).toHaveAttribute("data-submitted");
});

test("each size is taller than the one before", async ({ page }) => {
  await gotoStory(page, "components-button--sizes");
  const heights = await page
    .locator("purr-button:not([icon])")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(3);
});

test("an icon button is as wide as it is tall", async ({ page }) => {
  await gotoStory(page, "components-button--sizes");
  for (const button of await page.locator("purr-button[icon]").all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBe(box!.height);
  }
});

test("the pressed state is visible on the button", async ({ page }) => {
  // Zero durations, so each face tone is read without waiting for a transition.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, "components-button--default");
  const button = page.locator("#button");
  const face = () =>
    button.evaluate((el) => getComputedStyle(el, "::before").backgroundColor);
  await button.hover();
  const resting = await face();
  await page.mouse.down();
  expect(await face()).not.toBe(resting);
  await page.mouse.up();
  expect(await face()).toBe(resting);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await gotoStory(page, "components-button--variants"),
  );
});

test("virtual screen reader speaks each button", async ({ page }) => {
  await gotoStory(page, "components-button--variants");
  const spoken = (await spokenPhrases(page)).join(" ");
  for (const label of labels) expect(spoken).toContain(label);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every button keeps a 44 by 44 hit area", async ({ page }) => {
    for (const id of ["variants", "sizes"]) {
      await gotoStory(page, `components-button--${id}`);
      for (const button of await page.locator("purr-button").all()) {
        const box = await button.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test("the focus ring stays visible under forced colors", async ({ page }) => {
  await gotoStory(page, "components-button--variants");
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  const button = page.locator("purr-button").first();
  await expect(button).toBeFocused();
  expect(
    await button.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

forEachViewport(({ name }) => {
  for (const id of stories.slice(1)) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, `components-button--${id}`);
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
