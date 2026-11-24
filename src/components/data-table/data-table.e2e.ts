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
