import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-breadcrumb--${name}`;

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - navigation "Breadcrumb":
      - list:
        - listitem:
          - link "Home"
        - listitem:
          - link "Documents"
        - listitem:
          - link "Reports"
        - listitem:
          - link "Quarterly review"
  `);
});

test("the landmark takes its name from label", async ({ page }) => {
  await gotoStory(page, story("text-steps"));
  await expect(page.getByRole("navigation", { name: "Location" })).toHaveCount(
    1,
  );
});

test("only the last item is the current page", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Quarterly review" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Home" })).not.toHaveAttribute(
    "aria-current",
  );
});

test("the last item moves when an item is added", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.locator("pl-breadcrumb").evaluate((el) => {
    const item = document.createElement("pl-breadcrumb-item");
    item.setAttribute("href", "#new");
    item.textContent = "Appendix";
    el.append(item);
  });
  await expect(page.getByRole("link", { name: "Appendix" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
});

test("the separators are hidden from assistive technology", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const separators = page
    .locator("pl-breadcrumb-item")
    .first()
    .locator('[part="separator"]');
  await expect(separators).toHaveAttribute("aria-hidden", "true");
  const last = page.locator("pl-breadcrumb-item").last();
  await expect(last.locator('[part="separator"]')).toHaveCount(0);
});

test("a long name is truncated and offers its full text", async ({ page }) => {
  await gotoStory(page, story("long-trail"));
  const link = page.getByRole("link", {
    name: "Recommendations for the next planning cycle",
  });
  await expect(link).toHaveAttribute(
    "title",
    "Recommendations for the next planning cycle",
  );
  expect(await link.evaluate((el) => getComputedStyle(el).textOverflow)).toBe(
    "ellipsis",
  );
  await expect(page.getByRole("link", { name: "Home" })).not.toHaveAttribute(
    "title",
  );
});

test("every link is a tab stop in reading order", async ({ page }) => {
  await gotoStory(page, story("default"));
  for (const name of ["Home", "Documents", "Reports", "Quarterly review"]) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name })).toBeFocused();
  }
});

test("a link meets the minimum hit height", async ({ page }) => {
  await gotoStory(page, story("default"));
  const height = await page
    .getByRole("link", { name: "Home" })
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(24);
});

test("items without an href are text, not links", async ({ page }) => {
  await gotoStory(page, story("text-steps"));
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("the chevron mirrors under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const transform = await page
    .locator("pl-breadcrumb-item")
    .first()
    .locator('[part="separator"]')
    .evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
});

test("the trail starts at the right under rtl", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  const [first, last] = await page
    .locator("pl-breadcrumb-item")
    .evaluateAll((els) => [
      els[0]!.getBoundingClientRect().left,
      els[els.length - 1]!.getBoundingClientRect().left,
    ]);
  expect(first!).toBeGreaterThan(last!);
});

test("the links keep system colors under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const [home, current] = await Promise.all(
    ["Home", "Quarterly review"].map((name) =>
      page
        .getByRole("link", { name })
        .evaluate((el) => getComputedStyle(el).color),
    ),
  );
  expect(home).not.toBe(current);
});

test("transitions are off with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  const duration = await page
    .getByRole("link", { name: "Home" })
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration).toBe("0s, 0s");
});

test("passes axe", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the landmark and the current page", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("navigation");
  expect(spoken).toContain("Breadcrumb");
  expect(spoken).toContain("Quarterly review");
});
