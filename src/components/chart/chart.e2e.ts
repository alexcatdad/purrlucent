import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = (name: string) => `components-chart--${name}`;

const label = "Monthly active users by plan, January to June, in users";

const svg = (page: Page) => page.locator("#chart svg");
const tooltip = (page: Page) => page.locator("#chart .ts-chart-tooltip");

/** Colors the drawing and the legend use, as 8-bit sRGB text so the two can be compared. */
const colors = (page: Page, drawn: string) =>
  page.locator("#chart").evaluate((host, selector) => {
    const ctx = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })!;
    const rgb = (css: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)].join(",");
    };
    const root = host.shadowRoot!;
    return {
      drawn: [...root.querySelectorAll(selector)].map((el) =>
        rgb(
          selector.startsWith("svg path[fill")
            ? getComputedStyle(el).fill
            : getComputedStyle(el).stroke,
        ),
      ),
      swatches: [...root.querySelectorAll("[part=swatch]")].map((el) =>
        rgb(getComputedStyle(el).backgroundColor),
      ),
    };
  }, drawn);

const lines = 'svg path[stroke^="var(--ts-chart-"]';
const slices = 'svg path[fill^="var(--ts-chart-"]';

test("the chart is a figure named by its label, and its drawing carries the same name", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.locator("#chart")).toHaveAttribute("role", "figure");
  await expect(page.locator("#chart")).toHaveAttribute("aria-label", label);
  await expect(svg(page)).toHaveAttribute("aria-label", label);
  await expect(svg(page)).toHaveAttribute("role", "img");
});

test("a description becomes the drawing's accessible description", async ({
  page,
}) => {
  await gotoStory(page, story("custom-definition"));
  await expect(page.locator("#chart svg > desc")).toHaveText(
    "Channels are sorted from most to fewest visits.",
  );
});

test("a chart without a label warns in the console", async ({ page }) => {
  await gotoStory(page, story("default"));
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await page.evaluate(() =>
    document.body.append(document.createElement("pl-chart")),
  );
  await expect.poll(() => warnings.join("\n")).toContain('"label"');
});

test("aria snapshot of the legend", async ({ page }) => {
  await gotoStory(page, story("default"));
  await expect(page.locator("#chart [part=legend]")).toMatchAriaSnapshot(`
    - list:
      - listitem: Free
      - listitem: Team
      - listitem: Business
  `);
});

test("the legend lists each series once, in the order the palette is handed out", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.locator("#chart [part=legend] li")).toHaveText([
    "Free",
    "Team",
    "Business",
  ]);
});

test("the legend colors are the colors of the drawing, line for line", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.locator(`#chart ${lines}`).first()).toBeAttached();
  const { drawn, swatches } = await colors(page, lines);
  expect(new Set(swatches).size).toBe(3);
  expect([...new Set(drawn)].sort()).toEqual([...new Set(swatches)].sort());
});

test("a donut's slices take the palette in order, as its legend lists them", async ({
  page,
}) => {
  await gotoStory(page, story("donut"));
  await expect(page.locator("#chart [part=legend] li")).toHaveText([
    "Search",
    "Direct",
    "Referral",
    "Social",
  ]);
  await expect(page.locator(`#chart ${slices}`).first()).toBeAttached();
  const { drawn, swatches } = await colors(page, slices);
  expect(new Set(swatches).size).toBe(4);
  expect(drawn).toEqual(swatches);
});

test("series colors come from the palette tokens, not from TanStack's defaults", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(page.locator(`#chart ${lines}`).first()).toBeAttached();
  const { drawn } = await colors(page, lines);
  // The fallbacks TanStack paints with when it finds no --ts-chart-N.
  const fallbacks = ["37,99,235", "249,115,22", "16,185,129"];
  expect(drawn.some((color) => fallbacks.includes(color))).toBe(false);
});

test("the palette follows the color scheme", async ({ page }) => {
  const drawnIn = async (theme: "light" | "dark") => {
    await page.emulateMedia({ colorScheme: theme });
    await gotoStory(page, story("default"), `theme:${theme}`);
    await expect(page.locator(`#chart ${lines}`).first()).toBeAttached();
    return (await colors(page, lines)).drawn;
  };
  expect(await drawnIn("dark")).not.toEqual(await drawnIn("light"));
});

test("every kind of chart draws and lists its values in a table", async ({
  page,
}) => {
  for (const name of ["default", "bar", "area", "donut", "wide-rows"]) {
    await gotoStory(page, story(name));
    await expect(
      page.locator("#chart svg").locator("path, rect").first(),
    ).toBeAttached();
    expect(await page.locator("#chart tbody tr").count()).toBeGreaterThan(0);
  }
});

test("wide rows draw one series per key", async ({ page }) => {
  await gotoStory(page, story("wide-rows"));
  await expect(page.locator("#chart [part=legend] li")).toHaveText([
    "desktop",
    "mobile",
  ]);
});

test("a native table of the same values is in the page for assistive technology", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const table = page.getByRole("table", { name: label });
  await expect(table).toHaveCount(1);
  await expect(table.locator("thead th")).toHaveText([
    "month",
    "Free",
    "Team",
    "Business",
  ]);
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await expect(table.locator("tbody tr").first().locator("th")).toHaveText(
    "Jan",
  );
  await expect(table.locator("tbody tr").first().locator("td")).toHaveText([
    "120",
    "80",
    "30",
  ]);
});

