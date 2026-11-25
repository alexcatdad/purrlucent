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

type Page = import("@playwright/test").Page;

/** Resolves `property: value` (a token expression) to its computed value. */
const resolve = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const probe = document.createElement("div");
      probe.style.setProperty(p!, v!);
      document.body.append(probe);
      const resolved = getComputedStyle(probe).getPropertyValue(p!);
      probe.remove();
      return resolved;
    },
    [property, value],
  );

const background = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);

test("hidden text in a header cell does not widen the page at 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page, "data-table--screen-reader-cell");
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.inner);
  const scroller = page.locator("pl-table >> [part=scroller]");
  expect(await scroller.evaluate((el) => getComputedStyle(el).position)).toBe(
    "relative",
  );
});

/** Words that wrap inside themselves: a word whose text spans more than one line box. */
const brokenWords = (page: Page) =>
  page.locator("pl-table").evaluate((table) => {
    const broken: string[] = [];
    for (const cell of table.querySelectorAll("th, td")) {
      const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const lines = new Set(
            [...range.getClientRects()].map((rect) => Math.round(rect.top)),
          );
          if (lines.size > 1) broken.push(match[0]);
        }
      }
    }
    return broken;
  });

for (const width of [1280, 390]) {
  test(`no column is narrower than its longest word at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page, "data-table--word-widths");
    expect(await brokenWords(page)).toEqual([]);
  });
}

test("the sticky header still sticks inside the positioned scroll area", async ({
  page,
}) => {
  await open(page, "data-table--sticky-header");
  const cell = page.locator("pl-table thead th").first();
  expect(await cell.evaluate((el) => getComputedStyle(el).position)).toBe(
    "sticky",
  );
});

test("striped fills even body rows, and selection overrides the fill", async ({
  page,
}) => {
  await open(page, "data-table--striped");
  await expect(page.locator("pl-table")).toHaveAttribute("striped", "");
  const [odd, even, selected] = await Promise.all([
    background(page, "#row-1 > td"),
    background(page, "#row-2 > td"),
    background(page, "#row-4 > td"),
  ]);
  expect(even).not.toBe(odd);
  expect(selected).not.toBe(even);
  expect(await background(page, "#row-3 > td")).toBe(odd);
});

test("a row without striped has no alternate fill", async ({ page }) => {
  await open(page);
  expect(
    await page
      .locator("pl-table tbody tr:nth-child(2) > td")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe(
    await page
      .locator("pl-table tbody tr:nth-child(1) > td")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  );
});

test("aria-selected and data-selected rows share the selection tint", async ({
  page,
}) => {
  await open(page, "data-table--selected-rows");
  const [aria, data, plain] = await Promise.all([
    background(page, "#row-aria > td"),
    background(page, "#row-data > td"),
    background(page, "#row-plain > td"),
  ]);
  expect(aria).toBe(data);
  expect(aria).not.toBe(plain);
});

test("the table is a framed, raised panel with a hairline under the header", async ({
  page,
}) => {
  await open(page);
  const scroller = page.locator("pl-table >> [part=scroller]");
  const frame = await scroller.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      width: s.borderTopWidth,
      radius: s.borderTopLeftRadius,
      background: s.backgroundColor,
    };
  });
  expect(frame.width).toBe("1px");
  expect(frame.radius).toBe(
    await resolve(page, "border-radius", "var(--pl-radius-panel)"),
  );
  expect(frame.background).toBe(
    await resolve(page, "background-color", "var(--pl-color-raised)"),
  );
  const rule = await page
    .locator("pl-table thead th")
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.borderBottomWidth, s.borderBottomStyle];
    });
  expect(rule).toEqual(["1px", "solid"]);
});

test("header cells are small, semibold and secondary; rows keep a minimum size", async ({
  page,
}) => {
  await open(page, "data-table--regular");
  const head = await page
    .locator("pl-table thead th")
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { size: s.fontSize, weight: s.fontWeight, color: s.color };
    });
  const cellSize = await page
    .locator("pl-table tbody td")
    .first()
    .evaluate((el) => getComputedStyle(el).fontSize);
  expect(head.size).toBe(await resolve(page, "font-size", "var(--pl-text-xs)"));
  expect(Number.parseFloat(head.size)).toBeLessThan(
    Number.parseFloat(cellSize),
  );
  expect(Number(head.weight)).toBeGreaterThanOrEqual(600);
  expect(head.color).toBe(
    await resolve(page, "color", "var(--pl-color-muted-foreground)"),
  );
  const min = Number.parseFloat(
    await resolve(page, "block-size", "var(--pl-size-md)"),
  );
  const row = (await page.locator("#row-1").boundingBox())!;
  expect(row.height).toBeGreaterThanOrEqual(min - 1);
});

test("data-numeric aligns like align=end with tabular figures", async ({
  page,
}) => {
  await open(page, "data-table--regular");
  for (const selector of [
    "pl-table thead th[data-numeric]",
    "#row-1 > td[data-numeric]",
  ]) {
    const style = await page.locator(selector).evaluate((el) => {
      const s = getComputedStyle(el);
      return { align: s.textAlign, figures: s.fontVariantNumeric };
    });
    expect(style.align).toBe("end");
    expect(style.figures).toContain("tabular-nums");
  }
  const end = await page
    .locator("pl-table tbody td")
    .first()
    .evaluate((el) => getComputedStyle(el).textAlign);
  expect(end).toBe("start");
});

test("a plain link takes the accent and is underlined at rest", async ({
  page,
}) => {
  await open(page, "data-table--links");
  const link = page.locator("#plain-link");
  const style = await link.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, weight: s.fontWeight, line: s.textDecorationLine };
  });
  expect(style.color).toBe(
    await resolve(page, "color", "var(--pl-color-accent-text)"),
  );
  expect(Number(style.weight)).toBeGreaterThanOrEqual(600);
  expect(style.line).toBe("underline");
  await link.hover();
  await expect
    .poll(() => link.evaluate((el) => getComputedStyle(el).textDecorationLine))
    .toBe("underline");
  expect(
    await page
      .locator("#row-link")
      .evaluate((el) => getComputedStyle(el).color),
  ).not.toBe(style.color);
});

test("the header and link weights follow their custom properties", async ({
  page,
}) => {
  await open(page, "data-table--links");
  const weight = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).fontWeight);
  await page.locator("pl-table").evaluate((el) => {
    el.style.setProperty("--pl-table-header-weight", "400");
    el.style.setProperty("--pl-table-link-weight", "400");
  });
  expect(await weight("pl-table th")).toBe("400");
  expect(await weight("#plain-link")).toBe("400");
});

test("a stretched link still covers its row beside plain links", async ({
  page,
}) => {
  await open(page, "data-table--links");
  const box = (await page.locator("#row-linked").boundingBox())!;
  const covers = await page.evaluate(
    ([x, y]) => document.elementFromPoint(x!, y!)?.id,
    [box.x + box.width - 4, box.y + box.height / 2],
  );
  expect(covers).toBe("row-link");
});

test("compact density gives shorter rows than regular", async ({ page }) => {
  await open(page, "data-table--regular");
  const regular = (await page.locator("#row-1").boundingBox())!.height;
  await open(page, "data-table--compact");
  await expect(page.locator("pl-table")).toHaveAttribute("density", "compact");
  const compact = (await page.locator("#row-1").boundingBox())!.height;
  expect(compact).toBeLessThan(regular);
  const min = Number.parseFloat(
    await resolve(page, "block-size", "var(--pl-size-row)"),
  );
  expect(compact).toBeGreaterThanOrEqual(min - 1);
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
