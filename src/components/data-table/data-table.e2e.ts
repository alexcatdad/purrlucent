import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "data-data-table--default";

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.getByRole("table")).toBeVisible();
  return root;
};

/** Records the events of #control on window. */
const record = (page: Page, name: string) =>
  page.locator("#control").evaluate((el, type) => {
    const w = window as unknown as { events: unknown[] };
    w.events = [];
    el.addEventListener(type, (e) => w.events.push((e as CustomEvent).detail));
  }, name);

const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { events: unknown[] }).events);

const firstColumn = (page: Page) =>
  page
    .locator("#control tbody tr")
    .evaluateAll((trs) =>
      trs.map((tr) =>
        (tr.querySelector("td:not(.select)") as HTMLElement).innerText.trim(),
      ),
    );

test("aria snapshot", async ({ page }) => {
  const root = await open(page);
  await expect(root).toMatchAriaSnapshot(`
    - table "Pioneers":
      - rowgroup:
        - row "Name Role Age":
          - columnheader "Name":
            - button "Name"
          - columnheader "Role":
            - button "Role"
          - columnheader "Age":
            - button "Age"
  `);
});

test("a sortable heading is a button inside its th", async ({ page }) => {
  await open(page);
  await expect(page.locator("th > button")).toHaveCount(3);
  await expect(page.locator("th[aria-sort]")).toHaveCount(0);
});

test("a click sorts ascending, a second click reverses, and pl-sort reports it", async ({
  page,
}) => {
  await open(page);
  await record(page, "pl-sort");
  const heading = page.getByRole("columnheader", { name: "Name" });
  await heading.getByRole("button").click();
  await expect(heading).toHaveAttribute("aria-sort", "ascending");
  expect((await firstColumn(page))[0]).toBe("Ada Lovelace");
  await heading.getByRole("button").click();
  await expect(heading).toHaveAttribute("aria-sort", "descending");
  expect((await firstColumn(page))[0]).toBe("Margaret Hamilton");
  expect(await events(page)).toEqual([
    { column: "name", direction: "ascending" },
    { column: "name", direction: "descending" },
  ]);
});

test("only the sorted column carries aria-sort", async ({ page }) => {
  await open(page);
  await page
    .getByRole("columnheader", { name: "Name" })
    .getByRole("button")
    .click();
  await page
    .getByRole("columnheader", { name: "Age" })
    .getByRole("button")
    .click();
  await expect(page.locator("th[aria-sort]")).toHaveCount(1);
  await expect(page.getByRole("columnheader", { name: "Age" })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
});

test("numbers sort by value, not by text", async ({ page }) => {
  await open(page);
  await page
    .getByRole("columnheader", { name: "Age" })
    .getByRole("button")
    .click();
  expect(await firstColumn(page)).toEqual([
    "Ada Lovelace",
    "Grace Hopper",
    "Margaret Hamilton",
    "Katherine Johnson",
  ]);
});

test("a sorted attribute starts the table in that order", async ({ page }) => {
  await open(page, "data-data-table--sorted");
  await expect(page.getByRole("columnheader", { name: "Age" })).toHaveAttribute(
    "aria-sort",
    "descending",
  );
  expect((await firstColumn(page))[0]).toBe("Katherine Johnson");
});

test("manual-sort reports pl-sort and leaves the order", async ({ page }) => {
  await open(page);
  await page
    .locator("#control")
    .evaluate((el) => el.setAttribute("manual-sort", ""));
  await record(page, "pl-sort");
  const before = await firstColumn(page);
  await page
    .getByRole("columnheader", { name: "Age" })
    .getByRole("button")
    .click();
  expect(await firstColumn(page)).toEqual(before);
  expect(await events(page)).toEqual([
    { column: "age", direction: "ascending" },
  ]);
});

test("Tab reaches a heading and Enter and Space sort it", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Name" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("columnheader", { name: "Name" }),
  ).toHaveAttribute("aria-sort", "ascending");
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("columnheader", { name: "Name" }),
  ).toHaveAttribute("aria-sort", "descending");
});

const selectable = "data-data-table--selectable";

