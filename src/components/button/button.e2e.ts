import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { forEachViewport } from "../../../e2e/helpers/matrix.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const stories = ["default", "variants", "destructive", "disabled", "glass"];

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, "components-button--variants");
  await expect(root).toMatchAriaSnapshot(`
    - button "plain"
    - button "bordered"
    - button "prominent"
  `);
});

test("a disabled button is exposed as disabled", async ({ page }) => {
  const root = await gotoStory(page, "components-button--disabled");
  await expect(root.getByRole("button", { name: "plain" })).toBeDisabled();
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
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  const prominent = await page.evaluate(() => {
    const el = document.createElement("purr-button");
    el.setAttribute("variant", "prominent");
    document.body.append(el);
    const color = getComputedStyle(el).backgroundColor;
    el.remove();
    return color;
  });
  expect(await background("destructive-prominent")).not.toBe(prominent);
  expect(await background("destructive-prominent")).toBe(
    await background("destructive-bordered"),
  );
});

test("the pressed state is visible on the button", async ({ page }) => {
  await gotoStory(page, "components-button--default");
  const button = page.locator("#button");
  const opacity = () => button.evaluate((el) => getComputedStyle(el).opacity);
  await button.hover();
  const resting = await opacity();
  await page.mouse.down();
  expect(await opacity()).not.toBe(resting);
  await page.mouse.up();
  expect(await opacity()).toBe(resting);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await gotoStory(page, "components-button--variants"),
  );
});

test("virtual screen reader speaks each button", async ({ page }) => {
  await gotoStory(page, "components-button--variants");
  const spoken = (await spokenPhrases(page)).join(" ");
  for (const label of ["plain", "bordered", "prominent"])
    expect(spoken).toContain(label);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("every button keeps a 44 by 44 hit area", async ({ page }) => {
    await gotoStory(page, "components-button--variants");
    for (const button of await page.locator("purr-button").all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
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
  for (const id of ["variants", "destructive", "disabled", "glass"]) {
    test(`screenshot of ${id} at ${name}`, async ({ page }) => {
      const root = await gotoStory(page, `components-button--${id}`);
      await expect(root).toHaveScreenshot(`${id}-${name}.png`);
    });
  }
});
