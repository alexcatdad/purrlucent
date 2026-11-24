import { expect, test, type Page } from "@playwright/test";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = "foundations-density--controls";

/** The border box and the type of each element the Density story measures. */
const measure = (page: Page) =>
  page.evaluate(() => {
    // A part is read inside the host's shadow root.
    const pick = (selector: string, part?: string) => {
      const host = document.querySelector(selector)!;
      const el = part
        ? host.shadowRoot!.querySelector(`[part=${part}]`)!
        : host;
      const { width, height } = el.getBoundingClientRect();
      const { fontSize, paddingInlineStart, paddingBlockStart, lineHeight } =
        getComputedStyle(el);
      return {
        width,
        height,
        fontSize,
        paddingInlineStart,
        paddingBlockStart,
        lineHeight,
      };
    };
    return {
      button: pick("pl-button"),
      input: pick("pl-input", "field"),
      select: pick("pl-select", "trigger"),
      cell: pick("pl-table tbody td"),
    };
  });

const open = async (page: Page, density: "compact" | "comfortable") => {
  await gotoStory(page, story, `density:${density}`);
  await expect(page.locator("pl-table tbody td").first()).toBeVisible();
  expect(
    await page.evaluate(() =>
      document.documentElement.getAttribute("data-pl-density"),
    ),
  ).toBe(density);
};

const menuItemHeight = async (page: Page) => {
  await page.getByRole("button", { name: "Edit" }).click();
  const item = page.getByRole("menuitem", { name: "Undo" });
  await expect(item).toBeVisible();
  return (await item.boundingBox())!.height;
};

test("comfortable density raises control, row and cell heights", async ({
  page,
}) => {
  await open(page, "comfortable");
  const m = await measure(page);
  expect(Math.abs(m.input.height - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.select.height - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.button.height - 38)).toBeLessThanOrEqual(1);
  expect(Math.abs((await menuItemHeight(page)) - 36)).toBeLessThanOrEqual(1);
  // The row is at least the md control height; the cell padding gives 12px.
  expect(m.cell.height).toBeGreaterThanOrEqual(37);
  expect(Number.parseFloat(m.cell.paddingBlockStart)).toBeCloseTo(12, 0);
  expect(Number.parseFloat(m.cell.lineHeight)).toBeCloseTo(20, 0);
});

test("compact density is the default", async ({ page }) => {
  await open(page, "compact");
  const m = await measure(page);
  expect(Math.abs(m.button.height - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs(m.input.height - 32)).toBeLessThanOrEqual(1);
});

test("comfortable density leaves widths, font sizes and horizontal padding", async ({
  page,
}) => {
  await open(page, "compact");
  const compact = await measure(page);
  await open(page, "comfortable");
  const comfortable = await measure(page);
  for (const key of ["button", "input", "select", "cell"] as const) {
    expect(comfortable[key].fontSize).toBe(compact[key].fontSize);
    expect(comfortable[key].paddingInlineStart).toBe(
      compact[key].paddingInlineStart,
    );
  }
  for (const key of ["input", "select", "cell"] as const)
    expect(
      Math.abs(comfortable[key].width - compact[key].width),
    ).toBeLessThanOrEqual(1);
});

test("a table's own density overrides the page's", async ({ page }) => {
  await open(page, "comfortable");
  const padding = (density: string | null) =>
    page.evaluate((value) => {
      const table = document.querySelector("pl-table")!;
      if (value === null) table.removeAttribute("density");
      else table.setAttribute("density", value);
      return getComputedStyle(table.querySelector("td")!).paddingBlockStart;
    }, density);
  expect(Number.parseFloat((await padding(null))!)).toBeCloseTo(12, 0);
  expect(Number.parseFloat((await padding("compact"))!)).toBeCloseTo(4, 0);
  expect(Number.parseFloat((await padding("regular"))!)).toBeCloseTo(8, 0);
});