test("a row checkbox selects the row and pl-selection-change reports the keys", async ({
  page,
}) => {
  await open(page, selectable);
  await record(page, "pl-selection-change");
  await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
  expect(await events(page)).toEqual([{ keys: ["ada", "grace"] }]);
  await page.getByRole("checkbox", { name: "Select Grace Hopper" }).click();
  expect((await events(page)).at(-1)).toEqual({ keys: ["ada"] });
});

test("select all is mixed while some rows are selected", async ({ page }) => {
  await open(page, selectable);
  await expect(
    page.getByRole("checkbox", { name: "Select all" }),
  ).toHaveAttribute("aria-checked", "mixed");
});

test("select all selects every row, and again clears them", async ({
  page,
}) => {
  await open(page, selectable);
  await record(page, "pl-selection-change");
  const all = page.getByRole("checkbox", { name: "Select all" });
  await all.click();
  await expect(all).toHaveAttribute("aria-checked", "true");
  expect((await events(page)).at(-1)).toEqual({
    keys: ["ada", "grace", "katherine", "margaret"],
  });
  await all.click();
  await expect(all).toHaveAttribute("aria-checked", "false");
  expect((await events(page)).at(-1)).toEqual({ keys: [] });
});

test("selecting the last unselected row turns select all on", async ({
  page,
}) => {
  await open(page, selectable);
  for (const name of ["Ada Lovelace", "Katherine Johnson", "Margaret Hamilton"])
    await page.getByRole("checkbox", { name: `Select ${name}` }).click();
  await expect(
    page.getByRole("checkbox", { name: "Select all" }),
  ).toHaveAttribute("aria-checked", "true");
});

test("the checkbox's own events do not leave the table", async ({ page }) => {
  await open(page, selectable);
  await page.locator("#control").evaluate((el) => {
    const w = window as unknown as { leaked: string[] };
    w.leaked = [];
    for (const type of ["pl-change", "input"])
      el.addEventListener(type, () => w.leaked.push(type));
  });
  await page.getByRole("checkbox", { name: "Select Ada Lovelace" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { leaked: string[] }).leaked,
    ),
  ).toEqual([]);
});

test("a selected row is marked by its checkbox and a fill", async ({
  page,
}) => {
  await open(page, selectable);
  await expect(page.locator("tr[data-selected]")).toHaveCount(1);
  await expect(
    page.getByRole("checkbox", { name: "Select Grace Hopper" }),
  ).toHaveAttribute("aria-checked", "true");
});

test("the empty slot shows when there are no rows", async ({ page }) => {
  await open(page, "data-data-table--empty");
  await expect(page.getByText("Nobody matches this filter.")).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Select all" }),
  ).toBeDisabled();
  await expect(page.locator("td[colspan='4']")).toHaveCount(1);
});

test("the sticky header stays at the top while the rows scroll", async ({
  page,
}) => {
  await open(page, "data-data-table--sticky-header");
  const scroller = page.locator("pl-data-table pl-table >> [part=scroller]");
  await scroller.evaluate((el) => (el.scrollTop = 60));
  const [head, area] = await Promise.all([
    page.getByRole("columnheader", { name: "Name" }).boundingBox(),
    scroller.boundingBox(),
  ]);
  expect(Math.abs(head!.y - area!.y)).toBeLessThanOrEqual(3);
});

test("under rtl the first column is on the right", async ({ page }) => {
  await open(page, "data-data-table--rtl");
  const [name, role] = await Promise.all(
    ["Name", "Role"].map((n) =>
      page.getByRole("columnheader", { name: n }).boundingBox(),
    ),
  );
  expect(name!.x).toBeGreaterThan(role!.x);
});

test("the focus ring on a heading stays visible under forced colors", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  await page.keyboard.press("Tab");
  expect(
    await page
      .getByRole("button", { name: "Name" })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});

test("a heading button meets the minimum hit size", async ({ page }) => {
  await open(page);
  const box = await page.getByRole("button", { name: "Name" }).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(24);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a heading button is at least 44 high", async ({ page }) => {
    await open(page);
    const box = await page.getByRole("button", { name: "Name" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(await open(page, selectable, globals));
  });
}

test("axe finds no violations in a sorted table", async ({ page }) => {
  await expectAccessible(await open(page, "data-data-table--sorted"));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page));
});

