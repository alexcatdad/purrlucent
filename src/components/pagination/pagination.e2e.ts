import { expect, test, type Page } from "@playwright/test";
import {
  expectAccessible,
  expectNoOverflowAtTextZoom,
} from "../../../e2e/helpers/a11y.ts";
import { gotoStory } from "../../../e2e/helpers/story.ts";

const story = "navigation-pagination--default";

const open = async (page: Page, id = story, globals = "") => {
  const root = await gotoStory(page, id, globals);
  await expect(page.locator("pl-pagination .control").first()).toBeVisible();
  return root;
};

const item = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });

const record = (page: Page) =>
  page.locator("#control").evaluate((el) => {
    const log: string[] = [];
    (window as unknown as { log: string[] }).log = log;
    for (const type of ["pl-change", "input", "change"])
      el.addEventListener(type, (e) =>
        log.push(
          type === "pl-change"
            ? `${type}:${(e as CustomEvent<{ page: number }>).detail.page}`
            : type,
        ),
      );
  });

const log = (page: Page) =>
  page.evaluate(() => (window as unknown as { log: string[] }).log);

test("the landmark is named and the current page is marked", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("navigation", { name: "Pagination" }),
  ).toBeVisible();
  await expect(item(page, "1")).toHaveAttribute("aria-current", "page");
  await expect(item(page, "2")).not.toHaveAttribute("aria-current", "page");
});

test("Previous is disabled at the first page and Next at the last", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled();
  await open(page, "navigation-pagination--last-page");
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Previous page" }),
  ).toBeEnabled();
});

test("a long range stays seven items wide with ellipses", async ({ page }) => {
  await open(page, "navigation-pagination--many");
  const control = page.locator("pl-pagination");
  await expect(control.locator(".control[part~=page]")).toHaveText([
    "1",
    "9",
    "10",
    "11",
    "20",
  ]);
  await expect(control.locator(".gap")).toHaveCount(2);
  await expect(item(page, "10")).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(control.locator(".control[part~=page]")).toHaveText([
    "1",
    "10",
    "11",
    "12",
    "20",
  ]);
});

test("a click fires pl-change once, then input and change", async ({
  page,
}) => {
  await open(page);
  await record(page);
  await item(page, "3").click();
  await item(page, "3").click();
  await expect(item(page, "3")).toHaveAttribute("aria-current", "page");
  expect(await log(page)).toEqual(["pl-change:3", "input", "change"]);
});

test("Previous and Next step one page and focus moves to the page if the button is off", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(item(page, "2")).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Previous page" }).focus();
  await page.keyboard.press("Enter");
  await expect(item(page, "1")).toHaveAttribute("aria-current", "page");
  // Previous is now disabled; focus does not fall to the page.
  await expect(item(page, "1")).toBeFocused();
});

test("Tab reaches the pages in order and Enter activates one", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Tab"); // Previous is disabled and skipped
  await expect(item(page, "1")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(item(page, "2")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(item(page, "2")).toHaveAttribute("aria-current", "page");
  await expect(item(page, "2")).toBeFocused();
});

test("with href-template the pages are links with addresses", async ({
  page,
}) => {
  await open(page, "navigation-pagination--links");
  const link = (name: string) => page.getByRole("link", { name, exact: true });
  await expect(link("3")).toHaveAttribute("href", "#/posts?page=3");
  await expect(link("3")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Next page" })).toHaveAttribute(
    "href",
    "#/posts?page=4",
  );
  await record(page);
  await link("5").click();
  expect(await log(page)).toEqual(["pl-change:5", "input", "change"]);
});

test("a link click with a modifier key changes nothing", async ({ page }) => {
  await open(page, "navigation-pagination--links");
  await record(page);
  await page
    .getByRole("link", { name: "5", exact: true })
    .click({ modifiers: ["Shift"] });
  expect(await log(page)).toEqual([]);
  await expect(
    page.getByRole("link", { name: "3", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("a page out of range is clamped and the label can be changed", async ({
  page,
}) => {
  const root = await open(page);
  await root.evaluate(async (el) => {
    const pagination = document.createElement("pl-pagination");
    pagination.id = "other";
    pagination.setAttribute("page", "99");
    pagination.setAttribute("total", "4");
    pagination.setAttribute("label", "Results");
    el.append(pagination);
    await (pagination as unknown as { updateComplete: Promise<boolean> })
      .updateComplete;
  });
  await expect(page.locator("#other")).toHaveJSProperty("page", 4);
  await expect(page.getByRole("navigation", { name: "Results" })).toBeVisible();
});

test("under rtl the first page is at the right edge", async ({ page }) => {
  await open(page, "navigation-pagination--rtl");
  const [first, last] = await Promise.all(
    ["1", "20"].map((name) => item(page, name).boundingBox()),
  );
  expect(first!.x).toBeGreaterThan(last!.x);
});

test("the current page stays visible under forced colors", async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: "active" });
  const background = (name: string) =>
    item(page, name).evaluate((el) => getComputedStyle(el).backgroundColor);
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("div"));
    probe.style.cssText = "background: Highlight; forced-color-adjust: none";
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect.poll(() => background("1")).toBe(highlight);
  expect(await background("2")).not.toBe(highlight);
});

test.describe("coarse pointer on a wide screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: true });

  test("a coarse pointer keeps each control at 44 by 44", async ({ page }) => {
    await open(page);
    for (const name of ["1", "2", "Next page"]) {
      const box = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

for (const globals of ["", "material:glass", "theme:dark", "contrast:more"]) {
  test(`axe finds no WCAG 2.2 AA violations (${globals || "default"})`, async ({
    page,
  }) => {
    await expectAccessible(
      await open(page, "navigation-pagination--many", globals),
    );
  });
}

test("no horizontal overflow at 200% text zoom", async ({ page }) => {
  await expectNoOverflowAtTextZoom(
    await open(page, "navigation-pagination--many"),
  );
});
