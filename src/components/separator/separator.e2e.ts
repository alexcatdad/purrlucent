import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-separator--${name}`;

test("aria snapshot: a semantic separator is exposed", async ({ page }) => {
  const root = await gotoStory(page, story("semantic"));
  await expect(root).toMatchAriaSnapshot(`
    - paragraph: Account
    - separator
    - paragraph: Notifications
  `);
});

test("by default it is decoration with role none", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(page.locator("#rule")).toHaveAttribute("role", "none");
  await expect(page.locator("#rule")).not.toHaveAttribute("aria-orientation");
  await expect(root.getByRole("separator")).toHaveCount(0);
});

test("semantic sets role separator and aria-orientation", async ({ page }) => {
  await gotoStory(page, story("semantic"));
  await expect(page.locator("#rule")).toHaveAttribute("role", "separator");
  await expect(page.locator("#rule")).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  await page.locator("#rule").evaluate((el) => {
    el.setAttribute("orientation", "vertical");
  });
  await expect(page.locator("#rule")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
});

test("a horizontal rule is one hairline wide as the container", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const rule = page.locator("#rule");
  const box = (await rule.boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(1);
  expect(box.width).toBeGreaterThan(100);
  await expect(rule).toHaveCSS("border-top-width", "1px");
});

test("a vertical rule is one hairline wide and as tall as its row", async ({
  page,
}) => {
  await gotoStory(page, story("vertical"));
  const rule = (await page.locator("#rule").boundingBox())!;
  const text = (await page.getByText("Docs").boundingBox())!;
  expect(rule.width).toBeLessThanOrEqual(1);
  expect(rule.height).toBeGreaterThanOrEqual(text.height - 1);
});

test("the line uses the border token", async ({ page }) => {
  await gotoStory(page, story("default"));
  const colors = await page.locator("#rule").evaluate((el) => {
    const probe = document.createElement("div");
    probe.style.color = "var(--pl-color-border)";
    el.parentElement!.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(el).borderTopColor, token];
  });
  expect(colors[0]).toBe(colors[1]);
});

test("under rtl a vertical rule still sits between the words", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const rule = (await page.locator("#rule").boundingBox())!;
  const docs = (await page.getByText("Docs").boundingBox())!;
  const blog = (await page.getByText("Blog").boundingBox())!;
  expect(docs.x).toBeGreaterThan(rule.x);
  expect(blog.x + blog.width).toBeLessThan(rule.x + 1);
});

test("the line keeps a visible color under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const color = await page
    .locator("#rule")
    .evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(color).not.toBe("rgba(0, 0, 0, 0)");
});

test("a semantic separator passes axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("semantic")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the separator only when semantic", async ({
  page,
}) => {
  await gotoStory(page, story("semantic"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("separator");
});