const filterable = "data-data-table--filterable";
const paginated = "data-data-table--paginated";

const engineers = ["Margaret Hamilton", "Mary Jackson", "Radia Perlman"];

type Table = HTMLElement & { page: number; filter: string };

const setAttr = (page: Page, name: string, value = "") =>
  page
    .locator("#control")
    .evaluate((el, [n, v]) => el.setAttribute(n!, v!), [name, value]);

const filterField = (page: Page) =>
  page.getByRole("searchbox", { name: "Filter" });

test("filter narrows rows and resets the page", async ({ page }) => {
  await open(page, filterable);
  await setAttr(page, "page-size", "4");
  await page.getByRole("button", { name: "2", exact: true }).click();
  expect((await firstColumn(page))[0]).toBe("Mary Jackson");
  await record(page, "pl-filter");
  await filterField(page).fill("engineer");
  expect(await firstColumn(page)).toEqual(engineers);
  expect(await events(page)).toEqual([{ value: "engineer" }]);
  expect(
    await page.locator("#control").evaluate((el) => (el as Table).page),
  ).toBe(1);
});

test("filter ignores case and accents", async ({ page }) => {
  await open(page, filterable);
  await filterField(page).fill("RENE");
  expect(await firstColumn(page)).toEqual(["René Descartes"]);
});

test("no matches shows the empty state", async ({ page }) => {
  await open(page, filterable);
  await filterField(page).fill("zzz");
  await expect(page.getByText("Nobody matches this filter.")).toBeVisible();
  await expect(page.locator("#control tbody tr")).toHaveCount(1);
});

test("select all acts on the filtered rows", async ({ page }) => {
  await open(page, filterable);
  await setAttr(page, "selectable");
  await filterField(page).fill("engineer");
  await record(page, "pl-selection-change");
  await page.getByRole("checkbox", { name: "Select all" }).click();
  expect((await events(page)).at(-1)).toEqual({
    keys: ["margaret", "mary", "radia"],
  });
});

test("pagination moves through rows", async ({ page }) => {
  await open(page, paginated);
  expect(await firstColumn(page)).toHaveLength(4);
  expect((await firstColumn(page))[0]).toBe("Ada Lovelace");
  await record(page, "pl-page");
  await page.getByRole("button", { name: "Next page" }).click();
  expect((await firstColumn(page))[0]).toBe("Mary Jackson");
  await page.getByRole("button", { name: "3", exact: true }).click();
  expect(await firstColumn(page)).toEqual(["René Descartes"]);
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  expect(await events(page)).toEqual([{ page: 2 }, { page: 3 }]);
});

