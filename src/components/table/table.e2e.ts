import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "data-table--default";

const open = async (page: import("@playwright/test").Page, id = story) => {
  const root = await gotoStory(page, id);
  await expect(page.locator("pl-table table")).toHaveCount(1);
  return root;
};

test("aria snapshot keeps native table semantics", async ({ page }) => {
  const root = await open(page);
  await expect(root).toMatchAriaSnapshot(`
    - table "Pioneers":
      - rowgroup:
        - row "Name Role Age":
          - columnheader "Name"
          - columnheader "Role"
          - columnheader "Age"
      - rowgroup:
        - row "Ada Lovelace Mathematician 36":
          - rowheader "Ada Lovelace"
          - cell "Mathematician"
          - cell "36"
  `);
});

test("a static table is not a grid", async ({ page }) => {
  await open(page);
  await expect(page.locator("pl-table [role=grid]")).toHaveCount(0);
  await expect(page.locator("pl-table table")).not.toHaveAttribute("role");
});

test("the table rules reach the native cells", async ({ page }) => {
  await open(page);
  const style = await page
    .locator("pl-table td")
    .first()
    .evaluate((el) => {
      const { borderBottomStyle, paddingInlineStart } = getComputedStyle(el);
      return { borderBottomStyle, paddingInlineStart };
    });
  expect(style.borderBottomStyle).toBe("solid");
  expect(style.paddingInlineStart).not.toBe("0px");
});

test("a table that fits has no tab stop", async ({ page }) => {
  await open(page);
  await expect(page.locator("pl-table >> [part=scroller]")).not.toHaveAttribute(
    "tabindex",
  );
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.localName)).not.toBe(
    "pl-table",
  );
});

test("grouped headers keep their column spans", async ({ page }) => {
  const root = await open(page, "data-table--grouped-headers");
  const spans = await page.locator("pl-table thead th").evaluateAll((cells) =>
    cells.map((cell) => {
      const { colSpan, rowSpan } = cell as HTMLTableCellElement;
      return [colSpan, rowSpan];
    }),
  );
  expect(spans).toEqual([
    [1, 2],
    [2, 1],
    [2, 1],
    [1, 1],
    [1, 1],
    [1, 1],
    [1, 1],
  ]);
  await expectAccessible(root);
});

test("merged cells keep their spans", async ({ page }) => {
  const root = await open(page, "data-table--merged-cells");
  const spans = await page
    .locator("pl-table tbody th")
    .evaluateAll((cells) =>
      cells.map((cell) => (cell as HTMLTableCellElement).rowSpan),
    );
  expect(spans).toEqual([2, 2]);
  // The second row of a merged group has one cell fewer than the first.
  const rows = page.locator("pl-table tbody tr");
  await expect(rows.nth(0).locator("th, td")).toHaveCount(3);
  await expect(rows.nth(1).locator("th, td")).toHaveCount(2);
  await expectAccessible(root);
});

test("an overflowing table is a named region the keyboard reaches and scrolls", async ({
  page,
}) => {
  await open(page, "data-table--overflow");
  const scroller = page.getByRole("region", { name: "Pioneers" });
  await expect(scroller).toHaveAttribute("tabindex", "0");
  await page.keyboard.press("Tab");
  await expect(scroller).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => scroller.evaluate((el) => Math.abs(el.scrollLeft)))
    .toBeGreaterThan(0);
});

test("label names the scroll area when there is no caption", async ({
  page,
}) => {
  await open(page, "data-table--labelled");
  await expect(page.getByRole("region", { name: "Pioneers" })).toBeVisible();
});

test("the sticky header stays at the top of the scroll area", async ({
  page,
}) => {
  await open(page, "data-table--sticky-header");
  const scroller = page.getByRole("region", { name: "Pioneers" });
  await scroller.evaluate((el) => (el.scrollTop = 40));
  const header = page.getByRole("columnheader", { name: "Name" });
  const [top, area] = await Promise.all([
    header.boundingBox(),
    scroller.boundingBox(),
  ]);
  expect(Math.abs(top!.y - area!.y)).toBeLessThanOrEqual(3);
});

