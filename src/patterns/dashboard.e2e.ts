import { expect, test, type Locator } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../e2e/helpers/story.ts";

const story = (name: string) => `patterns-dashboard--${name}`;

const table = (root: Locator) =>
  root.getByRole("table", { name: "Recent orders" });
const orderIds = (root: Locator) =>
  table(root).locator("tbody th[scope=row]").allTextContents();
const sortButton = (root: Locator, name: string) =>
  table(root).getByRole("button", { name, exact: true });
const rowMenu = (root: Locator, id: number) =>
  table(root).getByRole("button", {
    name: `Actions for order ${id}`,
    exact: true,
  });
const menuOf = (root: Locator, id: number) =>
  root.getByRole("menu", { name: `Order ${id}` });
const item = (root: Locator, name: string) =>
  root.getByRole("menuitem", { name, exact: true });
const note = (root: Locator) => root.locator("dashboard-demo p.note");
const tiles = (root: Locator) => root.locator("dashboard-demo ul.kpis > li");

/** Focus through the element, as a component may override locator.focus(). */
const focus = (target: Locator) => target.evaluate((el) => el.focus());
const tabStop = (target: Locator) => target.evaluate((el) => el.tabIndex >= 0);

for (const name of ["default", "narrow", "rtl", "glass"])
  test(`axe finds no WCAG 2.2 AA violations in ${name}`, async ({ page }) => {
    await expectAccessible(await gotoStory(page, story(name)));
  });

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await gotoStory(page, story("default")));
});

test("the screen has the sidebar, the header, four tiles, two charts and the table", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const nav = root.getByRole("navigation", { name: "Main" });
  await expect(nav.locator("pl-sidebar-item")).toHaveText([
    "Overview",
    "Customers",
    "Orders",
    "Settings",
  ]);
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(root.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(
    root.getByRole("combobox", { name: "Date range" }),
  ).toBeVisible();
  await expect(
    root.getByRole("button", { name: "Export report" }),
  ).toBeVisible();
  await expect(tiles(root)).toHaveCount(4);
  await expect(tiles(root).locator("pl-card")).toContainText([
    "Revenue",
    "Orders",
    "New customers",
    "Refund rate",
  ]);
  // A change is never shown by color alone: the badge says which way it went.
  await expect(tiles(root).locator("pl-badge")).toHaveText([
    "Up 9%",
    "Up 5%",
    "Up 1%",
    "Down 0.1 points",
  ]);
  const charts = root.locator("dashboard-demo pl-chart");
  await expect(charts).toHaveCount(2);
  await expect(charts.nth(0)).toHaveAttribute(
    "aria-label",
    "Revenue by week, last 8 weeks, in US dollars",
  );
  await expect(charts.nth(1)).toHaveAttribute(
    "aria-label",
    "Orders by channel, last 8 weeks, in orders",
  );
  await expect(table(root).locator("tbody tr")).toHaveCount(8);
  await expect(table(root).locator("tbody pl-badge").first()).toHaveText(
    "Paid",
  );
});

test("the sidebar sits beside the content and wraps to one column when narrow", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const side = (await root.locator("pl-sidebar").boundingBox())!;
  const main = (await root.locator("dashboard-demo main").boundingBox())!;
  expect(side.x + side.width).toBeLessThanOrEqual(main.x + 1);
  // Two charts share a row.
  const [first, second] = await root
    .locator("dashboard-demo .charts pl-card")
    .evaluateAll((cards) => cards.map((c) => c.getBoundingClientRect().top));
  expect(second).toBeCloseTo(first!, 0);
});

test("narrow: one column, the sidebar collapsed above the content", async ({
  page,
}) => {
  const root = await gotoStory(page, story("narrow"));
  const frame = (await root.locator("dashboard-demo").boundingBox())!;
  expect(frame.width).toBeLessThanOrEqual(361);
  await expect(root.locator("pl-sidebar")).toHaveAttribute("collapsed", "");
  const side = (await root.locator("pl-sidebar").boundingBox())!;
  const main = (await root.locator("dashboard-demo main").boundingBox())!;
  expect(side.y + side.height).toBeLessThanOrEqual(main.y + 1);
  const [a, b] = await tiles(root).evaluateAll((items) =>
    items.slice(0, 2).map((i) => {
      const box = i.getBoundingClientRect();
      return { x: box.left, y: box.top };
    }),
  );
  expect(b!.x).toBeCloseTo(a!.x, 0);
  expect(b!.y).toBeGreaterThan(a!.y);
  // The toggle brings the navigation back.
  await root.getByRole("button", { name: "Main navigation" }).click();
  await expect(root.getByRole("link", { name: "Customers" })).toBeVisible();
});

test("under rtl the sidebar sits at the right", async ({ page }) => {
  const root = await gotoStory(page, story("rtl"));
  const side = (await root.locator("pl-sidebar").boundingBox())!;
  const main = (await root.locator("dashboard-demo main").boundingBox())!;
  expect(side.x).toBeGreaterThanOrEqual(main.x + main.width - 1);
});

test("the date range changes the tiles and both charts", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(tiles(root).first()).toContainText("$319,500");
  await root.getByRole("combobox", { name: "Date range" }).click();
  await root.getByRole("option", { name: "Last 12 weeks" }).click();
  await expect(tiles(root).first()).toContainText("$452,000");
  await expect(tiles(root).nth(1)).toContainText("3,610");
  await expect(tiles(root).first()).toContainText("from the previous 12 weeks");
  const charts = root.locator("dashboard-demo pl-chart");
  await expect(charts.nth(0)).toHaveAttribute(
    "aria-label",
    "Revenue by week, last 12 weeks, in US dollars",
  );
  await expect(charts.nth(1)).toHaveAttribute(
    "aria-label",
    "Orders by channel, last 12 weeks, in orders",
  );
});