test("filter then page past the end clamps", async ({ page }) => {
  await open(page, paginated);
  await page.locator("#control").evaluate((el) => {
    (el as Table).page = 9;
  });
  await expect(
    page.getByRole("button", { name: "3", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(await firstColumn(page)).toEqual(["René Descartes"]);
  await page.locator("#control").evaluate((el) => {
    (el as Table).filter = "engineer";
  });
  await expect(
    page.getByRole("button", { name: "1", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(await firstColumn(page)).toEqual(engineers);
});

test("the inner controls' events do not leave the table", async ({ page }) => {
  await open(page, filterable);
  await setAttr(page, "page-size", "4");
  await page.locator("#control").evaluate((el) => {
    const w = window as unknown as { leaked: string[] };
    w.leaked = [];
    for (const type of ["pl-change", "pl-input", "input", "change"])
      el.addEventListener(type, () => w.leaked.push(type));
  });
  await filterField(page).fill("a");
  await filterField(page).blur();
  await page.getByRole("button", { name: "Next page" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { leaked: string[] }).leaked,
    ),
  ).toEqual([]);
});

for (const id of [filterable, paginated])
  test(`axe finds no violations in ${id}`, async ({ page }) => {
    await expectAccessible(await open(page, id));
  });

const grouped = "data-data-table--model-grouped";
const groupedRtl = "data-data-table--model-grouped-rtl";

test("model: header groups render with colspan", async ({ page }) => {
  await open(page, grouped);
  await expect(
    page.getByRole("columnheader", { name: "Person" }),
  ).toHaveAttribute("colspan", "3");
  await expect(
    page.getByRole("columnheader", { name: "Numbers" }),
  ).toHaveAttribute("colspan", "2");
  await expect(page.locator("#control thead tr")).toHaveCount(2);
});

test("model: group rows show the value and the count", async ({ page }) => {
  await open(page, grouped);
  const groups = page.locator("#control tr.group");
  await expect(groups).toHaveCount(2);
  await expect(groups.first()).toContainText("Engineering");
  await expect(groups.first().locator(".count")).toHaveText("3");
  await expect(groups.last()).toContainText("Design");
  await expect(groups.last().locator(".count")).toHaveText("2");
});

test("model: the expand button toggles aria-expanded and fires pl-expand", async ({
  page,
}) => {
  await open(page, grouped);
  const button = page.getByRole("button", { name: "Expand Design" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("Hedy Lamarr")).toHaveCount(0);
  await record(page, "pl-expand");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Hedy Lamarr")).toBeVisible();
  expect(await events(page)).toEqual([{ row: "design", expanded: true }]);
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  expect((await events(page)).at(-1)).toEqual({
    row: "design",
    expanded: false,
  });
});

test("model: child rows are indented under their group", async ({ page }) => {
  await open(page, grouped);
  const marker = (name: string) =>
    page
      .locator("#control .lead", { hasText: name })
      .first()
      .locator(".expand");
  const [group, child] = await Promise.all([
    marker("Engineering").boundingBox(),
    marker("Ada Lovelace").boundingBox(),
  ]);
  expect(child!.x).toBeGreaterThan(group!.x);
});

test("model: the table keeps native table semantics", async ({ page }) => {
  await open(page, grouped);
  await expect(page.getByRole("grid")).toHaveCount(0);
  await expect(page.getByRole("table", { name: "Teams" })).toBeVisible();
});

test("model: a pinned row is marked", async ({ page }) => {
  await open(page, grouped);
  await expect(page.locator("#control tr[data-row-pin='top']")).toHaveCount(1);
});

const scroller = (page: Page) =>
  page.locator("pl-data-table pl-table >> [part=scroller]");

test("model: the pinned column stays visible while scrolling horizontally", async ({
  page,
}) => {
  await open(page, grouped);
  await scroller(page).evaluate((el) => el.scrollBy(200, 0));
  const [name, score, area] = await Promise.all([
    page.getByRole("columnheader", { name: "Name" }).boundingBox(),
    page.getByRole("columnheader", { name: "Score" }).boundingBox(),
    scroller(page).boundingBox(),
  ]);
  expect(Math.abs(name!.x - area!.x)).toBeLessThanOrEqual(3);
  expect(
    Math.abs(score!.x + score!.width - (area!.x + area!.width)),
  ).toBeLessThanOrEqual(3);
});

test("model: under rtl the pinned column sits at the right edge", async ({
  page,
}) => {
  await open(page, groupedRtl);
  await scroller(page).evaluate((el) => el.scrollBy(-200, 0));
  const [name, area] = await Promise.all([
    page.getByRole("columnheader", { name: "Name" }).boundingBox(),
    scroller(page).boundingBox(),
  ]);
  expect(
    Math.abs(name!.x + name!.width - (area!.x + area!.width)),
  ).toBeLessThanOrEqual(3);
});

test("model: the footer shows aggregates", async ({ page }) => {
  await open(page, grouped);
  const footer = page.locator("#control tfoot td");
  await expect(footer).toHaveCount(3);
  await expect(footer.first()).toHaveText("Average");
  await expect(footer.first()).toHaveAttribute("colspan", "3");
  await expect(footer.nth(1)).toHaveText("98");
  await expect(footer.nth(2)).toHaveText("8.9");
});

test("model: a heading button reports pl-sort", async ({ page }) => {
  await open(page, grouped);
  await record(page, "pl-sort");
  await page.getByRole("button", { name: "Salary (k)" }).click();
  expect(await events(page)).toEqual([
    { column: "salary", direction: "ascending" },
  ]);
});

for (const id of [grouped, groupedRtl])
  test(`axe finds no violations in ${id}`, async ({ page }) => {
    await expectAccessible(await open(page, id));
  });