test("under rtl the first column is on the right", async ({ page }) => {
  await open(page, "data-table--rtl");
  const [name, role] = await Promise.all(
    ["Name", "Role"].map((n) =>
      page.getByRole("columnheader", { name: n }).boundingBox(),
    ),
  );
  expect(name!.x).toBeGreaterThan(role!.x);
});

test("the scroll area keeps a visible edge under forced colors", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  const edge = await page
    .locator("pl-table >> [part=scroller]")
    .evaluate((el) => getComputedStyle(el).borderTopStyle);
  expect(edge).toBe("solid");
});

test("transitions are off under reduced motion", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--pl-duration",
      ),
    ),
  ).toContain("0s");
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    const root = await gotoStory(page, story, globals);
    await expectAccessible(root);
  });
}

test("axe finds no violations in an overflowing table", async ({ page }) => {
  await expectAccessible(await open(page, "data-table--overflow"));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page));
});

test("an interactive row shows a pointer and tints on hover", async ({
  page,
}) => {
  await open(page, "data-table--interactive-rows");
  for (const id of ["#row-interactive", "#row-linked"])
    expect(
      await page.locator(id).evaluate((el) => getComputedStyle(el).cursor),
    ).toBe("pointer");
  expect(
    await page
      .locator("#row-plain")
      .evaluate((el) => getComputedStyle(el).cursor),
  ).not.toBe("pointer");
  const cell = page.locator("#row-interactive > td");
  const before = await cell.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  await page.locator("#row-interactive").hover();
  await expect
    .poll(() => cell.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(before);
});

test("an interactive row rings on keyboard focus", async ({ page }) => {
  await open(page, "data-table--interactive-rows");
  await page.keyboard.press("Tab");
  await expect(page.locator("#row-interactive")).toBeFocused();
  expect(
    await page
      .locator("#row-interactive")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
  await page.keyboard.press("Tab");
  await expect(page.locator("#row-link")).toBeFocused();
  expect(
    await page
      .locator("#row-linked")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});

test("a stretched link covers its row", async ({ page }) => {
  await open(page, "data-table--interactive-rows");
  const box = (await page.locator("#row-linked").boundingBox())!;
  const link = (await page.locator("#row-link").boundingBox())!;
  expect(link.width).toBeLessThan(box.width);
  const covers = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x!, y!)?.id,
    [box.x + box.width - 4, box.y + box.height / 2],
  );
  expect(covers).toBe("row-link");
});

test("a sortable header is a sort control with a glyph that follows aria-sort", async ({
  page,
}) => {
  const root = await open(page, "data-table--sortable-headers");
  const glyphs = await page
    .locator("pl-table th[aria-sort] > button")
    .evaluateAll((buttons) =>
      buttons.map((b) => {
        const after = getComputedStyle(b, "::after");
        return {
          content: after.content,
          width: after.width,
          cursor: getComputedStyle(b).cursor,
          mask: after.maskImage || after.webkitMaskImage,
        };
      }),
    );
  for (const glyph of glyphs) {
    expect(glyph.content).toBe('""');
    expect(glyph.width).not.toBe("0px");
    expect(glyph.cursor).toBe("pointer");
  }
  expect(new Set(glyphs.map((g) => g.mask)).size).toBe(3);
  await expect(
    page.getByRole("columnheader", { name: "Name" }),
  ).toHaveAttribute("aria-sort", "ascending");
  await expectAccessible(root);
});

test("a sort button shows a focus ring", async ({ page }) => {
  await open(page, "data-table--sortable-headers");
  await page.keyboard.press("Tab");
  await expect(page.locator("#sort-name")).toBeFocused();
  expect(
    await page
      .locator("#sort-name")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});
