import { expect, test } from "@playwright/test";
import { expectAccessible } from "../../e2e/helpers/a11y.ts";

const product = "/kits/product-site/index.html";

test("the product site loads its screenshot, links to docs and exposes its FAQ", async ({
  page,
}) => {
  await page.goto(product);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(
    "Web components for your app.",
  );
  const dashboard = main.getByRole("img", { name: /analytics dashboard/i });
  await expect(dashboard).toHaveJSProperty("naturalWidth", 1280);
  await expect(
    main.getByRole("link", { name: "Browse components" }),
  ).toHaveAttribute("href", /^https:\/\/alexcatdad\.github\.io\/purrlucent\//);

  const item = main.locator('pl-accordion-item[value="framework"]');
  const faq = item.getByRole("button", {
    name: "Do I need a specific framework?",
    exact: true,
  });
  await expect(faq).toHaveAttribute("aria-expanded", "false");
  await faq.press("Enter");
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await expect(
    item.getByText("Purrlucent uses standard custom elements."),
  ).toBeVisible();
  await expectAccessible(page.locator("body"));

  await main.getByRole("link", { name: "Install", exact: true }).click();
  await expect(page).toHaveURL(/\/kits\/docs\/index\.html#install$/);
  await expect(
    page.getByRole("heading", { name: "Install the package" }),
  ).toBeVisible();
});

test("the mobile product menu closes on Escape and on an in-page link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(product);
  await page.locator("html").evaluate((el) => el.setAttribute("dir", "rtl"));

  const menu = page.locator(".kit-mobile-menu");
  const summary = menu.locator("summary");
  const link = menu.getByRole("link", { name: "Features" });
  await summary.press("Enter");
  await expect(link).toBeVisible();
  await link.press("Escape");
  await expect(menu).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();

  await summary.press("Space");
  await link.click();
  await expect(page).toHaveURL(/#features$/);
  await expect(menu).not.toHaveAttribute("open");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("the centered hero and compact footer have their own route", async ({
  page,
}) => {
  await page.goto("/kits/product-site/centered.html");
  await expect(page.locator(".product-hero-centered h1")).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "Docs" }),
  ).toBeVisible();
});