test("the table stays out of sight until show-table is set", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  const hidden = (await page.locator("#chart [part=data]").boundingBox())!;
  expect(hidden.width).toBeLessThanOrEqual(2);
  expect(hidden.height).toBeLessThanOrEqual(2);
  await gotoStory(page, story("show-table"));
  const shown = (await page.locator("#chart table").boundingBox())!;
  expect(shown.width).toBeGreaterThan(100);
  expect(shown.height).toBeGreaterThan(50);
});

test("a shown table pairs each value with its row and column heading", async ({
  page,
}) => {
  await gotoStory(page, story("show-table"));
  await expect(page.locator("#chart thead th")).toHaveText([
    "Channel",
    "Visits",
  ]);
  const row = page.getByRole("row", { name: /Search/ });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(/4.?200/);
});

test("a definition is drawn with the table of its rows", async ({ page }) => {
  await gotoStory(page, story("custom-definition"));
  await expect(page.locator("#chart svg rect").first()).toBeAttached();
  await expect(page.locator("#chart tbody tr")).toHaveCount(4);
});

test("a definition without a tooltip gets one", async ({ page }) => {
  await gotoStory(page, story("custom-definition"));
  await expect(svg(page)).toBeAttached();
  await svg(page).focus();
  await expect(tooltip(page)).toBeVisible();
});

test("the chart is one tab stop and its focus ring is visible", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(svg(page)).toHaveAttribute("tabindex", "0");
  await svg(page).focus();
  expect(
    await svg(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("focusing the chart shows a tooltip for its first point", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(svg(page)).toBeAttached();
  await svg(page).focus();
  await expect(tooltip(page)).toBeVisible();
  await expect(tooltip(page)).toContainText("Jan");
  await expect(tooltip(page)).toContainText("Free");
});

test("the arrow keys move through the points and the tooltip follows", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(svg(page)).toBeAttached();
  await svg(page).focus();
  await expect(tooltip(page)).toContainText("Jan");
  // Each press checks before the next, so the walk stops at the first Feb.
  await expect(async () => {
    await page.keyboard.press("ArrowRight");
    await expect(tooltip(page)).toContainText("Feb", { timeout: 500 });
  }).toPass();
});

test("Enter on a point fires pl-select with the row it came from", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await expect(svg(page)).toBeAttached();
  await page.locator("#chart").evaluate((el) => {
    const w = window as never as { selected: unknown[] };
    w.selected = [];
    el.addEventListener("pl-select", (e) =>
      w.selected.push((e as CustomEvent).detail),
    );
  });
  await svg(page).focus();
  await expect(tooltip(page)).toBeVisible();
  await page.keyboard.press("Enter");
  const selected = await page.evaluate(
    () =>
      (
        window as never as {
          selected: {
            x: string;
            y: number;
            series: string;
            datum: { month: string; plan: string; users: number };
          }[];
        }
      ).selected,
  );
  expect(selected).toHaveLength(1);
  expect(selected[0]!.x).toBe("Jan");
  expect(typeof selected[0]!.y).toBe("number");
  expect(["Free", "Team", "Business"]).toContain(selected[0]!.series);
  expect(selected[0]!.datum.month).toBe("Jan");
  expect(selected[0]!.datum.plan).toBe(selected[0]!.series);
});

test("under reduced motion new data is drawn at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoStory(page, story("default"));
  await expect(page.locator(`#chart ${lines}`).first()).toBeAttached();
  const line = () => page.locator(`#chart ${lines}`).first().getAttribute("d");
  const before = await line();
  await page.locator("#chart").evaluate(async (el) => {
    const chart = el as never as {
      data: { users: number }[];
      updateComplete: Promise<unknown>;
    };
    chart.data = chart.data.map((row) => ({ ...row, users: row.users * 3 }));
    await chart.updateComplete;
    // Two frames, so the inner element has drawn too.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
  const atOnce = await line();
  expect(atOnce).not.toBe(before);
  await page.waitForTimeout(500);
  expect(await line()).toBe(atOnce);
});

test("under forced colors the series use system colors and keep their focus ring", async ({
  page,
}) => {
  await gotoStory(page, story("default"));
  await page.emulateMedia({ forcedColors: "active" });
  expect(
    await page
      .locator("#chart")
      .evaluate((el) =>
        [1, 2, 3].map((n) =>
          getComputedStyle(el).getPropertyValue(`--pl-chart-${n}`).trim(),
        ),
      ),
  ).toEqual(["Highlight", "LinkText", "VisitedText"]);
  expect(
    await svg(page).evaluate((el) => getComputedStyle(el).forcedColorAdjust),
  ).toBe("none");
  await svg(page).focus();
  expect(
    await svg(page).evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
});

test("under rtl the legend and the table read from the right", async ({
  page,
}) => {
  await gotoStory(page, story("rtl"));
  const items = page.locator("#chart [part=legend] li");
  const first = (await items.first().boundingBox())!;
  const last = (await items.last().boundingBox())!;
  expect(first.x).toBeGreaterThan(last.x);
  const heads = page.locator("#chart thead th");
  const head = (await heads.first().boundingBox())!;
  const tail = (await heads.last().boundingBox())!;
  expect(head.x).toBeGreaterThan(tail.x);
});

test("every kind of chart passes axe", async ({ page }) => {
  for (const name of [
    "default",
    "bar",
    "area",
    "donut",
    "wide-rows",
    "show-table",
    "custom-definition",
  ])
    await expectAccessible(await gotoStory(page, story(name)));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("a shown table wraps without horizontal overflow at 200% text zoom", async ({
  page,
}) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("show-table")));
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("the chart's tab stop is far larger than the minimum target", async ({
    page,
  }) => {
    await gotoStory(page, story("default"));
    await expect(svg(page)).toBeAttached();
    const box = (await svg(page).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
