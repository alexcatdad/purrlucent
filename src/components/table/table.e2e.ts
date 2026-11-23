import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "components-table--default";

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

test("an overflowing table is a named region the keyboard reaches and scrolls", async ({
  page,
}) => {
  await open(page, "components-table--overflow");
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
  await open(page, "components-table--labelled");
  await expect(page.getByRole("region", { name: "Pioneers" })).toBeVisible();
});

test("the sticky header stays at the top of the scroll area", async ({
  page,
}) => {
  await open(page, "components-table--sticky-header");
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
  await open(page, "components-table--rtl");
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
  await expectAccessible(await open(page, "components-table--overflow"));
});

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(await open(page));
});
