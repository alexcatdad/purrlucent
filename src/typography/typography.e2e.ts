import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
  spokenPhrases,
} from "../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = (name: string) => `foundations-typography--${name}`;

const style = (page: import("@playwright/test").Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        size: Number.parseFloat(s.fontSize),
        weight: Number(s.fontWeight),
        lineHeight: Number.parseFloat(s.lineHeight),
        textAlign: s.textAlign,
      };
    });

test("aria snapshot", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(root).toMatchAriaSnapshot(`
    - article:
      - heading "Caring for a cat" [level=1]
      - heading "Text styles" [level=2]
      - heading "Fifth level" [level=5]
      - heading "Sixth level" [level=6]
      - heading "Daily routine" [level=2]
      - blockquote
      - heading "Meals" [level=3]
      - table
      - heading "Notes" [level=4]
      - figure
      - separator
      - group
      - heading "Text colors" [level=2]
  `);
});

const elements = [
  "mark",
  "del",
  "ins",
  "s",
  "sub",
  "sup",
  "abbr[title]",
  "q",
  "cite",
  "kbd",
  "time",
  "dl",
  "dt",
  "dd",
  "figure",
  "figcaption",
  "hr",
  "address",
  "details",
  "summary",
  "pre",
  "small",
  ".lead",
];

test("the article uses every listed element", async ({ page }) => {
  await gotoStory(page, story("default"));
  for (const selector of elements)
    await expect(
      page.locator(`#prose ${selector}`).first(),
      selector,
    ).toBeAttached();
});

// cite and s are left out: the .pl-prose rules for them repeat the browser
// default (italic, line-through), so no computed property can tell them apart.
const compared = elements.filter(
  (selector) => !["cite", "s"].includes(selector),
);

test("every prose element is styled", async ({ page }) => {
  await gotoStory(page, story("default"));
  const same = await page.locator("#prose").evaluate((prose, selectors) => {
    const props = [
      "display",
      "font-size",
      "font-style",
      "font-weight",
      "line-height",
      "color",
      "background-color",
      "text-decoration-line",
      "text-decoration-style",
      "text-underline-offset",
      "cursor",
      "margin-block-start",
      "padding-block-start",
      "padding-inline-start",
      "border-top-width",
    ];
    // The clone sits outside .pl-prose, inside a wrapper that passes on the
    // text settings .pl-prose sets, so only the element's own prose rule can
    // make the two differ.
    const container = getComputedStyle(prose);
    const wrapper = document.createElement("div");
    wrapper.style.color = container.color;
    wrapper.style.fontFamily = container.fontFamily;
    wrapper.style.fontSize = container.fontSize;
    wrapper.style.fontWeight = container.fontWeight;
    wrapper.style.lineHeight = container.lineHeight;
    document.body.append(wrapper);
    const unstyled: string[] = [];
    for (const selector of selectors) {
      const el = prose.querySelector(selector)!;
      const clone = el.cloneNode(true) as Element;
      wrapper.append(clone);
      const a = getComputedStyle(el);
      const b = getComputedStyle(clone);
      if (props.every((p) => a.getPropertyValue(p) === b.getPropertyValue(p)))
        unstyled.push(selector);
      clone.remove();
    }
    wrapper.remove();
    return unstyled;
  }, compared);
  expect(same).toEqual([]);
});

test("headings step down in size and every heading is bold", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const [h1, h2, h3, p] = [
    await style(page, "#prose h1"),
    await style(page, "#prose h2"),
    await style(page, "#prose h3"),
    await style(page, "#prose > p:not(.lead)"),
  ];
  expect(h1.size).toBeGreaterThan(h2.size);
  expect(h2.size).toBeGreaterThan(h3.size - 0.01);
  expect(h3.size).toBeGreaterThanOrEqual(p.size);
  for (const heading of [h1, h2, h3])
    expect(heading.weight).toBeGreaterThanOrEqual(600);
});

test("no text is lighter than regular weight", async ({ page }) => {
  await gotoStory(page, story("default"));
  const weights = await page
    .locator("#prose, #prose *")
    .evaluateAll((els) =>
      els.map((el) => Number(getComputedStyle(el).fontWeight)),
    );
  for (const weight of weights) expect(weight).toBeGreaterThanOrEqual(400);
});

test("body text is at least 13 CSS pixels and code is not smaller than 12", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  expect(
    (await style(page, "#prose > p:not(.lead)")).size,
  ).toBeGreaterThanOrEqual(13);
  expect((await style(page, "#prose code")).size).toBeGreaterThanOrEqual(12);
});

test("paragraphs use loose leading and every line height clears the font size", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const p = await style(page, "#prose > p:not(.lead)");
  const li = await style(page, "#prose li");
  expect(p.lineHeight).toBeGreaterThan(li.lineHeight);
  const rows = await page
    .locator("#prose :is(h1, h2, h3, h4, p, li, td, th)")
    .evaluateAll((els) =>
      els.map((el) => {
        const s = getComputedStyle(el);
        return Number.parseFloat(s.lineHeight) / Number.parseFloat(s.fontSize);
      }),
    );
  for (const ratio of rows) expect(ratio).toBeGreaterThanOrEqual(1.1);
});

test("lists, quotes, code and tables are styled", async ({ page }) => {
  await gotoStory(page, story("default"));
  const parts = await page.locator("#prose").evaluate((el) => {
    const get = (sel: string, prop: string) =>
      getComputedStyle(el.querySelector(sel)!).getPropertyValue(prop);
    return {
      bullet: get("ul", "list-style-type"),
      number: get("ol", "list-style-type"),
      quote: get("blockquote", "border-inline-start-style"),
      code: get("code", "font-family"),
      collapse: get("table", "border-collapse"),
      header: get("th", "font-weight"),
    };
  });
  expect(parts).toMatchObject({
    bullet: "disc",
    number: "decimal",
    quote: "solid",
    collapse: "collapse",
    header: "600",
  });
  expect(parts.code).toContain("monospace");
});

test("text aligns to the start edge under right-to-left", async ({ page }) => {
  await gotoStory(page, story("rtl"));
  expect((await style(page, "#prose th")).textAlign).toBe("start");
  const { cell, table } = await page.locator("#prose").evaluate((el) => ({
    cell: el.querySelector("th")!.getBoundingClientRect().right,
    table: el.querySelector("table")!.getBoundingClientRect().right,
  }));
  expect(cell).toBeCloseTo(table, 0);
});

test("the quote bar sits on the start edge and flips under right-to-left", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const side = await page.locator("#prose blockquote").evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.borderRightStyle, s.borderLeftStyle];
  });
  expect(side).toEqual(["solid", "none"]);
});

test("links keep a system color under forced colors", async ({ page }) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  const underline = await page
    .locator("#prose a")
    .first()
    .evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(underline).toBe("underline");
});

test("axe finds no WCAG 2.2 AA violations", async ({ page }) => {
  await expectAccessible(await gotoStory(page, story("default")));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("virtual screen reader speaks the headings", async ({ page }) => {
  await gotoStory(page, story("default"));
  const spoken = (await spokenPhrases(page)).join(" | ");
  expect(spoken).toContain("Caring for a cat");
  expect(spoken).toContain("heading");
});
