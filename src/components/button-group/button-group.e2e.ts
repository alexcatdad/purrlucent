import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "actions-button-group--default";

const stories = [
  "default",
  "vertical",
  "sizes",
  "disabled-button",
  "icons",
  "glass",
];

/** The four corner radii of each button, in order: start-start, start-end, end-end, end-start. */
const radii = (page: import("@playwright/test").Page) =>
  page.locator("pl-button").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return [
        s.borderStartStartRadius,
        s.borderStartEndRadius,
        s.borderEndEndRadius,
        s.borderEndStartRadius,
      ].map((r) => parseFloat(r));
    }),
  );

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story);
  await expect(root).toMatchAriaSnapshot(`
    - group "Document actions":
      - button "Cut"
      - button "Copy"
      - button "Paste"
  `);
});

for (const id of stories) {
  test(`axe finds no WCAG 2.2 AA violations in ${id}`, async ({ page }) => {
    await expectAccessible(
      await gotoStory(page, `actions-button-group--${id}`),
    );
  });
}

test("an icon button is named by aria-label inside the group", async ({
  page,
}) => {
  const root = await gotoStory(page, "actions-button-group--icons");
  await expect(root).toMatchAriaSnapshot(`
    - group "Text alignment":
      - button "Align left"
      - button "Align center"
      - button "Align right"
  `);
});

test("a horizontal group rounds only the outer ends", async ({ page }) => {
  await gotoStory(page, story);
  const [first, middle, last] = await radii(page);
  expect(first![0]).toBeGreaterThan(0);
  expect(first![3]).toBeGreaterThan(0);
  expect(first![1]).toBe(0);
  expect(first![2]).toBe(0);
  expect(middle).toEqual([0, 0, 0, 0]);
  expect(last![1]).toBeGreaterThan(0);
  expect(last![2]).toBeGreaterThan(0);
  expect(last![0]).toBe(0);
  expect(last![3]).toBe(0);
});

test("a vertical group stacks the buttons and rounds the top and bottom", async ({
  page,
}) => {
  await gotoStory(page, "actions-button-group--vertical");
  const boxes = await page
    .locator("pl-button")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
  expect(boxes[1]!.top).toBeCloseTo(boxes[0]!.bottom, 0);
  expect(boxes[1]!.left).toBeCloseTo(boxes[0]!.left, 0);
  const [first, middle, last] = await radii(page);
  expect(first![0]).toBeGreaterThan(0);
  expect(first![1]).toBeGreaterThan(0);
  expect(first![2]).toBe(0);
  expect(middle).toEqual([0, 0, 0, 0]);
  expect(last![2]).toBeGreaterThan(0);
  expect(last![3]).toBeGreaterThan(0);
  expect(last![0]).toBe(0);
});

test("the buttons touch with no gap", async ({ page }) => {
  await gotoStory(page, story);
  const boxes = await page
    .locator("pl-button")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
  expect(boxes[1]!.left).toBeCloseTo(boxes[0]!.right, 0);
  expect(boxes[2]!.left).toBeCloseTo(boxes[1]!.right, 0);
});

test("each button is its own tab stop", async ({ page }) => {
  await gotoStory(page, story);
  for (const name of ["Cut", "Copy", "Paste"]) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name })).toBeFocused();
  }
});

test("the focused button's ring is not covered by its neighbour", async ({
  page,
}) => {
  await gotoStory(page, story);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(
    await page
      .getByRole("button", { name: "Copy" })
      .evaluate((el) => getComputedStyle(el).zIndex),
  ).toBe("1");
});

test("a disabled button in the group takes no focus", async ({ page }) => {
  await gotoStory(page, "actions-button-group--disabled-button");
  await expect(page.getByRole("button", { name: "Copy" })).toBeDisabled();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Paste" })).toBeFocused();
});

test("an aria-label set by the consumer names the group", async ({ page }) => {
  const root = await gotoStory(page, story);
  await root.evaluate((el) => {
    const group = document.createElement("pl-button-group");
    group.setAttribute("aria-label", "Alignment");
    group.innerHTML = "<pl-button>A</pl-button>";
    el.append(group);
  });
  await expect(page.getByRole("group", { name: "Alignment" })).toBeVisible();
});

test("changing label renames the group and clearing it removes the name", async ({
  page,
}) => {
  await gotoStory(page, story);
  const group = page.locator("#control");
  await group.evaluate(async (el) => {
    (el as unknown as { label: string }).label = "Edit";
    await (el as unknown as { updateComplete: Promise<boolean> })
      .updateComplete;
  });
  await expect(page.getByRole("group", { name: "Edit" })).toBeVisible();
  await group.evaluate(async (el) => {
    (el as unknown as { label: string }).label = "";
    await (el as unknown as { updateComplete: Promise<boolean> })
      .updateComplete;
  });
  await expect(group).not.toHaveAttribute("aria-label");
});

test("under rtl the first button is on the right", async ({ page }) => {
  await gotoStory(page, "actions-button-group--rtl");
  const [cut, paste] = await Promise.all(
    ["Cut", "Paste"].map((name) =>
      page.getByRole("button", { name }).boundingBox(),
    ),
  );
  expect(cut!.x).toBeGreaterThan(paste!.x);
  const [first, , last] = await radii(page);
  // The outer ends are the first button's start and the last button's end.
  expect(first![0]).toBeGreaterThan(0);
  expect(first![1]).toBe(0);
  expect(last![1]).toBeGreaterThan(0);
  expect(last![0]).toBe(0);
});

test("the buttons share one outline under forced colors", async ({ page }) => {
  await gotoStory(page, story);
  await page.emulateMedia({ forcedColors: "active" });
  // The second button overlaps the first by the 1px border.
  await expect
    .poll(async () => {
      const [a, b] = await page
        .locator("pl-button")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
      return Math.round(a!.right - b!.left);
    })
    .toBe(1);
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story));
});
