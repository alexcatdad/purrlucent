import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";
import type { PlDataTable } from "./data-table.ts";

const story = "data-data-table--default";

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.getByRole("table")).toBeVisible();
  return root;
};

/** Records the events of #control on window. */
const record = (page: Page, name: string) =>
  page.locator("pl-data-table#control").evaluate((el, type) => {
    const w = window as unknown as { events: unknown[] };
    w.events = [];
    el.addEventListener(type, (e) => w.events.push((e as CustomEvent).detail));
  }, name);

const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { events: unknown[] }).events);

const firstColumn = (page: Page) =>
  page
    .locator("pl-data-table#control tbody tr")
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
    .locator("pl-data-table#control")
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
  await page.locator("pl-data-table#control").evaluate((el) => {
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

test("sticky header: the scroll area shows whole rows", async ({ page }) => {
  await open(page, "data-data-table--sticky-header");
  const area = (await page
    .locator("pl-data-table pl-table >> [part=scroller]")
    .boundingBox())!;
  const rows = await page.locator("pl-data-table tbody tr").evaluateAll((els) =>
    els.map((el) => {
      const { top, bottom } = el.getBoundingClientRect();
      return { top, bottom };
    }),
  );
  // The scroller's 1px border sits inside its box.
  const [top, bottom] = [area.y + 1, area.y + area.height - 1];
  const cut = rows.filter((row) => {
    const shown = Math.min(row.bottom, bottom) - Math.max(row.top, top);
    return shown > 2 && shown < row.bottom - row.top - 2;
  });
  expect(cut).toEqual([]);
  expect(rows.some((row) => row.bottom <= bottom + 0.5)).toBe(true);
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
    .locator("pl-data-table#control")
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
    await page
      .locator("pl-data-table#control")
      .evaluate((el) => (el as Table).page),
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
  await expect(page.locator("pl-data-table#control tbody tr")).toHaveCount(1);
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

test("a 1,000-record table renders only 25 rows when pages change", async ({
  page,
}) => {
  await open(page, "data-data-table--large-paginated");
  const rows = page.locator("pl-data-table#control tbody tr");
  await expect(rows).toHaveCount(25);
  await expect(rows.first()).toContainText("SKU-0001");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(rows).toHaveCount(25);
  await expect(rows.first()).toContainText("SKU-0026");
  await page.getByRole("button", { name: "40", exact: true }).click();
  await expect(rows).toHaveCount(25);
  await expect(rows.first()).toContainText("SKU-0976");
  await expect(rows.last()).toContainText("SKU-1000");
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
});

test("the paged table reads each row key at most once per update", async ({
  page,
}) => {
  await open(page, "data-data-table--large-paginated");
  const keyReads = await page.locator("#control").evaluate(async (el) => {
    const table = el as PlDataTable;
    let reads = 0;
    table.rowKey = "lookupKey";
    table.rows = table.rows.map((row) => ({
      ...row,
      get lookupKey() {
        reads++;
        return row.id;
      },
    }));
    await table.updateComplete;
    return reads;
  });
  expect(keyReads).toBeLessThanOrEqual(1_000);
});

test("filter then page past the end clamps", async ({ page }) => {
  await open(page, paginated);
  await page.locator("pl-data-table#control").evaluate((el) => {
    (el as Table).page = 9;
  });
  await expect(
    page.getByRole("button", { name: "3", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(await firstColumn(page)).toEqual(["René Descartes"]);
  await page.locator("pl-data-table#control").evaluate((el) => {
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
  await page.locator("pl-data-table#control").evaluate((el) => {
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
  await expect(page.locator("pl-data-table#control thead tr")).toHaveCount(2);
});

test("model: group rows show the value and the count", async ({ page }) => {
  await open(page, grouped);
  const groups = page.locator("pl-data-table#control tr.group");
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
      .locator("pl-data-table#control .lead", { hasText: name })
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
  await expect(
    page.locator("pl-data-table#control tr[data-row-pin='top']"),
  ).toHaveCount(1);
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
  const footer = page.locator("pl-data-table#control tfoot td");
  await expect(footer).toHaveCount(3);
  await expect(footer.first()).toHaveText("Average");
  await expect(footer.first()).toHaveAttribute("colspan", "3");
  await expect(footer.nth(1)).toHaveText("98");
  await expect(footer.nth(2)).toHaveText("8.9");
});

test("model: a heading button reports pl-sort", async ({ page }) => {
  await open(page, grouped);
  await record(page, "pl-sort");
  await page.getByRole("button", { name: "Salary (k)", exact: true }).click();
  expect(await events(page)).toEqual([
    { column: "salary", direction: "ascending" },
  ]);
});

for (const id of [grouped, groupedRtl])
  test(`axe finds no violations in ${id}`, async ({ page }) => {
    await expectAccessible(await open(page, id));
  });

const interactive = "data-data-table--model-interactive";
const interactiveRtl = "data-data-table--model-interactive-rtl";

const headingMenu = (page: Page, heading: string) =>
  page.getByRole("button", {
    name: `Column options ${heading}`,
    exact: true,
  });

const menuItem = (page: Page, name: string, role = "menuitem") =>
  page.getByRole(role as "menuitem", { name, exact: true });

const menuActions: [string, string, string, object][] = [
  [
    "Role",
    "Sort descending",
    "pl-sort",
    { column: "role", direction: "descending" },
  ],
  ["Role", "Hide", "pl-column-visibility", { column: "role", visible: false }],
  ["Role", "Move earlier", "pl-column-order", { column: "role", index: 0 }],
  ["Role", "Move later", "pl-column-order", { column: "role", index: 2 }],
  ["Role", "Pin to start", "pl-column-pin", { column: "role", side: "start" }],
  ["Role", "Pin to end", "pl-column-pin", { column: "role", side: "end" }],
  ["Name", "Unpin", "pl-column-pin", { column: "name", side: null }],
  ["Role", "Group by", "pl-column-group", { column: "role", grouped: true }],
];

for (const [heading, item, event, detail] of menuActions)
  test(`model: ${heading} menu, ${item} fires ${event}`, async ({ page }) => {
    await open(page, interactive);
    await record(page, event);
    await headingMenu(page, heading).click();
    await menuItem(page, item).click();
    expect(await events(page)).toEqual([detail]);
  });

test("model: the first column cannot move earlier and a column cannot hide when it must stay", async ({
  page,
}) => {
  await open(page, interactive);
  await headingMenu(page, "Name").click();
  await expect(menuItem(page, "Move earlier")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(menuItem(page, "Hide")).toHaveCount(0);
});

test("model: the Columns menu has a checkbox per column and fires pl-column-visibility", async ({
  page,
}) => {
  await open(page, interactive);
  await record(page, "pl-column-visibility");
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  await expect(menuItem(page, "City", "menuitemcheckbox")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(menuItem(page, "Name", "menuitemcheckbox")).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await menuItem(page, "City", "menuitemcheckbox").click();
  expect(await events(page)).toEqual([{ column: "city", visible: false }]);
  await expect(page.getByRole("columnheader", { name: "City" })).toHaveCount(0);
});

test("model: a heading filter offers the facets and fires pl-filter with its column", async ({
  page,
}) => {
  await open(page, interactive);
  await record(page, "pl-filter");
  await page.getByRole("button", { name: "Filter Role, show options" }).click();
  await page
    .getByRole("option", { name: "Lead engineer", exact: true })
    .click();
  expect(await events(page)).toEqual([
    { value: "Lead engineer", column: "role" },
  ]);
  await expect(page.locator("pl-data-table#control tbody tr")).toHaveCount(1);
});

test("model: a row menu fires pl-row-pin", async ({ page }) => {
  await open(page, interactive);
  await record(page, "pl-row-pin");
  await page
    .getByRole("button", { name: "Row options Ada Lovelace", exact: true })
    .click();
  await menuItem(page, "Pin to top").click();
  await expect(
    page.locator("pl-data-table#control tr[data-row-pin='top']"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Row options Ada Lovelace", exact: true })
    .click();
  await menuItem(page, "Unpin row").click();
  expect(await events(page)).toEqual([
    { row: "ada", side: "top" },
    { row: "ada", side: null },
  ]);
});

const handle = (page: Page, heading: string) =>
  page.getByRole("separator", { name: `Resize ${heading}`, exact: true });

test("model: a resize handle is a vertical separator with its width", async ({
  page,
}) => {
  await open(page, interactive);
  await expect(handle(page, "Role")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
  await expect(handle(page, "Role")).toHaveAttribute("aria-valuenow", "200");
});

test("model: arrow keys on a resize handle fire pl-column-resize", async ({
  page,
}) => {
  await open(page, interactive);
  await record(page, "pl-column-resize");
  await handle(page, "Role").focus();
  await page.keyboard.press("ArrowRight");
  await expect(handle(page, "Role")).toHaveAttribute("aria-valuenow", "204");
  await page.keyboard.press("ArrowRight");
  await expect(handle(page, "Role")).toHaveAttribute("aria-valuenow", "208");
  await page.keyboard.press("ArrowLeft");
  await expect(handle(page, "Role")).toHaveAttribute("aria-valuenow", "204");
  expect(await events(page)).toEqual([
    { column: "role", width: 204 },
    { column: "role", width: 208 },
    { column: "role", width: 204 },
  ]);
});

test("model: RTL: the arrow keys widen away from the cell, to the left", async ({
  page,
}) => {
  await open(page, interactiveRtl);
  await handle(page, "Role").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(handle(page, "Role")).toHaveAttribute("aria-valuenow", "204");
});

/** Drags a handle by dx pixels with the mouse and returns the widths it reported. */
const drag = async (page: Page, dx: number) => {
  await record(page, "pl-column-resize");
  const box = (await handle(page, "Role").boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 5 });
  await page.mouse.up();
  const widths = (await events(page)) as { width: number }[];
  return widths.map((e) => e.width);
};

test("model: dragging the handle right widens a column", async ({ page }) => {
  await open(page, interactive);
  const widths = await drag(page, 40);
  expect(widths.length).toBeGreaterThan(0);
  expect(widths.at(-1)).toBeGreaterThan(200);
});

test("model: RTL: dragging the handle left fires a larger width", async ({
  page,
}) => {
  await open(page, interactiveRtl);
  const widths = await drag(page, -40);
  expect(widths.length).toBeGreaterThan(0);
  expect(widths.at(-1)).toBeGreaterThan(200);
});

const cell = (page: Page, id: string) =>
  page.locator(`pl-data-table#control td[data-cell="${id}"]`);

test("model: shift-click selects a rectangle", async ({ page }) => {
  await open(page, interactive);
  await record(page, "pl-cell-select");
  await cell(page, "ada-role").click();
  await cell(page, "grace-salary").click({ modifiers: ["Shift"] });
  expect((await events(page)).at(-1)).toEqual({
    cells: [
      "ada-role",
      "ada-city",
      "ada-salary",
      "grace-role",
      "grace-city",
      "grace-salary",
    ],
  });
  await expect(
    page.locator("pl-data-table#control td[data-selected]"),
  ).toHaveCount(6);
});

test("model: shift-arrow extends the range from the focused cell", async ({
  page,
}) => {
  await open(page, interactive);
  await record(page, "pl-cell-select");
  await cell(page, "ada-role").click();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(cell(page, "ada-city")).toBeFocused();
  await page.keyboard.press("Shift+ArrowDown");
  expect((await events(page)).at(-1)).toEqual({
    cells: ["ada-role", "ada-city", "grace-role", "grace-city"],
  });
});

test("model: every control is reachable with the keyboard", async ({
  page,
  browserName,
}) => {
  // WebKit's Tab order skips buttons by default; the other controls are covered above.
  test.skip(browserName === "webkit", "Tab skips buttons in WebKit");
  await open(page, interactive);
  await page.getByRole("button", { name: "Columns", exact: true }).focus();
  const seen = new Set<string>();
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    seen.add(
      await page.evaluate(() => {
        let el: Element | null = document.activeElement;
        while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
        return el?.getAttribute("aria-label") ?? el?.textContent?.trim() ?? "";
      }),
    );
  }
  for (const label of [
    "Name",
    "Column options Name",
    "Resize Name",
    "Column options Role",
    "Filter Role",
    "Resize Role",
    "Row options Ada Lovelace",
  ])
    expect(seen).toContain(label);
});

for (const id of [interactive, interactiveRtl])
  test(`axe finds no violations in ${id}`, async ({ page }) => {
    await expectAccessible(await open(page, id));
  });

const rich = "data-data-table--rich-cells";
const modelRich = "data-data-table--model-rich-cells";

test("rich cells: a renderer's template, Node and string replace the text", async ({
  page,
}) => {
  await open(page, rich);
  const table = page.locator("pl-data-table#control");
  await expect(table.locator("tbody td a[href]")).toHaveCount(4);
  await expect(
    table.getByRole("link", { name: "Ada Lovelace" }),
  ).toHaveAttribute("href", "#ada");
  await expect(table.locator("tbody td em")).toHaveText([
    "Mathematician",
    "Rear admiral",
    "Mathematician",
    "Engineer",
  ]);
  await expect(
    table.getByRole("checkbox", { name: "Verified Grace Hopper" }),
  ).toBeVisible();
  // The age text is replaced by the checkbox.
  await expect(table.locator("tbody")).not.toContainText("101");
});

test("rich cells: a checkbox in a cell toggles", async ({ page }) => {
  await open(page, rich);
  const box = page
    .locator("pl-data-table#control")
    .getByRole("checkbox", { name: "Verified Ada Lovelace" });
  await box.click();
  await expect(box).toBeChecked();
});

test("rich cells: a link in a cell is in the tab order", async ({ page }) => {
  await open(page, rich);
  const link = page
    .locator("pl-data-table#control")
    .getByRole("link", { name: "Ada Lovelace" });
  await page
    .locator("pl-data-table#control")
    .getByRole("columnheader", { name: "Age" })
    .getByRole("button")
    .focus();
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
});

test("model: rich cells show the renderer's content", async ({ page }) => {
  await open(page, modelRich);
  const table = page.locator("pl-data-table#control");
  await expect(table.locator("tbody a[href]")).toHaveCount(5);
  await expect(table.getByRole("link", { name: "Ada Lovelace" })).toBeVisible();
  await expect(table.getByRole("button", { name: "Map London" })).toBeVisible();
  // A cell the renderer leaves alone keeps its text.
  await expect(cell(page, "ada-role")).toHaveText("Mathematician");
});

test("model: arrow keys still move between cells that hold rich content", async ({
  page,
}) => {
  await open(page, modelRich);
  await cell(page, "ada-role").click();
  await page.keyboard.press("ArrowRight");
  await expect(cell(page, "ada-city")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(cell(page, "grace-city")).toBeFocused();
});

test("model: arrow keys inside a cell's control do not move the cell focus", async ({
  page,
}) => {
  await open(page, modelRich);
  const button = page
    .locator("pl-data-table#control")
    .getByRole("button", { name: "Map London" });
  await button.focus();
  await page.keyboard.press("ArrowRight");
  await expect(button).toBeFocused();
});

test("model: clicking a control in a cell does not select the cell", async ({
  page,
}) => {
  await open(page, modelRich);
  await record(page, "pl-cell-select");
  await page
    .locator("pl-data-table#control")
    .getByRole("button", { name: "Map London" })
    .click();
  expect(await events(page)).toEqual([]);
});

for (const id of [rich, modelRich])
  test(`axe finds no violations in ${id}`, async ({ page }) => {
    await expectAccessible(await open(page, id));
  });