test("clicking a heading sorts the table and a second click reverses it", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  const heading = (name: string) =>
    table(root).getByRole("columnheader", { name, exact: true });
  await expect(heading("Order")).toHaveAttribute("aria-sort", "descending");
  expect((await orderIds(root))[0]).toBe("#1048");

  await sortButton(root, "Total").click();
  await expect(heading("Total")).toHaveAttribute("aria-sort", "ascending");
  await expect(heading("Order")).not.toHaveAttribute("aria-sort");
  expect(await orderIds(root)).toEqual([
    "#1042",
    "#1044",
    "#1047",
    "#1045",
    "#1048",
    "#1041",
    "#1046",
    "#1043",
  ]);

  await sortButton(root, "Total").click();
  await expect(heading("Total")).toHaveAttribute("aria-sort", "descending");
  expect((await orderIds(root))[0]).toBe("#1043");

  await sortButton(root, "Customer").click();
  await expect(heading("Customer")).toHaveAttribute("aria-sort", "ascending");
  expect(await orderIds(root)).toEqual([
    "#1046",
    "#1048",
    "#1044",
    "#1045",
    "#1047",
    "#1041",
    "#1043",
    "#1042",
  ]);
});

test("each row shows its status in words", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await expect(table(root).locator("tbody pl-badge")).toHaveText([
    "Paid",
    "Pending",
    "Paid",
    "Failed",
    "Refunded",
    "Paid",
    "Pending",
    "Paid",
  ]);
});

test.describe("keyboard", () => {
  test("the sidebar, the date select, the sort buttons and a row menu are tab stops", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    const stops = [
      root.getByRole("link", { name: "Overview" }),
      root.getByRole("combobox", { name: "Date range" }),
      root.getByRole("button", { name: "Export report" }),
      sortButton(root, "Order"),
      sortButton(root, "Customer"),
      sortButton(root, "Status"),
      sortButton(root, "Total"),
      rowMenu(root, 1048),
    ];
    for (const stop of stops) {
      expect(await tabStop(stop)).toBe(true);
      await focus(stop);
      await expect(stop).toBeFocused();
    }
  });

  test("Tab moves from the date select to the export button", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await focus(root.getByRole("combobox", { name: "Date range" }));
    await page.keyboard.press("Tab");
    await expect(
      root.getByRole("button", { name: "Export report" }),
    ).toBeFocused();
  });

  test("the date select opens with Enter and Escape closes it", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    const select = root.getByRole("combobox", { name: "Date range" });
    await focus(select);
    await page.keyboard.press("Enter");
    await expect(root.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(root.getByRole("listbox")).toBeHidden();
    await expect(select).toBeFocused();
  });

  test("Enter on a sort button sorts and keeps focus on it", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await focus(sortButton(root, "Customer"));
    await page.keyboard.press("Enter");
    await expect(
      table(root).getByRole("columnheader", { name: "Customer", exact: true }),
    ).toHaveAttribute("aria-sort", "ascending");
    expect((await orderIds(root))[0]).toBe("#1046");
    await expect(sortButton(root, "Customer")).toBeFocused();
  });

  test("a row menu opens with Enter and Escape closes it, returning focus", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    const trigger = rowMenu(root, 1048);
    await focus(trigger);
    await page.keyboard.press("Enter");
    await expect(menuOf(root, 1048)).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(item(root, "View")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menuOf(root, 1048)).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("row menu", () => {
  test("offers View, Refund and Delete", async ({ page }) => {
    const root = await gotoStory(page, story("default"));
    await rowMenu(root, 1048).click();
    await expect(root.getByRole("menuitem")).toHaveText([
      "View",
      "Refund",
      "Delete",
    ]);
  });

  test("Refund marks a paid order refunded and says so", async ({ page }) => {
    const root = await gotoStory(page, story("default"));
    await rowMenu(root, 1048).click();
    await item(root, "Refund").click();
    await expect(
      table(root).locator("tbody tr").first().locator("pl-badge"),
    ).toHaveText("Refunded");
    await expect(note(root)).toHaveText("Order 1048 refunded.");
    await expect(rowMenu(root, 1048)).toBeFocused();
  });

  test("Refund is unavailable for an order that is not paid", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await rowMenu(root, 1047).click();
    await expect(item(root, "Refund")).toHaveAttribute("aria-disabled", "true");
    await item(root, "Refund").click({ force: true });
    await expect(menuOf(root, 1047)).toBeVisible();
    await expect(note(root)).toHaveText("");
  });

  test("Delete removes the row and moves focus to the row that replaces it", async ({
    page,
  }) => {
    const root = await gotoStory(page, story("default"));
    await rowMenu(root, 1048).click();
    await item(root, "Delete").click();
    await expect(table(root).locator("tbody tr")).toHaveCount(7);
    expect((await orderIds(root))[0]).toBe("#1047");
    await expect(note(root)).toHaveText("Order 1048 deleted.");
    await expect(rowMenu(root, 1047)).toBeFocused();
  });

  test("View says which order is open", async ({ page }) => {
    const root = await gotoStory(page, story("default"));
    await rowMenu(root, 1046).click();
    await item(root, "View").click();
    await expect(note(root)).toHaveText("Viewing order 1046.");
  });
});

test("the export button reports the export", async ({ page }) => {
  const root = await gotoStory(page, story("default"));
  await root.getByRole("button", { name: "Export report" }).click();
  await expect(note(root)).toHaveText("Report exported.");
});

test("reduced motion and forced colors keep the dashboard usable", async ({
  page,
}) => {
  const root = await gotoStory(page, story("default"));
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await sortButton(root, "Total").click();
  expect((await orderIds(root))[0]).toBe("#1042");
});
